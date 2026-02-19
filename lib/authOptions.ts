import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const ADMIN_EMAIL = "noelephgoddess.game@gmail.com";

// NOTE: schema Prisma sering berubah di versi Inkura.
// Supaya build Next.js gak mentok kalau client Prisma belum regenerate,
// kita pakai any untuk akses field baru (adultConfirmed, Work, Report, dll).
const db = prisma as any;

async function ensureUniqueUsername(base: string) {
  const normalized = base
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20) || "user";

  let candidate = normalized;
  let i = 0;
  // loop kecil untuk cari username yang belum dipakai
  // (max 20 tries)
  while (i < 20) {
    const exists = await db.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
    i += 1;
    candidate = `${normalized}${i}`.slice(0, 20);
  }
  return `${normalized}_${Date.now().toString().slice(-4)}`.slice(0, 20);
}

const providers = [
  CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const identifier = credentials.email.trim().toLowerCase();

        const user = await db.user.findFirst({
          where: {
            OR: [{ email: identifier }, { username: identifier }],
          },
        });

        if (!user) throw new Error("No user found");
        if (!user.password) throw new Error("Account has no password. Use OAuth login.");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid credentials");

        const isAdminEmail = user.email.toLowerCase() === ADMIN_EMAIL;
        const role = isAdminEmail ? "ADMIN" : "USER";

        // enforce policy: hanya 1 email ini yang boleh ADMIN
        if (user.role !== role) {
          await db.user.update({
            where: { id: user.id },
            data: { role: role as any },
          });
        }

        return {
          id: user.id,
          email: user.email,
          role,
          adultConfirmed: user.adultConfirmed,
          name: user.name,
          image: user.image,
        } as any;
      },
    }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  providers.push(
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    })
  );
}

export const authOptions: AuthOptions = {
  providers,

  pages: {
    signIn: "/", // pakai modal
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, account }) {
      // Untuk OAuth: pastikan ada record user di DB (biar bisa ada role/adminConfirmed)
      if (account?.provider && account.provider !== "credentials") {
        const email = (user.email || "").toLowerCase();
        if (!email) return false;

        const role = email === ADMIN_EMAIL ? "ADMIN" : "USER";

        const usernameBase = email.split("@")[0] || "user";
        const username = await ensureUniqueUsername(usernameBase);

        const dbUser = await db.user.upsert({
          where: { email },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            role,
          },
          create: {
            email,
            username,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            role,
            password: null,
            adultConfirmed: false,
          },
        });

        (user as any).id = dbUser.id;
        (user as any).role = dbUser.role;
        (user as any).adultConfirmed = dbUser.adultConfirmed;
      }

      return true;
    },

    async jwt({ token, user }) {
      // set awal saat login
      if (user) {
        token.id = (user as any).id;
        token.email = user.email;
        token.role = (user as any).role;
        token.adultConfirmed = (user as any).adultConfirmed;
        token.name = user.name ?? null;
        token.picture = user.image ?? null;
      }

      // sync token dengan DB (role & adultConfirmed)
      if (token?.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { email: true, role: true, adultConfirmed: true, name: true, image: true },
        });

        if (dbUser) {
          token.email = dbUser.email;
          token.role = dbUser.email.toLowerCase() === ADMIN_EMAIL ? "ADMIN" : "USER";
          token.adultConfirmed = dbUser.adultConfirmed;
          token.name = dbUser.name ?? null;
          token.picture = dbUser.image ?? null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        session.user.email = (token.email as string) ?? session.user.email;
        (session.user as any).role = token.role;
        (session.user as any).adultConfirmed = token.adultConfirmed;
        session.user.name = (token.name as string) ?? null;
        session.user.image = (token.picture as string) ?? null;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export { ADMIN_EMAIL };
