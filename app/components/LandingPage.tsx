"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faPaintBrush,
  faHeart,
  faTrophy,
  faUsers,
  faFilm,
  faShieldAlt,
  faInfinity,
  faUserPlus,
  faCompass,
  faGlobe,
  faImage,
  faLock,
  faRobot,
  faUpload
} from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faTwitter, faDiscord } from "@fortawesome/free-brands-svg-icons";
import { Menu, X } from "lucide-react";
import { FaArrowUp } from "react-icons/fa";
import { useAuthModal } from "@/hooks/useAuthModal";
import AuthModal from "@/hooks/AuthModal";

const Features = [
  {
    icon: faBookOpen,
    title: "Read Comics and Light Novels",
    description:
      "Access original works from creators across the globe and enjoy exciting stories every day.",
    color: "#1D4ED8", // biru
  },
  {
    icon: faFilm,
    title: "Watch Animation & Drama",
    description:
      "Stream your favorite anime and dramas legally in the highest quality.",
    color: "#DC2626", // merah
  },
  {
    icon: faPaintBrush,
    title: "Fanart & Artwork Upload",
    description:
      "Share your visual works such as illustrations, zines, and comics to the community.",
    color: "#F59E0B", // oranye
  },
  {
    icon: faHeart,
    title: "Donate to Creator",
    description:
      "Support your favorite creators and translators through the donation & premium system.",
    color: "#EC4899", // pink
  },
  {
    icon: faTrophy,
    title: "Event & Premium",
    description:
      "Join community competitions and events, and get exclusive premium access.",
    color: "#10B981", // hijau toska
  },
  {
    icon: faUsers,
    title: "Active Community",
    description:
      "Have fun discussions, create a group, or chat with other creators & fans!",
    color: "#6366F1", // ungu indigo
  },
];

