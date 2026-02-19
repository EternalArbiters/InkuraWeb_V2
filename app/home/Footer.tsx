'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FaInstagram, FaTwitter, FaDiscord } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 pt-16 pb-8 px-6 border-t border-gray-200 dark:border-white/10">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12 text-sm">
        {/* Logo & Description */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Image
              src="/logo-inkura.png"
              alt="Inkura Logo"
              width={32}
              height={32}
              className="rounded"
            />
            <h4 className="text-xl font-bold text-gray-800 dark:text-white">Inkura</h4>
          </div>
          <p className="leading-relaxed text-gray-600 dark:text-gray-400 text-sm">
            A creative safe space free from AI training. Comics, novels, art, and community — made by humans.
          </p>
        </div>

        {/* Menu */}
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Menu</h4>
          <ul className="space-y-2">
            <li><Link href="#Feature" className="hover:text-pink-500 transition">Features</Link></li>
            <li><Link href="#Why" className="hover:text-pink-500 transition">Why Inkura</Link></li>
            <li><Link href="#Content" className="hover:text-pink-500 transition">Content</Link></li>
            <li><Link href="#Flow" className="hover:text-pink-500 transition">How It Works</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Legal</h4>
          <ul className="space-y-2">
            <li><Link href="/privacy" className="hover:text-pink-500 transition">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-pink-500 transition">Terms & Conditions</Link></li>
            <li><Link href="/contact" className="hover:text-pink-500 transition">Contact</Link></li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Follow Us</h4>
          <div className="flex gap-4 text-lg">
            <a href="#" className="hover:text-pink-500 transition" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="#" className="hover:text-blue-400 transition" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="#" className="hover:text-indigo-500 transition" aria-label="Discord">
              <FaDiscord />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-12 border-t border-gray-200 dark:border-white/10 pt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Inkura. All rights reserved.
      </div>
    </footer>
  );
}
