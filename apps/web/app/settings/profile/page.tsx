import BackButton from "@/app/components/BackButton";
import { parseProfileLinks } from "@/lib/profileUrls";
import { requirePageUserId } from "@/server/auth/pageAuth";
import { getViewerProfile } from "@/server/services/profile/viewerProfile";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  await requirePageUserId("/settings/profile");
  const { profile: p } = await getViewerProfile();

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Edit Profile</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Update your display name, username, short bio, and named profile links.</p>
          </div>
          <BackButton href="/home" />
        </div>

        <ProfileForm
          initial={{
            email: p.email,
            username: p.username ?? "",
            name: p.name ?? "",
            bio: p.bio ?? "",
            profileLinks: parseProfileLinks(p.profileUrlsJson, p.profileUrl),
            image: p.image,
            avatarFocusX: p.avatarFocusX,
            avatarFocusY: p.avatarFocusY,
            avatarZoom: p.avatarZoom,
            gender: p.gender,
            birthMonth: p.birthMonth,
            birthYear: p.birthYear,
          }}
        />
      </div>
    </main>
  );
}
