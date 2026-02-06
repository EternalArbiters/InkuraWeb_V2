"use client";

import { useAuthModal } from "@/hooks/useAuthModal";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { FaGoogle, FaDiscord } from "react-icons/fa";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthModal() {
  const { isOpen, onClose, onOpen, type } = useAuthModal();
  const isLogin = type === "login";
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (isLogin) {
      const res = await signIn("credentials", {
        redirect: false,
        email: identifier,
        password,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        onClose();
        router.push("/home");
      }

      return;
    }

    // Signup (register -> auto login)
    try {
      const reg = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: signupUsername,
          email: signupEmail,
          password,
        }),
      });

      const data = await reg.json();
      if (!reg.ok) {
        setError(data?.error || "Registrasi gagal");
        return;
      }

      const res = await signIn("credentials", {
        redirect: false,
        email: signupEmail,
        password,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        onClose();
        router.push("/home");
      }
    } catch (e) {
      console.error(e);
      setError("Registrasi gagal");
    }
  };

  const handleGoogleLogin = async () => {
    await signIn("google", { callbackUrl: "/home" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-white dark:bg-gray-900 overflow-hidden rounded-2xl shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>{isLogin ? "Login" : "Signup"}</DialogTitle>
        </VisuallyHidden>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] h-full">
          <motion.div
            className="relative hidden md:flex w-full h-full overflow-hidden rounded-l-2xl"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-400 via-transparent to-yellow-400 z-10 pointer-events-none" />
            <img
              src="/images/login.png"
              alt="Login Art"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div
            className="flex flex-col justify-center items-center p-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
              {isLogin ? "Welcome Back!" : "Join Inkura"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {isLogin
                ? "Log in to access amazing content."
                : "Create your account to start your journey."}
            </p>

            <div className="w-full space-y-3 max-w-md">
              <button
                onClick={() => handleGoogleLogin()}
                className="w-full flex items-center justify-center gap-2 whitespace-nowrap bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-5 py-2 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <FaGoogle className="text-red-500" />
                Continue with Google
              </button>
              <button
                onClick={() => signIn("discord", { callbackUrl: "/home" })}
                className="w-full flex items-center justify-center gap-2 whitespace-nowrap bg-[#5865F2] text-white px-5 py-2 rounded-lg shadow hover:bg-[#4752c4] transition"
              >
                <FaDiscord />
                Continue with Discord
              </button>

              <div className="relative text-center py-4">
                <span className="absolute inset-x-0 top-1/2 border-t border-gray-300 dark:border-gray-600" />
                <span className="relative px-4 bg-white dark:bg-gray-900 text-gray-500 text-sm">
                  or continue with email/username
                </span>
              </div>

              {isLogin ? (
                <input
                  type="text"
                  placeholder="Email atau Username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Username"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </>
              )}
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 rounded-lg font-medium hover:brightness-110 transition"
              >
                {isLogin ? "Log In" : "Sign Up"}
              </button>
            </div>

            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              {isLogin ? "Don’t have an account?" : "Already have an account?"}
              <button
                className="ml-1 text-primary hover:underline"
                onClick={() => onOpen(isLogin ? "signup" : "login")}
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
