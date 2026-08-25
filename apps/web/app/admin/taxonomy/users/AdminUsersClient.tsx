"use client";

import * as React from "react";

type UserItem = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  email: string;
  role: string;
};

const ROLE_OPTIONS = [
  { value: "USER", label: "User" },
  { value: "SPECIAL_USER", label: "Special User" },
] as const;

function roleBadgeClass(role: string) {
  if (role === "ADMIN") return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-200";
  if (role === "SPECIAL_USER") return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200";
  return "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300";
}

export default function AdminUsersClient() {
  const [query, setQuery] = React.useState("");
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [searched, setSearched] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [newEmail, setNewEmail] = React.useState("");
  const [newUsername, setNewUsername] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [newRole, setNewRole] = React.useState<string>("SPECIAL_USER");
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Search failed");
      setUsers(data.users ?? []);
      setDrafts({});
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveRole(userId: string) {
    const next = drafts[userId];
    if (!next) return;
    setSaving(userId);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: next } : u)));
      setDrafts((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      setMessage("Role updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(null);
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          username: newUsername,
          password: newPassword,
          name: newName || undefined,
          role: newRole,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to create user");
      setNewEmail("");
      setNewUsername("");
      setNewPassword("");
      setNewName("");
      setNewRole("SPECIAL_USER");
      setMessage(`Account created for ${data.user?.username || data.user?.email}.`);
      doSearch();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold">Create account</h2>
        <p className="text-xs text-neutral-500">
          Self-registration is disabled on this deployment — this is the only way to create a new account (e.g. a
          Special User account for a friend).
        </p>
        {createError ? <p className="text-sm text-red-600 dark:text-red-400">{createError}</p> : null}
        <form onSubmit={createUser} className="grid gap-3 sm:grid-cols-2">
          <input
            required
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
          <input
            required
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Username"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
          <input
            required
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Password (min 8 chars)"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Display name (optional)"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {creating ? "Creating..." : "Create account"}
          </button>
        </form>
      </section>

      <div>
        <p className="mb-3 text-sm text-neutral-500">
          Search by username, name, or email. Leave blank to show the 60 most recently created accounts.
        </p>
        <form onSubmit={doSearch} className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Username, name, or email..."
            className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {searched ? (
        <div>
          <p className="mb-3 text-sm text-neutral-500">{users.length} result{users.length !== 1 ? "s" : ""}</p>

          {users.length === 0 ? (
            <p className="text-sm text-neutral-400">No users found.</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => {
                const draft = drafts[user.id];
                const isAdminAccount = user.role === "ADMIN";
                const changed = draft && draft !== user.role;
                const isSaving = saving === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{user.name || user.username || user.email}</span>
                        {user.username ? <span className="text-xs text-neutral-400">@{user.username}</span> : null}
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${roleBadgeClass(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-neutral-400">{user.email}</div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {isAdminAccount ? (
                        <span className="text-xs text-neutral-400">Role locked (hardcoded admin account)</span>
                      ) : (
                        <>
                          <select
                            value={draft ?? user.role}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [user.id]: e.target.value }))}
                            disabled={isSaving}
                            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
                          >
                            {ROLE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => saveRole(user.id)}
                            disabled={!changed || isSaving}
                            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
