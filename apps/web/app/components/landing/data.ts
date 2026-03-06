import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
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
  faUpload,
} from "@fortawesome/free-solid-svg-icons";

export type FeaturedFeature = {
  icon: IconDefinition;
  title: string;
  description: string;
  color: string;
};

export const FEATURED_FEATURES: FeaturedFeature[] = [
  {
    icon: faBookOpen,
    title: "Read Comics and Light Novels",
    description: "Access original works from creators across the globe and enjoy exciting stories every day.",
    color: "#1D4ED8", // biru
  },
  {
    icon: faFilm,
    title: "Watch Animation & Drama",
    description: "Stream your favorite anime and dramas legally in the highest quality.",
    color: "#DC2626", // merah
  },
  {
    icon: faPaintBrush,
    title: "Fanart & Artwork Upload",
    description: "Share your visual works such as illustrations, zines, and comics to the community.",
    color: "#F59E0B", // oranye
  },
  {
    icon: faHeart,
    title: "Donate to Creator",
    description: "Support your favorite creators and translators through the donation & premium system.",
    color: "#EC4899", // pink
  },
  {
    icon: faTrophy,
    title: "Event & Premium",
    description: "Join community competitions and events, and get exclusive premium access.",
    color: "#10B981", // hijau toska
  },
  {
    icon: faUsers,
    title: "Active Community",
    description: "Have fun discussions, create a group, or chat with other creators & fans!",
    color: "#6366F1", // ungu indigo
  },
];

export type WhyInkuraItem = {
  icon: IconDefinition;
  color: string; // tailwind text-* class
  title: string;
  description?: string;
};

export const WHY_INKURA_ITEMS: WhyInkuraItem[] = [
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
    description: "Fans can contribute translations to help works reach more people around the world.",
  },
  {
    icon: faImage,
    color: "text-yellow-500",
    title: "Alt Text and Description Support",
    description: "Visual works are enhanced with captions and image descriptions for better accessibility.",
  },
  {
    icon: faLock,
    color: "text-red-500",
    title: "AI-Safe Creative Space",
    description: "Your creations won't be used to train AI models. Your work stays protected and respected.",
  },
  {
    icon: faRobot,
    color: "text-cyan-500",
    title: "AI-Enhanced, Not AI-Replaced",
    description:
      "AI is used only to improve the site experience, like optional auto-translation for novels and community chats. It’s trained on public data and won’t misuse your content.",
  },
];

export type DiscoverItem = {
  src: string;
  title: string;
  desc: string;
};

export const DISCOVER_ITEMS: DiscoverItem[] = [
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
];

export type HowItWorksItem = {
  icon: IconDefinition;
  bg: string; // tailwind gradient classes suffix
  title: string;
  desc: string;
};

export const HOW_IT_WORKS_ITEMS: HowItWorksItem[] = [
  {
    icon: faUserPlus,
    bg: "from-blue-500 to-purple-600",
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
];
