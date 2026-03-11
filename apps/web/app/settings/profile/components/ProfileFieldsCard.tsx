"use client";

const GENDERS = [
  { value: "", label: "Select gender" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
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
  onNameChange: (v: string) => void;
  username: string;
  onUsernameChange: (v: string) => void;
  bio: string;
  onBioChange: (v: string) => void;
  gender: string;
  onGenderChange: (v: string) => void;
  birthMonth: number | "";
  onBirthMonthChange: (v: number | "") => void;
  birthYear: number | "";
  onBirthYearChange: (v: number | "") => void;
};

export default function ProfileFieldsCard({
  name,
  onNameChange,
  username,
  onUsernameChange,
  bio,
  onBioChange,
  gender,
  onGenderChange,
  birthMonth,
  onBirthMonthChange,
  birthYear,
  onBirthYearChange,
}: Props) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index);

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
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">Bio</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{bio.length}/200</div>
        </div>
        <textarea
          className="mt-1 min-h-[110px] w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
          value={bio}
          onChange={(e) => onBioChange(e.target.value.slice(0, 200))}
          maxLength={200}
          placeholder="Tell readers a little about yourself"
        />
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Maksimal 200 karakter.</div>
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
