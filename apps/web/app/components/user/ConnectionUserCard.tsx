import Link from "next/link";

type UserLike = {
  id: string;
  username: string | null;
  name: string | null;
  bio?: string | null;
  image?: string | null;
  avatarFocusX?: number | null;
  avatarFocusY?: number | null;
  avatarZoom?: number | null;
};

function displayName(user: UserLike) {
  return user.name?.trim() || user.username?.trim() || "User";
}

function avatarInitial(user: UserLike) {
  return displayName(user).charAt(0).toUpperCase() || "U";
}

export default function ConnectionUserCard({ user }: { user: UserLike }) {
  const focusX = Number.isFinite(Number(user.avatarFocusX)) ? Number(user.avatarFocusX) : 50;
  const focusY = Number.isFinite(Number(user.avatarFocusY)) ? Number(user.avatarFocusY) : 50;
  const zoom = Number.isFinite(Number(user.avatarZoom)) ? Math.max(1, Number(user.avatarZoom)) : 1;

  return (
    <Link
      href={user.username ? `/u/${user.username}` : "#"}
      className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/70 p-4 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-900"
    >
      {user.image ? (
        <div className="relative h-14 w-14 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.image}
            alt={displayName(user)}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition: `${focusX}% ${focusY}%`,
              transform: `scale(${zoom})`,
              transformOrigin: "center",
            }}
          />
        </div>
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-lg font-extrabold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
          {avatarInitial(user)}
        </div>
      )}

      <div className="min-w-0">
        <div className="truncate text-base font-semibold text-gray-900 dark:text-white">{displayName(user)}</div>
        <div className="truncate text-sm text-gray-600 dark:text-gray-300">{user.username ? `@${user.username}` : "No username"}</div>
        {user.bio ? <div className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{user.bio}</div> : null}
      </div>
    </Link>
  );
}
