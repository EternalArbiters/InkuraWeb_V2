import "server-only";

import { getSession } from "@/server/auth/session";
import { revalidatePublicChapter } from "@/server/cache/publicContent";
import { apiRoute, json } from "@/server/http";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";
import { createStudioChapter } from "@/server/services/studio/chapters";
import { trackAnalyticsEventSafe } from "@/server/analytics/track";

export const runtime = "nodejs";

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimitOrResponse({ req, policyName: "studio.chapter.create", userId: session.user.id });
  if (limited) return limited;

  const res = await createStudioChapter(req);
  const chapter = (res.body as any)?.chapter as any;
  if (res.status >= 200 && res.status < 300) {
    revalidatePublicChapter({ chapterId: chapter?.id, workSlug: chapter?.workSlug });
    if (chapter?.status === "PUBLISHED") {
      await trackAnalyticsEventSafe({
        req,
        eventType: "CHAPTER_PUBLISH",
        userId: session.user.id,
        chapterId: chapter?.id,
        path: req.url,
        routeName: "studio.chapter.create",
      });
    }
  }
  return json(res.body, { status: res.status });
});
