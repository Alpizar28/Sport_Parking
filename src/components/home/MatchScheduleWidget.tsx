import { getUpcomingMatches } from "@/lib/football";
import MatchWidgetClient from "./MatchWidgetClient";

export default async function MatchScheduleWidget() {
    // 🔒 Secure Server-Side Data Fetching
    const matches = await getUpcomingMatches();

    return <MatchWidgetClient initialMatches={matches} />;
}
