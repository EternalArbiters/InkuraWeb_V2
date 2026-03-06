"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faTwitter, faDiscord } from "@fortawesome/free-brands-svg-icons";

export default function LandingFooter() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 pt-16 pb-8 px-6 border-t border-gray-200 dark:border-white/10">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12 text-sm">
        {/* Logo & Description */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-inkura.png" alt="Inkura Logo" className="w-8 h-8" />
            <h4 className="text-xl font-bold text-gray-800 dark:text-white">Inkura</h4>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            International creative ecosystem platform is non-pirated and will not use your work for AI training, it&apos;s
            safe guys. The creator is also a creator and programmer, hehehehe. A meeting place for comics, light
            novels, fanart, anime, drama, and community.
          </p>
        </div>

        {/* Menu */}
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Menu</h4>
          <ul className="space-y-2">
            <li>
              <a href="#Featur" className="hover:text-primary transition">
                Features
              </a>
            </li>
            <li>
              <a href="#Why" className="hover:text-primary transition">
                Why Inkura
              </a>
            </li>
            <li>
              <a href="#Content" className="hover:text-primary transition">
                Content
              </a>
            </li>
            <li>
              <a href="#Flow" className="hover:text-primary transition">
                How It Works
              </a>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Legal</h4>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-primary transition">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition">
                Terms & Conditions
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition">
                Contact & Support
              </a>
            </li>
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
  );
}
