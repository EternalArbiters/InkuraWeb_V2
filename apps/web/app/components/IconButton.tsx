import Link from "next/link";

export default function IconButton({
  icon,
  label, // masih bisa diterima tapi gak dipakai
  onClick,
  href
}: {
  icon: React.ReactNode;
  label?: string; // boleh opsional sekarang
  onClick?: () => void;
  href?: string;
}) {
  return (
    <div className="group">
      {href ? (
        <Link
          href={href}
          className="hover:text-pink-500 transition duration-300 flex items-center justify-center h-10 w-10"
        >
          {icon}
        </Link>
      ) : (
        <button
          onClick={onClick}
          className="hover:text-pink-500 transition duration-300 flex items-center justify-center h-10 w-10"
        >
          {icon}
        </button>
      )}
    </div>
  );
}
