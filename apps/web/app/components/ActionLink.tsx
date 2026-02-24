import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
};

/**
 * Minimal inline action link: text + sharp triangle on the right.
 * Triangle color: black on light mode, white on dark mode.
 */
export default function ActionLink({ href, children, className, prefetch = false }: Props) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(
        "group inline-flex items-center text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline underline-offset-4",
        className
      )}
    >
      <span>{children}</span>
      <svg
        aria-hidden
        viewBox="0 0 10 10"
        className="ml-2 h-3 w-3 text-black dark:text-white opacity-80 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
      >
        <path d="M3 1.5L8.5 5 3 8.5V1.5Z" fill="currentColor" />
      </svg>
    </Link>
  );
}
