"use client";

type Props = {
  name: string;
  onNameChange: (v: string) => void;

  username: string;
  onUsernameChange: (v: string) => void;

  image: string;
  onImageChange: (v: string) => void;
};

export default function ProfileFieldsCard({ name, onNameChange, username, onUsernameChange, image, onImageChange }: Props) {
  return (
    <div className="grid gap-4">
      <div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white">Display name</div>
        <input
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white">Username</div>
        <input
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder="your-username"
        />
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Lowercase and hyphen recommended.</div>
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white">Avatar URL</div>
        <input
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
          value={image}
          onChange={(e) => onImageChange(e.target.value)}
          placeholder="https://..."
        />
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">If left blank, keep current avatar.</div>
      </div>
    </div>
  );
}
