"use client";

import { useState } from "react";
import { FaFilter } from "react-icons/fa";

const genres = ["Romance", "Fantasy", "Mystery", "Slice of Life", "Horror", "Historical"];
const regions = ["Indonesia", "Jepang", "Korea", "Tiongkok", "Thailand"];
const statuses = ["Ongoing", "Complete"];
const sorts = ["Terbaru", "Populer", "Rating"];

export default function FilterBar() {
  const [genre, setGenre] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("Terbaru");
  const [keyword, setKeyword] = useState("");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="px-3 py-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
        >
          <option value="">Genre</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="px-3 py-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
        >
          <option value="">Region</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
        >
          <option value="">Status</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
        >
          {sorts.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search for title, author, translator..."
          className="px-4 py-2 text-sm rounded border dark:border-gray-600 bg-white dark:bg-gray-700 w-full md:w-60"
        />
        <button className="px-4 py-2 text-sm rounded bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:brightness-110 transition">
          <FaFilter className="inline mr-2" />
          Filter
        </button>
      </div>
    </div>
  );
}
