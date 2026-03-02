import "server-only";

// Copied from apps/api/lib/auth.ts (v12) and hosted in apps/web for v13.
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { enforcedRoleFromEmail } from "@/server/auth/adminEmail";

function slugUsername(input: string) {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 24);
}

async function ensureUsername(userId: string, email?: string | null, name?: string | null) {
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
  if (!current || current.username) return;

  const baseRaw = (email ? email.split("@")[0] : "") || name || "user";
  const base = slugUsername(baseRaw) || "user";

  for (let i = 0; i < 20; i++) {
    const suffix = i === 0 ? "" : `-${Math.random().toString(36).slice(2, 6)}`;
    const candidate = `${base}${suffix}`.slice(0, 24);
    const clash = await prisma.user.findFirst({ where: { username: candidate }, select: { id: true } });
    if (!clash) {
      await prisma.user.update({ where: { id: userId }, data: { username: candidate } });
      return;
    }
  }
}

async function upsertOAuthUser(email: string, name?: string | null, image?: string | null) {
  const emailLower = email.toLowerCase();
  const enforcedRole = enforcedRoleFromEmail(emailLower);

  const existing = await prisma.user.findUnique({
    where: { email: emailLower },
    select: { id: true, role: true, name: true, image: true, username: true, avatarFocusX: true, avatarFocusY: true, avatarZoom: true },
  });

  if (!existing) {
    const created = await prisma.user.create({
      data: {
        email: emailLower,
        name: name ?? null,
        image: image ?? null,
        password: null,
        username: null,
        role: enforcedRole as any,
      },
      select: { id: true, role: true, name: true, image: true, avatarFocusX: true, avatarFocusY: true, avatarZoom: true },
    });
    await ensureUsername(created.id, emailLower, name);
    return created;
  }

  const next: any = {};
  if (name && name !== existing.name) next.name = name;
  if (image && image !== existing.image) next.image = image;
  // v14: enforce single-admin email.
  if (existing.role !== enforcedRole) next.role = enforcedRole;
  if (Object.keys(next).length) {
    await prisma.user.update({ where: { id: existing.id }, data: next });
  }
  if (!existing.username) await ensureUsername(existing.id, emailLower, name);

  return {
    id: existing.id,
    role: enforcedRole as any,
    name: name ?? existing.name,
    image: image ?? existing.image,
    avatarFocusX: (existing as any).avatarFocusX ?? null,
    avatarFocusY: (existing as any).avatarFocusY ?? null,
    avatarZoom: (existing as any).avatarZoom ?? null,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email/Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.email?.trim();
        const password = credentials?.password;

        if (!identifier || !password) {
          throw new Error("Email/username and password required");
        }

        const identifierLower = identifier.toLowerCase();

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifierLower }, { username: { equals: identifierLower, mode: "insensitive" as const } }],
          },
        });

        if (!user) throw new Error("No user found");

        if (!user.password) throw new Error("Use Google/Discord login for this account");
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw new Error("Invalid credentials");

        // v14: enforce single-admin email.
        const enforcedRole = enforcedRoleFromEmail(user.email);
        if (user.role !== enforcedRole) {
          await prisma.user.update({ where: { id: user.id }, data: { role: enforcedRole as any } });
          (user as any).role = enforcedRole;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name ?? null,
          image: user.image ?? null,
          avatarFocusX: (user as any).avatarFocusX ?? null,
          avatarFocusY: (user as any).avatarFocusY ?? null,
          avatarZoom: (user as any).avatarZoom ?? null,
        } as any;
      },
    }),

    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
      ? [
          DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // If the client calls `useSession().update()`, refresh name/image from DB.
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { name: true, image: true, email: true, avatarFocusX: true, avatarFocusY: true, avatarZoom: true },
        });
        if (dbUser) {
          token.name = dbUser.name ?? null;
          token.picture = dbUser.image ?? null;
          (token as any).avatarFocusX = dbUser.avatarFocusX ?? null;
          (token as any).avatarFocusY = dbUser.avatarFocusY ?? null;
          (token as any).avatarZoom = dbUser.avatarZoom ?? null;
          if (dbUser.email) {
            token.email = dbUser.email;
            token.role = enforcedRoleFromEmail(String(dbUser.email));
          }
        }
        return token;
      }

      if (user && account?.provider === "credentials") {
        token.id = (user as any).id;
        token.role = enforcedRoleFromEmail((user as any).email);
        token.name = (user as any).name ?? null;
        token.picture = (user as any).image ?? null;
        (token as any).avatarFocusX = (user as any).avatarFocusX ?? null;
        (token as any).avatarFocusY = (user as any).avatarFocusY ?? null;
        (token as any).avatarZoom = (user as any).avatarZoom ?? null;
        return token;
      }

      if (account?.provider && account.provider !== "credentials") {
        const email = String((user as any)?.email || token.email || "").trim();
        if (email) {
          const dbUser = await upsertOAuthUser(
            email,
            (user as any)?.name ?? (token.name as any),
            (user as any)?.image ?? (token.picture as any)
          );
          token.id = dbUser.id;
          token.role = enforcedRoleFromEmail(email);
          token.name = dbUser.name ?? null;
          token.picture = dbUser.image ?? null;
            (token as any).avatarFocusX = (dbUser as any).avatarFocusX ?? null;
            (token as any).avatarFocusY = (dbUser as any).avatarFocusY ?? null;
            (token as any).avatarZoom = (dbUser as any).avatarZoom ?? null;
        }
        return token;
      }

      if (!token.id && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: String(token.email).toLowerCase() },
          select: { id: true, role: true, name: true, image: true, avatarFocusX: true, avatarFocusY: true, avatarZoom: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = enforcedRoleFromEmail(String(token.email));
          token.name = dbUser.name ?? (token.name as any) ?? null;
          token.picture = dbUser.image ?? (token.picture as any) ?? null;
          (token as any).avatarFocusX = dbUser.avatarFocusX ?? null;
          (token as any).avatarFocusY = dbUser.avatarFocusY ?? null;
          (token as any).avatarZoom = dbUser.avatarZoom ?? null;
        }
      }

      if (token.id && !token.role) {
        const dbUser = await prisma.user.findUnique({ where: { id: String(token.id) }, select: { role: true } });
        if (dbUser) token.role = enforcedRoleFromEmail(String(token.email || ""));
      }

      // Safety: always enforce role by email (prevents accidental admin).
      if (token.email) token.role = enforcedRoleFromEmail(String(token.email));

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        session.user.name = (token.name as string) ?? null;
        session.user.image = (token.picture as string) ?? null;

        (session.user as any).avatarFocusX = (token as any).avatarFocusX ?? null;
        (session.user as any).avatarFocusY = (token as any).avatarFocusY ?? null;
        (session.user as any).avatarZoom = (token as any).avatarZoom ?? null;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
