"use client";

import { type ProfileLinkEntry } from "@/lib/profileUrls";

const GENDERS = [
  { value: "", label: "Prefer not to say" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "OTHER", label: "Other" },
];

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

type Props = {
  name: string;
  onNameChange: (value: string) => void;
  username: string;
  onUsernameChange: (value: string) => void;
  bio: string;
  onBioChange: (value: string) => void;
  profileLinks: ProfileLinkEntry[];
  onProfileLinksChange: (value: ProfileLinkEntry[]) => void;
  gender: string;
  onGenderChange: (value: string) => void;
  birthMonth: number | "";
  onBirthMonthChange: (value: number | "") => void;
  birthYear: number | "";
  onBirthYearChange: (value: number | "") => void;
};

export default function ProfileFieldsCard({
  name,
  onNameChange,
  username,
  onUsernameChange,
  bio,
  onBioChange,
  profileLinks,
  onProfileLinksChange,
  gender,
  onGenderChange,
  birthMonth,
  onBirthMonthChange,
  birthYear,
  onBirthYearChange,
}: Props) {
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const canAddUrl = profileLinks.length < 5;

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-[#04112b] p-6 grid gap-5">
      <div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white">Display name</div>
        <input
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
          value={name}
          onChange={(e) => onNameChange(e.target.value.slice(0, 60))}
          maxLength={60}
          placeholder="Your display name"
        />
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white">Username</div>
        <input
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          maxLength={24}
          placeholder="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">3–24 chars. Use letters, numbers, dash, underscore.</div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">Bio</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{bio.length}/200</div>
        </div>
        <textarea
          className="mt-1 h-32 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
          value={bio}
          onChange={(e) => onBioChange(e.target.value.slice(0, 200))}
          maxLength={200}
          placeholder="Tell readers a little about yourself"
        />
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Maximum 200 characters.</div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Profile links</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Maximum 5 links. Give each one a short title so it displays neatly like a link sheet.</div>
          </div>
          <button
            type="button"
            disabled={!canAddUrl}
            onClick={() => {
              if (!canAddUrl) return;
              onProfileLinksChange([...profileLinks, { title: "", url: "" }]);
            }}
            className="rounded-full border border-purple-400/60 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/10 disabled:opacity-40"
          >
            + Add URL
          </button>
        </div>

        <div className="mt-3 grid gap-3">
          {profileLinks.map((value, index) => (
            <div key={index} className="rounded-2xl border border-gray-200/70 p-3 dark:border-gray-800/80">
              <div className="grid gap-3 md:grid-cols-[0.42fr_0.58fr_auto] md:items-end">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Title</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
                    value={value.title}
                    onChange={(e) => {
                      const next = [...profileLinks];
                      next[index] = { ...next[index], title: e.target.value.slice(0, 60) };
                      onProfileLinksChange(next);
                    }}
                    maxLength={60}
                    placeholder={`Link ${index + 1}`}
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">URL</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
                    value={value.url}
                    onChange={(e) => {
                      const next = [...profileLinks];
                      next[index] = { ...next[index], url: e.target.value.slice(0, 500) };
                      onProfileLinksChange(next);
                    }}
                    maxLength={500}
                    placeholder={`https://your-site-${index + 1}.com`}
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
                {profileLinks.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onProfileLinksChange(profileLinks.filter((_, itemIndex) => itemIndex !== index))}
                    className="shrink-0 rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">Gender</div>
          <select
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
            value={gender}
            onChange={(e) => onGenderChange(e.target.value)}
          >
            {GENDERS.map((option) => (
              <option key={option.value || "empty"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">Birth month</div>
          <select
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
            value={birthMonth}
            onChange={(e) => onBirthMonthChange(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Select month</option>
            {MONTHS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">Birth year</div>
          <select
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
            value={birthYear}
            onChange={(e) => onBirthYearChange(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Select year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Demographic fields help analytics and can be changed any time. We only ask month and year, not full birth date.
      </p>
    </div>
  );
}
