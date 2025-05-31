import React, { useState, useEffect, useRef } from "react";
import {
	Send,
	Book,
	MessageCircle,
	HelpCircle,
	Lightbulb,
	Clock,
	User,
	Bot,
} from "lucide-react";

const Edubot = () => {
	const [messages, setMessages] = useState([]);
	const [inputMessage, setInputMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [mode, setMode] = useState("auto");
	const [faqData, setFaqData] = useState({});
	const [showFAQ, setShowFAQ] = useState(false);
	const messagesEndRef = useRef(null);

	// Sample FAQ data (would normally come from API)
	const sampleFAQ = {
		Matematika: [
			{
				question: "Apa itu aljabar?",
				answer:
					"Aljabar adalah cabang matematika yang menggunakan huruf dan simbol untuk mewakili angka dalam persamaan dan rumus.",
			},
			{
				question: "Cara menghitung luas lingkaran?",
				answer:
					"Luas lingkaran = π × r². Di mana π ≈ 3.14 dan r adalah jari-jari lingkaran.",
			},
			{
				question: "Rumus Pythagoras?",
				answer:
					"Teorema Pythagoras: a² + b² = c², di mana c adalah sisi miring (hipotenusa) segitiga siku-siku.",
			},
		],
		"Bahasa Inggris": [
			{
				question: "Perbedaan present tense dan past tense?",
				answer:
					"Present tense untuk kejadian sekarang (I eat), past tense untuk kejadian yang sudah lewat (I ate).",
			},
			{
				question: "Cara membuat passive voice?",
				answer:
					"Passive voice: Object + to be + past participle. Contoh: 'The book is read by me'",
			},
		],
		Fisika: [
			{
				question: "Hukum Newton pertama?",
				answer:
					"Hukum Newton I: Benda akan tetap diam atau bergerak lurus beraturan kecuali ada gaya yang bekerja padanya.",
			},
			{
				question: "Rumus kecepatan?",
				answer: "Kecepatan = Jarak ÷ Waktu (v = s/t)",
			},
		],
	};

	useEffect(() => {
		setFaqData(sampleFAQ);
		// Welcome message
		setMessages([
			{
				id: 1,
				type: "bot",
				content:
					"Halo! Saya Edubot 🤖, asisten belajar Anda. Saya siap membantu menjawab pertanyaan tentang Matematika, Bahasa Inggris, Fisika, dan mata pelajaran lainnya. Silakan tanya apa saja!",
				timestamp: new Date(),
				subject: "Umum",
			},
		]);
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const sendMessage = async () => {
		if (!inputMessage.trim() || isLoading) return;

		const userMessage = {
			id: Date.now(),
			type: "user",
			content: inputMessage,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputMessage("");
		setIsLoading(true);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const botResponse = simulateResponse(inputMessage, mode);

			const botMessage = {
				id: Date.now() + 1,
				type: "bot",
				content: botResponse.answer,
				subject: botResponse.subject,
				confidence: botResponse.confidence,
				mode: botResponse.mode,
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, botMessage]);
		} catch (error) {
			const errorMessage = {
				id: Date.now() + 1,
				type: "bot",
				content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
				timestamp: new Date(),
				isError: true,
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	const simulateResponse = (question, mode) => {
		const questionLower = question.toLowerCase();

		// Simple keyword matching for demo
		if (questionLower.includes("aljabar")) {
			return {
				answer:
					"Aljabar adalah cabang matematika yang menggunakan huruf dan simbol untuk mewakili angka dalam persamaan dan rumus. Contoh: x + 5 = 10. Dalam aljabar, kita mencari nilai variabel yang tidak diketahui.",
				subject: "Matematika",
				confidence: 0.9,
				mode: "faq_match",
			};
		} else if (
			questionLower.includes("tense") ||
			questionLower.includes("grammar")
		) {
			return {
				answer:
					"Grammar bahasa Inggris memiliki berbagai tenses. Present tense untuk kejadian sekarang (I study), past tense untuk kejadian lampau (I studied), future tense untuk kejadian akan datang (I will study).",
				subject: "Bahasa Inggris",
				confidence: 0.85,
				mode: "faq_match",
			};
		} else if (
			questionLower.includes("newton") ||
			questionLower.includes("fisika")
		) {
			return {
				answer:
					"Hukum Newton terdiri dari 3 hukum: 1) Hukum Inersia - benda diam akan tetap diam, 2) F = ma - gaya sama dengan massa kali percepatan, 3) Aksi-Reaksi - setiap aksi memiliki reaksi yang sama besar namun berlawanan arah.",
				subject: "Fisika",
				confidence: 0.8,
				mode: "faq_match",
			};
		} else if (
			questionLower.includes("belajar") ||
			questionLower.includes("tips")
		) {
			return {
				answer:
					"Tips belajar efektif: 1) Buat jadwal belajar yang konsisten, 2) Gunakan teknik Pomodoro (25 menit fokus, 5 menit istirahat), 3) Buat catatan dengan metode yang sesuai untuk Anda, 4) Aktif bertanya dan diskusi, 5) Evaluasi pemahaman secara berkala.",
				subject: "Tips Belajar",
				confidence: 0.75,
				mode: "direct",
			};
		} else {
			return {
				answer: `Pertanyaan yang menarik! Saya akan coba membantu dengan topik "${question}". Untuk pemahaman yang lebih baik, coba jelaskan lebih spesifik apa yang ingin Anda pelajari. Saya bisa membantu dengan Matematika, Bahasa Inggris, Fisika, dan mata pelajaran lainnya.`,
				subject: "Umum",
				confidence: 0.6,
				mode: "direct",
			};
		}
	};

	const handleFAQClick = (faqItem) => {
		const userMessage = {
			id: Date.now(),
			type: "user",
			content: faqItem.question,
			timestamp: new Date(),
		};

		const botMessage = {
			id: Date.now() + 1,
			type: "bot",
			content: faqItem.answer,
			subject: "FAQ",
			confidence: 1.0,
			mode: "faq",
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage, botMessage]);
		setShowFAQ(false);
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	const getModeIcon = (msgMode) => {
		switch (msgMode) {
			case "faq":
				return <Book className="w-3 h-3" />;
			case "direct":
				return <MessageCircle className="w-3 h-3" />;
			default:
				return <Lightbulb className="w-3 h-3" />;
		}
	};

	const getModeColor = (msgMode) => {
		switch (msgMode) {
			case "faq":
				return "text-blue-600";
			case "direct":
				return "text-green-600";
			default:
				return "text-purple-600";
		}
	};

	return (
		<div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			{/* Header */}
			<div className="bg-white shadow-lg border-b border-indigo-200">
				<div className="max-w-4xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className="bg-indigo-600 p-2 rounded-full">
								<Bot className="w-6 h-6 text-white" />
							</div>
							<div>
								<h1 className="text-xl font-bold text-gray-800">Edubot</h1>
								<p className="text-sm text-gray-600">AI Konsultasi Belajar</p>
							</div>
						</div>

						<div className="flex items-center space-x-2">
							{/* Mode Selector */}
							<select
								value={mode}
								onChange={(e) => setMode(e.target.value)}
								className="px-3 py-1 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
							>
								<option value="auto">Mode Auto</option>
								<option value="faq">Mode FAQ</option>
								<option value="direct">Mode Langsung</option>
							</select>

							{/* FAQ Toggle */}
							<button
								onClick={() => setShowFAQ(!showFAQ)}
								className={`p-2 rounded-lg transition-colors ${
									showFAQ
										? "bg-indigo-600 text-white"
										: "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
								}`}
							>
								<HelpCircle className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className="flex flex-1 max-w-4xl mx-auto w-full">
				{/* FAQ Sidebar */}
				{showFAQ && (
					<div className="w-80 bg-white border-r border-indigo-200 overflow-y-auto">
						<div className="p-4">
							<h3 className="font-semibold text-gray-800 mb-4">
								Pertanyaan Umum (FAQ)
							</h3>

							{Object.entries(faqData).map(([category, items]) => (
								<div key={category} className="mb-4">
									<h4 className="font-medium text-indigo-600 mb-2 text-sm">
										{category}
									</h4>
									<div className="space-y-2">
										{items.map((item, index) => (
											<button
												key={index}
												onClick={() => handleFAQClick(item)}
												className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-200 hover:border-indigo-300"
											>
												{item.question}
											</button>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Chat Area */}
				<div className="flex-1 flex flex-col">
					{/* Messages */}
					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{messages.map((message) => (
							<div
								key={message.id}
								className={`flex ${
									message.type === "user" ? "justify-end" : "justify-start"
								}`}
							>
								<div
									className={`max-w-xs lg:max-w-md ${
										message.type === "user" ? "order-2" : "order-1"
									}`}
								>
									<div
										className={`px-4 py-2 rounded-lg ${
											message.type === "user"
												? "bg-indigo-600 text-white"
												: message.isError
												? "bg-red-100 text-red-800 border border-red-200"
												: "bg-white text-gray-800 border border-gray-200 shadow-sm"
										}`}
									>
										<p className="text-sm">{message.content}</p>

										{/* Bot message details */}
										{message.type === "bot" && !message.isError && (
											<div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
												<div className="flex items-center space-x-2 text-xs text-gray-500">
													{message.mode && (
														<div
															className={`flex items-center space-x-1 ${getModeColor(
																message.mode
															)}`}
														>
															{getModeIcon(message.mode)}
															<span>{message.mode}</span>
														</div>
													)}
													{message.subject && (
														<span className="bg-gray-100 px-2 py-1 rounded-full">
															{message.subject}
														</span>
													)}
												</div>

												{message.confidence && (
													<div className="text-xs text-gray-400">
														{Math.round(message.confidence * 100)}%
													</div>
												)}
											</div>
										)}
									</div>

									<div
										className={`flex items-center space-x-1 mt-1 text-xs text-gray-400 ${
											message.type === "user" ? "justify-end" : "justify-start"
										}`}
									>
										{message.type === "user" ? (
											<User className="w-3 h-3" />
										) : (
											<Bot className="w-3 h-3" />
										)}
										<Clock className="w-3 h-3" />
										<span>{message.timestamp.toLocaleTimeString()}</span>
									</div>
								</div>
							</div>
						))}

						{isLoading && (
							<div className="flex justify-start">
								<div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
									<div className="flex items-center space-x-2">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
										<span className="text-sm text-gray-600">
											Edubot sedang berpikir...
										</span>
									</div>
								</div>
							</div>
						)}

						<div ref={messagesEndRef} />
					</div>

					{/* Input Area */}
					<div className="border-t border-gray-200 bg-white p-4">
						<div className="flex space-x-3">
							<textarea
								value={inputMessage}
								onChange={(e) => setInputMessage(e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder="Tanyakan sesuatu tentang pelajaran..."
								className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
								rows="1"
								disabled={isLoading}
							/>
							<button
								onClick={sendMessage}
								disabled={!inputMessage.trim() || isLoading}
								className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<Send className="w-5 h-5" />
							</button>
						</div>

						<div className="flex items-center justify-between mt-2 text-xs text-gray-500">
							<span>
								Mode:{" "}
								{mode === "auto"
									? "Otomatis"
									: mode === "faq"
									? "FAQ Only"
									: "Tanya Langsung"}
							</span>
							<span>Tekan Enter untuk kirim</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Edubot;
