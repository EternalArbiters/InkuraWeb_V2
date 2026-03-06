"use client";

type Props = {
  onJoin: () => void;
};

export default function JoinUsBanner({ onJoin }: Props) {
  return (
    <div className="relative w-full">
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/atas_footer.png"
        alt="Footer Illustration"
        className="w-full h-auto object-cover brightness-100 dark:brightness-75 transition-all duration-500"
      />

      {/* Overlay Button */}
      <div className="absolute inset-0 flex items-end justify-center pb-16">
        <button
          onClick={onJoin}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-3xl md:text-4xl font-extrabold px-12 md:px-20 py-6 md:py-7 rounded-full shadow-2xl hover:scale-105 hover:brightness-110 transition-all duration-300 ease-in-out"
        >
          Join Us
        </button>
      </div>
    </div>
  );
}
