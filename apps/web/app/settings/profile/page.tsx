import Link from "next/link";
import { redirect } from "next/navigation";
import { apiJson } from "@/lib/serverApi";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const res = await apiJson<{ profile: any }>("/api/me/profile");
  if (!res.ok) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/settings/profile`)}`);
  }

  const p = res.data.profile;

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Edit Profile</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Update your display name and username.</p>
          </div>
          <Link
            href="/home"
            className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Back
          </Link>
        </div>

        <ProfileForm
          initial={{
            email: p.email,
            username: p.username,
            name: p.name,
            image: p.image,
            avatarFocusX: p.avatarFocusX,
            avatarFocusY: p.avatarFocusY,
            avatarZoom: p.avatarZoom,
          }}
        />
      </div>
    </main>
  );
}
