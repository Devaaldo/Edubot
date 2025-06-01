from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
import spacy
import re
from datetime import datetime
import json

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
except:
    pass

from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = Flask(__name__)
CORS(app)

# Initialize NLP tools
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("English model not found. Install with: python -m spacy download en_core_web_sm")
    nlp = None

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english') + stopwords.words('indonesian'))

class Edubot:
    def __init__(self):
        self.faq_data = {
            # Matematika
            "apa itu aljabar": "Aljabar adalah cabang matematika yang menggunakan huruf dan simbol untuk mewakili angka dalam persamaan dan rumus. Contoh: x + 5 = 10",
            "cara menghitung luas lingkaran": "Luas lingkaran = π × r². Di mana π ≈ 3.14 dan r adalah jari-jari lingkaran.",
            "rumus pythagoras": "Teorema Pythagoras: a² + b² = c², di mana c adalah sisi miring (hipotenusa) segitiga siku-siku.",
            "cara faktoring": "Faktoring adalah memecah persamaan menjadi faktor-faktor. Contoh: x² - 4 = (x+2)(x-2)",
            
            # Bahasa Inggris
            "perbedaan present tense dan past tense": "Present tense untuk kejadian sekarang (I eat), past tense untuk kejadian yang sudah lewat (I ate).",
            "cara membuat kalimat passive voice": "Passive voice: Object + to be + past participle. Contoh: 'The book is read by me'",
            "apa itu subject verb agreement": "Subject-verb agreement adalah aturan bahwa subjek dan kata kerja harus sesuai dalam jumlah (singular/plural).",
            "perbedaan adjective dan adverb": "Adjective menjelaskan kata benda (big house), adverb menjelaskan kata kerja/adjective (run quickly).",
            
            # Fisika
            "hukum newton pertama": "Hukum Newton I: Benda akan tetap diam atau bergerak lurus beraturan kecuali ada gaya yang bekerja padanya.",
            "rumus kecepatan": "Kecepatan = Jarak ÷ Waktu (v = s/t)",
            "apa itu energi kinetik": "Energi kinetik adalah energi yang dimiliki benda karena gerakannya. Rumus: Ek = ½mv²",
            
            # Umum
            "cara belajar efektif": "Tips belajar efektif: 1) Buat jadwal teratur, 2) Gunakan teknik pomodoro, 3) Buat catatan, 4) Praktek soal, 5) Istirahat cukup.",
            "motivasi belajar": "Ingatlah tujuan Anda, rayakan kemajuan kecil, belajar bersama teman, dan ingat bahwa setiap kesalahan adalah pembelajaran!"
        }
        
        self.subject_keywords = {
            'matematika': ['math', 'matematika', 'hitung', 'rumus', 'aljabar', 'geometri', 'kalkulus', 'statistik'],
            'bahasa_inggris': ['english', 'inggris', 'grammar', 'tense', 'vocabulary', 'speaking', 'writing'],
            'fisika': ['fisika', 'physics', 'gaya', 'energi', 'newton', 'gerak', 'listrik'],
            'kimia': ['kimia', 'chemistry', 'reaksi', 'unsur', 'molekul', 'atom'],
            'biologi': ['biologi', 'biology', 'sel', 'organ', 'tumbuhan', 'hewan', 'genetika']
        }
        
        # Initialize TF-IDF vectorizer for similarity matching
        self.vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
        self.faq_questions = list(self.faq_data.keys())
        self.faq_vectors = self.vectorizer.fit_transform(self.faq_questions)
        
    def preprocess_text(self, text):
        """Preprocess input text"""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s]', '', text)
        tokens = word_tokenize(text)
        tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stop_words]
        return ' '.join(tokens)
    
    def identify_subject(self, text):
        """Identify the subject based on keywords"""
        text_lower = text.lower()
        for subject, keywords in self.subject_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                return subject.replace('_', ' ').title()
        return "Umum"
    
    def find_best_faq_match(self, question, threshold=0.3):
        """Find the best matching FAQ using cosine similarity"""
        processed_question = self.preprocess_text(question)
        question_vector = self.vectorizer.transform([processed_question])
        
        similarities = cosine_similarity(question_vector, self.faq_vectors).flatten()
        best_match_idx = np.argmax(similarities)
        best_similarity = similarities[best_match_idx]
        
        if best_similarity > threshold:
            best_question = self.faq_questions[best_match_idx]
            return self.faq_data[best_question], best_similarity
        
        return None, 0
    
    def generate_response(self, question, mode='auto'):
        """Generate response based on question and mode"""
        subject = self.identify_subject(question)
        
        if mode == 'faq':
            # FAQ mode - only search in predefined FAQs
            answer, confidence = self.find_best_faq_match(question)
            if answer:
                return {
                    'answer': answer,
                    'subject': subject,
                    'confidence': float(confidence),
                    'mode': 'faq',
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return {
                    'answer': "Maaf, pertanyaan Anda tidak ditemukan dalam FAQ. Coba mode tanya langsung atau reformulasi pertanyaan Anda.",
                    'subject': subject,
                    'confidence': 0.0,
                    'mode': 'faq',
                    'timestamp': datetime.now().isoformat()
                }
        
        elif mode == 'direct' or mode == 'auto':
            # Direct mode - try FAQ first, then generate custom response
            answer, confidence = self.find_best_faq_match(question)
            
            if answer and confidence > 0.5:
                return {
                    'answer': answer,
                    'subject': subject,
                    'confidence': float(confidence),
                    'mode': 'faq_match',
                    'timestamp': datetime.now().isoformat()
                }
            else:
                # Generate custom response based on subject
                custom_answer = self.generate_custom_response(question, subject)
                return {
                    'answer': custom_answer,
                    'subject': subject,
                    'confidence': 0.7,
                    'mode': 'direct',
                    'timestamp': datetime.now().isoformat()
                }
    
    def generate_custom_response(self, question, subject):
        """Generate custom response based on subject and question analysis"""
        question_lower = question.lower()
        
        # Mathematics responses
        if 'matematika' in subject.lower():
            if any(word in question_lower for word in ['cara', 'bagaimana', 'how']):
                return f"Untuk mempelajari topik matematika yang Anda tanyakan, saya sarankan: 1) Pahami konsep dasar terlebih dahulu, 2) Latihan soal secara bertahap, 3) Gunakan contoh konkret, 4) Jangan ragu bertanya jika ada yang tidak dipahami."
            elif any(word in question_lower for word in ['rumus', 'formula']):
                return "Untuk rumus matematika yang spesifik, silakan sebutkan topik yang lebih detail. Saya dapat membantu dengan aljabar, geometri, trigonometri, kalkulus, dan statistik."
        
        # English responses
        elif 'inggris' in subject.lower():
            if any(word in question_lower for word in ['grammar', 'tata bahasa']):
                return "Untuk grammar bahasa Inggris, fokus pada: 1) Tenses (waktu), 2) Subject-verb agreement, 3) Parts of speech, 4) Sentence structure. Praktik dengan contoh kalimat sehari-hari."
            elif any(word in question_lower for word in ['vocabulary', 'kosakata']):
                return "Cara meningkatkan vocabulary: 1) Baca teks bahasa Inggris setiap hari, 2) Catat kata baru dan artinya, 3) Gunakan dalam kalimat, 4) Review secara berkala."
        
        # Physics responses
        elif 'fisika' in subject.lower():
            return "Untuk memahami fisika dengan baik: 1) Pahami konsep dasarnya, bukan hanya rumus, 2) Kaitkan dengan fenomena sehari-hari, 3) Latihan soal dengan variasi, 4) Gambar diagram untuk memvisualisasikan masalah."
        
        # General learning advice
        return f"Pertanyaan Anda tentang {subject} menarik! Saya sarankan untuk: 1) Mulai dari konsep dasar, 2) Cari sumber belajar yang reliable, 3) Praktik secara konsisten, 4) Diskusi dengan teman atau guru. Bisa Anda sebutkan aspek spesifik yang ingin dipelajari?"

# Initialize chatbot
edubot = Edubot()

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        question = data.get('question', '').strip()
        mode = data.get('mode', 'auto')  # auto, faq, direct
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        response = edubot.generate_response(question, mode)
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/faq', methods=['GET'])
def get_faq():
    """Get all FAQ questions and categories"""
    try:
        faq_by_category = {}
        for question, answer in edubot.faq_data.items():
            subject = edubot.identify_subject(question)
            if subject not in faq_by_category:
                faq_by_category[subject] = []
            faq_by_category[subject].append({
                'question': question,
                'answer': answer
            })
        
        return jsonify(faq_by_category)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    """Get available subjects"""
    subjects = list(edubot.subject_keywords.keys())
    subjects = [s.replace('_', ' ').title() for s in subjects]
    return jsonify({'subjects': subjects})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    print("🤖 Edubot is starting...")
    print("📚 Loaded FAQ entries:", len(edubot.faq_data))
    print("🔍 Available subjects:", list(edubot.subject_keywords.keys()))
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)