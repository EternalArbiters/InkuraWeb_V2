"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaPaperPlane } from "react-icons/fa";
import Image from "next/image";

type Message = {
  from: "elya" | "user";
  role: "ADMIN" | "USER" | "elya"; // tambahkan "elya" agar tidak error
  text: string;
};

export default function ChatElyaPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "elya",
      role: "elya",
      text: "Halo~ Aku di sini untuk mendengarkanmu ",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  
  const username = "noelephgoddess";
  const userRole = username === "noelephgoddess" ? "ADMIN" : "USER";

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      from: "user",
      role: userRole,
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, user_id: username }),
      });

      const data = await res.json().catch(() => ({ reply: null }));

      const elyaMessage: Message = {
        from: "elya",
        role: "elya",
        text: data.reply || "Elya tidak bisa membalas (⁠╥⁠﹏⁠╥⁠)",
      };

      setMessages((prev) => [...prev, elyaMessage]);
    } catch (error) {
      console.error("Gagal menghubungi Elyanna:", error);
      setMessages((prev) => [
        ...prev,
        {
          from: "elya",
          role: "elya",
          text: "Elya sedang kesulitan menjawab... (⁠╥⁠﹏⁠╥⁠)",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col transition-colors duration-500
        bg-[linear-gradient(to_bottom_right,#fce4ec,#ede7f6,#e3f2fd)] 
        dark:bg-[linear-gradient(to_bottom_right,#0a0a1a,#151629,#1b1c34)]
        text-black dark:text-white"
    >
      {/* Header */}
      <header className="px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md flex items-center justify-between fixed top-0 left-0 right-0 z-30">
        <h1 className="text-lg font-bold">Chat Elya~</h1>
        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Online</span>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-24 space-y-4">
        {messages.map((msg, i) => {
          const isFromElya = msg.from === "elya";
          const isFromAdmin = msg.role === "ADMIN";

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex ${isFromElya ? "items-start" : "justify-end"}`}
            >
              {isFromElya && (
                <Image
                  src="/images/elie-avatar.jpg"
                  alt="Elya"
                  width={32}
                  height={32}
                  className="rounded-full border border-white/40 mr-2 mt-1"
                />
              )}
              <div
                className={`
                  px-4 py-2 rounded-xl shadow backdrop-blur-sm text-sm break-words whitespace-pre-wrap
                  max-w-[80%] sm:max-w-[70%] lg:max-w-[60%]
                  ${isFromElya
                    ? "bg-white/50 dark:bg-white/10 text-black dark:text-white"
                    : isFromAdmin
                    ? "bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 dark:from-yellow-900 dark:via-pink-900 dark:to-purple-900 border-2 border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 font-semibold"
                    : "bg-pink-500 text-white self-end"
                  }
                `}
              >
                {isFromAdmin && <span className="text-xs opacity-70">Hahaue:</span>}
                <div>{msg.text}</div>
              </div>
            </motion.div>
          );
        })}

        {typing && (
          <motion.div
            className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Image
              src="/images/elie-avatar.jpg"
              alt="typing"
              width={24}
              height={24}
              className="rounded-full border border-white/30"
            />
            <span>Elya sedang mengetik...</span>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-white/80 dark:bg-gray-900/90 backdrop-blur-md border-t border-white/20 transition-colors duration-500">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tulis sesuatu untuk Elya..."
            className="flex-1 px-4 py-2 rounded-full text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none text-black dark:text-white"
          />
          <button
            onClick={handleSend}
            className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-110 transition shadow"
            aria-label="Kirim pesan"
          >
            <FaPaperPlane size={14} />
          </button>
        </div>
      </footer>
    </main>
  );
}
