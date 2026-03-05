import "server-only";

import prisma from "@/server/db/prisma";

export type CommentTargetTypeString = "WORK" | "CHAPTER";

export async function canModerateForTarget(input: {
  session: any;
  targetType: CommentTargetTypeString;
  targetId: string;
}): Promise<boolean> {
  const { session, targetType, targetId } = input;
  if (!session?.user?.id) return false;
  if (session.user.role === "ADMIN") return true;

  const userId = session.user.id as string;
  if (targetType === "WORK") {
    const w = await prisma.work.findUnique({
      where: { id: targetId },
      select: { authorId: true },
    });
    return !!w && w.authorId === userId;
  }

  const ch = await prisma.chapter.findUnique({
    where: { id: targetId },
    select: { work: { select: { authorId: true } } },
  });
  return !!ch && ch.work.authorId === userId;
}
