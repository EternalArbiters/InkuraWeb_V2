import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { ADMIN_EMAIL } from "@/lib/authOptions";

const db = prisma as any;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeUsername(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, identifier, password } = req.body || {};

  const idStr = String(identifier || "").trim();
  const passStr = String(password || "");
  const nameStr = String(name || "").trim();

  if (!idStr || !passStr) {
    return res.status(400).json({ error: "Email/username dan password wajib diisi" });
  }

  // Signup wajib pakai email supaya konsisten (dan admin email bisa dipastikan)
  if (!isValidEmail(idStr)) {
    return res.status(400).json({ error: "Gunakan format email yang valid untuk registrasi" });
  }

  if (passStr.length < 6) {
    return res.status(400).json({ error: "Password minimal 6 karakter" });
  }

  const email = idStr.toLowerCase();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email sudah terdaftar" });
  }

  const baseUsername = normalizeUsername(email.split("@")[0] || "user") || "user";

  let username = baseUsername;
  for (let i = 0; i < 50; i++) {
    const exists = await db.user.findUnique({ where: { username } });
    if (!exists) break;
    username = `${baseUsername}${i + 1}`.slice(0, 20);
  }

  const hashed = await bcrypt.hash(passStr, 10);

  const role = email === ADMIN_EMAIL ? "ADMIN" : "USER";

  const user = await db.user.create({
    data: {
      email,
      username,
      password: hashed,
      role: role as any,
      name: nameStr || null,
      adultConfirmed: false,
    },
    select: { id: true },
  });

  return res.status(201).json({ ok: true, userId: user.id });
}
