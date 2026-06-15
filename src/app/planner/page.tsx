import { redirect } from "next/navigation";

/**
 * The standalone Bed Planner has been folded into the unified Garden hub.
 * Keep the old route alive by redirecting to the Companions tab so existing
 * links and bookmarks still land in the right place.
 */
export default function PlannerPage() {
  redirect("/garden?tab=companions");
}