export default function LandingPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { onOpen } = useAuthModal(); // cukup ambil onOpen, karena isOpen dipakai di AuthModal

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = localStorage.getItem("theme") === "dark";
      setIsDarkMode(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newMode ? "dark" : "light");
      document.documentElement.classList.toggle("dark", newMode);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main>
      <AuthModal /> 

      <header className="w-full fixed top-0 left-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 shadow-md transition-all duration-300 border-b border-transparent dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between space-x-4">

          {/* Logo */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Image src="/logo-inkura.png" alt="Logo Inkura" width={40} height={40} />
            <span className="text-2xl font-bold text-gray-800 dark:text-white tracking-wide">INKURA</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8 text-[15px] font-semibold text-gray-700 dark:text-gray-200 flex-1 justify-center">
            <a href="#Feature" className="hover:text-primary transition">Feature</a>
            <a href="#Why" className="hover:text-primary transition">Why Inkura</a>
            <a href="#Content" className="hover:text-primary transition">Content</a>
            <a href="#Flow" className="hover:text-primary transition">Flow</a>
            <a href="#premium" className="hover:text-primary transition">Premium</a>
            <a href="#Community" className="hover:text-primary transition">Community</a>
          </nav>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-x-4 pl-4 flex-shrink-0">
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle Theme"
              className={`w-14 h-8 rounded-full flex items-center px-1 transition focus:outline-none shadow-inner ${isDarkMode
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 justify-end"
                : "bg-gray-300 justify-start"
                }`}
            >
              <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                {isDarkMode ? "" : ""}
              </div>
            </button>

            <button
              onClick={() => onOpen("login")}
              className="px-4 py-2 border dark:border-gray-600 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Login
            </button>
            <button
              onClick={() => onOpen("signup")}
              className="px-4 py-2 text-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-md hover:brightness-110 transition"
            >
              Signup
            </button>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-800 dark:text-white">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden px-6 pb-4 space-y-4 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">
            <br />
            <a href="#Feature" className="block hover:text-primary transition">Feature</a>
            <a href="#Why" className="block hover:text-primary transition">Why Inkura</a>
            <a href="#Content" className="block hover:text-primary transition">Content</a>
            <a href="#Flow" className="block hover:text-primary transition">Flow</a>
            <a href="#premium" className="block hover:text-primary transition">Premium</a>
            <a href="#Community" className="block hover:text-primary transition">Community</a>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={toggleDarkMode}
                aria-label="Toggle Theme"
                className={`w-14 h-8 rounded-full flex items-center px-1 transition focus:outline-none shadow-inner ${isDarkMode ? "bg-gradient-to-r from-indigo-600 to-purple-600 justify-end" : "bg-gray-300 justify-start"}`}
              >
                <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                  {isDarkMode ? "" : ""}
                </div>
              </button>
              <br />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onOpen("login")}
                  className="w-full border px-4 py-2 rounded-md text-sm dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Login
                </button>
                <button
                  onClick={() => onOpen("signup")}
                  className="w-full px-4 py-2 text-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-md hover:brightness-110 transition"
                >
                  Signup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Animated Neon Divider */}
        <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 animate-pulse"></div>
      </header>

      {/* Tombol Scroll ke Atas */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:scale-110 transition-all duration-300"
        aria-label="Scroll to Top"
      >
        <FaArrowUp />
      </button>

      {/* Hero Section */}
      <motion.section
        className="relative bg-white dark:bg-gray-950 overflow-hidden py-40"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-16">

          {/* LEFT - Text Content */}
          <motion.div
            className="flex-1 space-y-6 text-center md:text-left md:pl-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.2,
                },
              },
            }}
          >
            <motion.h1
              className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              An International Platform <br />
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                For Original Works Made Without AI
              </span>
            </motion.h1>

            <motion.p
              className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto md:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              In every stroke and sentence, there is an unspoken hope. Inkura wanna be a home for works that come with writer's heart to reader. The infinite world is waiting to be tread, doesn't wind want to open this page?</motion.p>

            <motion.div
              className="flex justify-center md:justify-start flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <button
                onClick={() => onOpen("signup")}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:opacity-90 transition"
              >
                Start Adventure
              </button>

              <button
                onClick={() => onOpen("login")}
                className="border border-gray-300 dark:border-gray-600 px-6 py-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-white"
              >
                Home
              </button>

            </motion.div>
          </motion.div>

          {/* RIGHT - Hero Image */}
          <motion.div
            className="flex-1 flex flex-col items-center relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative w-[450px] h-[450px] md:w-[400px] md:h-[400px]">
              <Image
                src="/images/Kucchan.png"
                alt="Maskot Inkura"
                fill
                className="object-contain"
                priority
              />
            </div>
            {/* Neon Line */}
            <div className="w-3/4 h-[5px] mt-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shadow-lg drop-shadow-[0_0_10px_rgba(236,72,153,0.6)] animate-pulse" />
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Features */}
      <motion.section
        id="Feature"
        className="relative bg-gray-50 dark:bg-gray-900 overflow-hidden py-24"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.h2
            className="text-3xl lg:text-4xl font-bold text-center text-gray-800 dark:text-white mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >

            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Inkura
            </span> {" "}
            Featured Features
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {Features.map((Feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex flex-col items-center text-center p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 shadow-md hover:ring-1 hover:ring-primary/30 transition"
              >
                <FontAwesomeIcon
                  icon={Feature.icon}
                  className="text-4xl mb-4"
                  style={{ color: Feature.color }}
                />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {Feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  {Feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>


      {/* Why Inkura */}
      <motion.section
        id="Why"
        className="bg-white dark:bg-gray-950 py-24"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-16">
            Why{" "}
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Inkura
            </span>
            ?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: faShieldAlt,
                color: "text-purple-500",
                title: "Legally Licensed and Protected",
              },
              {
                icon: faPaintBrush,
                color: "text-pink-500",
                title: "Support for Global Creators",
              },
              {
                icon: faUsers,
                color: "text-blue-500",
                title: "Open and Active Community",
              },
              {
                icon: faInfinity,
                color: "text-indigo-500",
                title: "Inclusive of All Creative Formats",
              },
              {
                icon: faGlobe,
                color: "text-green-500",
                title: "Community-Powered Translations",
                description:
                  "Fans can contribute translations to help works reach more people around the world.",
              },
              {
                icon: faImage,
                color: "text-yellow-500",
                title: "Alt Text and Description Support",
                description:
                  "Visual works are enhanced with captions and image descriptions for better accessibility.",
              },
              {
                icon: faLock,
                color: "text-red-500",
                title: "AI-Safe Creative Space",
                description:
                  "Your creations won't be used to train AI models. Your work stays protected and respected.",
              },
              {
                icon: faRobot,
                color: "text-cyan-500",
                title: "AI-Enhanced, Not AI-Replaced",
                description:
                  "AI is used only to improve the site experience, like optional auto-translation for novels and community chats. It’s trained on public data and won’t misuse your content.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md hover:shadow-pink-500/30 hover:scale-[1.02] transition-all duration-300 border border-gray-200 dark:border-gray-800"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <FontAwesomeIcon icon={item.icon} className={`text-4xl mb-4 ${item.color}`} />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>


      {/* Showcase Your Work on Inkura */}
      <motion.section
        id="Content"
        className="bg-gray-50 dark:bg-gray-900 py-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-16">
            What Can You Discover on{" "}
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Inkura
            </span>
            ?
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {[
              {
                src: "/images/komik.jpg",
                title: "Comics",
                desc: "Enjoy comics from talented local and international creators, with a wide range of genres and unique stories.",
              },
              {
                src: "/images/ln.jpg",
                title: "Novels & Light Novels",
                desc: "Light yet immersive reads. Explore fantasy realms, heartwarming romance, and thrilling adventures.",
              },
              {
                src: "/images/fanart.jpg",
                title: "Fanart & Illustrations",
                desc: "View and share colorful visual artworks from the creative International community.",
              },
              {
                src: "/images/zine.jpeg",
                title: "Zines & Creative Works",
                desc: "Discover zines, short stories, and expressive creative content made with passion!",
              },
              {
                src: "/images/anime.png",
                title: "Anime & Donghua",
                desc: "Stream your favorite anime with official licenses and top-quality viewing experience.",
              },
              {
                src: "/images/drama.jpg",
                title: "Asian Dramas",
                desc: "Watch Korean, Japanese, and other Asian dramas to brighten your days with heartfelt stories.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow hover:shadow-lg transition"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-40 object-cover rounded-md mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>


      {/* How Inkura Works */}
      <motion.section
        id="Flow"
        className="bg-white dark:bg-gray-950 py-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-16">
            How <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">Inkura</span> Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              {
                icon: faUserPlus,
                bg: "from-pink-500 to-purple-500",
                title: "Sign Up",
                desc: "Create your free Inkura account as a reader or creator to get started.",
              },
              {
                icon: faCompass,
                bg: "from-purple-500 to-indigo-500",
                title: "Explore & Enjoy",
                desc: "Browse original comics, novels, and art from global creators. No AI-generated content.",
              },
              {
                icon: faUpload,
                bg: "from-indigo-500 to-blue-500",
                title: "Upload Your Work",
                desc: "Share your creative work include comics, zines, novels, and more. Stay in control of your rights.",
              },
              {
                icon: faGlobe,
                bg: "from-blue-500 to-sky-500",
                title: "Community Translations",
                desc: "Fans can contribute translations so your work can reach a wider audience. You can manage it all.",
              },
              {
                icon: faRobot,
                bg: "from-sky-500 to-teal-500",
                title: "AI Translate (Optional)",
                desc: "Automatic translations (for novels) powered by safe, non-training AI using only public data. Private works are not used for AI learning.",
              },
              {
                icon: faShieldAlt,
                bg: "from-teal-500 to-green-500",
                title: "Safe & Secure",
                desc: "Your work is protected. We don’t allow AI scraping or training. AI is only used to enhance user experience, not to replace creators.",
              },
              {
                icon: faHeart,
                bg: "from-green-500 to-yellow-500",
                title: "Support Creators",
                desc: "Donate directly to support your favorite creators and help them grow.",
              },
              {
                icon: faUsers,
                bg: "from-yellow-500 to-pink-500",
                title: "Join the Community",
                desc: "Connect with other fans and creators, join discussions, events, and creative groups.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="group bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <div className={`w-14 h-14 flex items-center justify-center bg-gradient-to-r ${item.bg} text-white rounded-full mb-4 text-2xl`}>
                  <FontAwesomeIcon icon={item.icon} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="relative w-full">
      {/* Background image */}
      <img
        src="/images/atas_footer.png"
        alt="Footer Illustration"
        className="w-full h-auto object-cover brightness-100 dark:brightness-75 transition-all duration-500"
      />

      {/* Overlay Button */}
      <div className="absolute inset-0 flex items-end justify-center pb-16">
        <button
          onClick={() => onOpen("login")}
          className="bg-gradient-to-r from-yellow-400 via-pink-500 via-50% to-indigo-600 text-white text-3xl md:text-4xl font-extrabold px-12 md:px-20 py-6 md:py-7 rounded-full shadow-2xl hover:scale-105 hover:brightness-110 transition-all duration-300 ease-in-out"
        >
          Join Us
        </button>
      </div>
    </div>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 pt-16 pb-8 px-6 border-t border-gray-200 dark:border-white/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12 text-sm">

          {/* Logo & Description */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo-inkura.png" alt="Inkura Logo" className="w-8 h-8" />
              <h4 className="text-xl font-bold text-gray-800 dark:text-white">Inkura</h4>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              International creative ecosystem platform is non-pirated and will not use your work for AI training, it's safe guys. The creator is also a creator and programmer, hehehehe. A meeting place for comics, light novels, fanart, anime, drama, and community.
            </p>
          </div>

          {/* Menu */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Menu</h4>
            <ul className="space-y-2">
              <li><a href="#Featur" className="hover:text-primary transition">Features</a></li>
              <li><a href="#Why" className="hover:text-primary transition">Why Inkura</a></li>
              <li><a href="#Content" className="hover:text-primary transition">Content</a></li>
              <li><a href="#Flow" className="hover:text-primary transition">How It Works</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-primary transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-primary transition">Contact & Support</a></li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="text-xl hover:text-pink-500 transition">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="#" className="text-xl hover:text-blue-400 transition">
                <FontAwesomeIcon icon={faTwitter} />
              </a>
              <a href="#" className="text-xl hover:text-indigo-500 transition">
                <FontAwesomeIcon icon={faDiscord} />
              </a>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-gray-200 dark:border-white/10 pt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Inkura. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

// Komponen tambahan
function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center text-center px-4 py-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 shadow hover:ring-1 hover:ring-primary/30 transition">
      <div className="text-4xl text-primary mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{desc}</p>
    </div>
  );
}

function Value({ title }: { title: string }) {
  return (
    <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
      <h3 className="font-semibold text-gray-800 dark:text-white text-base">{title}</h3>
    </div>
  );
}

function Showcase({
  title,
  cover,
  type,
}: {
  title: string;
  cover: string;
  type: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow hover:shadow-lg transition">
      <Image src={cover} alt={title} width={400} height={300} className="w-full h-56 object-cover" />
      <div className="p-4">
        <span className="text-xs uppercase text-primary font-medium">{type}</span>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mt-1">{title}</h3>
      </div>
    </div>
  );
}

function Step({
  step,
  title,
  icon,
}: {
  step: string;
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 shadow-md">
      <div className="text-primary text-3xl mb-2">{icon}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Langkah {step}</div>
      <h4 className="font-semibold text-gray-800 dark:text-white">{title}</h4>
    </div>
  );
}

