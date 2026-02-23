import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
};

/**
 * Minimal inline action link: text + sharp triangle (▶) on the right.
 * Use this to replace "... →" style links for consistent aesthetics.
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
      <span
        aria-hidden
        className="ml-1 text-[10px] leading-none opacity-80 transition-transform duration-200 group-hover:translate-x-0.5"
      >
        ▶
      </span>
    </Link>
  );
}
