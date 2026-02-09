import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { deletePublicUpload, saveCoverUpload } from "@/lib/upload";

export const runtime = "nodejs";

function safeJsonArray(v: unknown): string[] {
  if (typeof v !== "string") return []
  try {
    const parsed = JSON.parse(v)
    if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean)
  } catch {
    // ignore
  }
  return []
}

function safeBool(v: unknown) {
  if (typeof v === "string") {
    const s = v.toLowerCase().trim()
    return s === "1" || s === "true" || s === "yes" || s === "on"
  }
  return false
}

export async function GET(_req: Request, { params }: { params: Promise<{ workId: string }> }) {
  const { workId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const work = await prisma.work.findUnique({
    where: { id: workId },
    include: {
      genres: true,
      tags: true,
      warningTags: true,
      chapters: { orderBy: { number: "asc" }, select: { id: true, number: true, title: true, publishedAt: true, isMature: true, warningTags: { select: { id: true, name: true, slug: true } } } },
    },
  })

  if (!work) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (work.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ work })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ workId: string }> }) {
  const { workId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.work.findUnique({
    where: { id: workId },
    select: { id: true, authorId: true, coverImage: true },
  })

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const fd = await req.formData()

    const title = String(fd.get("title") || "").trim()
    const slug = String(fd.get("slug") || "").trim()
    const description = String(fd.get("description") || "")

    const language = String(fd.get("language") || "").toLowerCase().trim() || undefined
    const origin = String(fd.get("origin") || "").toUpperCase().trim() || undefined
    const completion = String(fd.get("completion") || "").toUpperCase().trim() || undefined
    const isMature = fd.get("isMature") != null ? safeBool(fd.get("isMature")) : undefined

    const genreIds = safeJsonArray(fd.get("genreIds"))
    const warningTagIds = safeJsonArray(fd.get("warningTagIds"))
    const tagNames = safeJsonArray(fd.get("tags"))

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }

    let coverImage: string | null | undefined = undefined
    const removeCover = String(fd.get("removeCover") || "").toLowerCase() === "true"

    const cover = fd.get("cover")
    if (cover && typeof cover !== "string") {
      const file = cover as File
      if (file.size > 0) {
        const saved = await saveCoverUpload(file, "covers")
        coverImage = saved.url
      }
    }

    // remove cover (best-effort delete)
    if (removeCover) {
      coverImage = null
      if (existing.coverImage) {
        await deletePublicUpload(existing.coverImage)
      }
    }

    const updated = await prisma.work.update({
      where: { id: workId },
      data: {
        title,
        slug: slugify(slug),
        description: description || null,
        ...(coverImage !== undefined ? { coverImage } : {}),

        ...(language ? { language } : {}),
        ...(origin ? { origin: origin as any } : {}),
        ...(completion ? { completion: completion as any } : {}),
        ...(isMature !== undefined ? { isMature } : {}),

        genres: { set: genreIds.map((id) => ({ id })) },
        warningTags: { set: warningTagIds.map((id) => ({ id })) },
        tags: tagNames.length
          ? {
              set: [],
              connectOrCreate: tagNames.slice(0, 50).map((name) => {
                const s = slugify(name)
                return { where: { slug: s }, create: { name, slug: s } }
              }),
            }
          : { set: [] },
      },
      select: { id: true, title: true, slug: true },
    })

    return NextResponse.json({ ok: true, work: updated })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
