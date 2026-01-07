import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, startOfDay, subDays } from "date-fns";

export interface MemberAnalytics {
    id: string;
    nome: string;
    avatar: string | null;
    total_points: number;

    // Tarefas
    tasks_completed_total: number;
    tasks_completed_this_month: number;
    tasks_completed_today: number;

    // XP
    xp_this_month: number;
    xp_today: number;

    // Engajamento
    active_days_this_month: number;
    current_streak: number;
    last_activity: string | null;
}

export interface DailyActivity {
    date: string;
    user_id: string;
    tasks_completed: number;
    xp_earned: number;
}

export function useAnalyticsQuery(householdId?: string) {
    return useQuery({
        queryKey: ["analytics", householdId],
        queryFn: async () => {
            if (!householdId) return null;

            // Get all household members
            const { data: members, error: membersError } = await supabase
                .from("profiles")
                .select("*")
                .eq("household_id", householdId);

            if (membersError) throw membersError;
            if (!members) return null;

            const startOfThisMonth = startOfMonth(new Date());
            const startOfToday = startOfDay(new Date());

            // Get all task history for this household
            const { data: allHistory, error: historyError } = await supabase
                .from("tasks_history")
                .select("*")
                .gte("completed_at", startOfThisMonth.toISOString());

            if (historyError) throw historyError;

            // Calculate analytics for each member
            const analytics: MemberAnalytics[] = members.map((member) => {
                const memberHistory = allHistory?.filter((h) => h.user_id === member.id) || [];

                // This month
                const thisMonthHistory = memberHistory.filter(
                    (h) => new Date(h.completed_at) >= startOfThisMonth
                );

                // Today
                const todayHistory = memberHistory.filter(
                    (h) => new Date(h.completed_at) >= startOfToday
                );

                // Calculate XP
                const xp_this_month = thisMonthHistory.reduce((sum, h) => sum + h.xp_earned, 0);
                const xp_today = todayHistory.reduce((sum, h) => sum + h.xp_earned, 0);

                // Calculate active days (unique days with activity)
                const uniqueDays = new Set(
                    thisMonthHistory.map((h) =>
                        new Date(h.completed_at).toISOString().split("T")[0]
                    )
                );
                const active_days_this_month = uniqueDays.size;

                // Calculate current streak
                let current_streak = 0;
                const today = new Date();
                let checkDate = startOfDay(today);

                while (true) {
                    const dayStr = checkDate.toISOString().split("T")[0];
                    const hasActivity = memberHistory.some((h) =>
                        h.completed_at.startsWith(dayStr)
                    );

                    if (hasActivity) {
                        current_streak++;
                        checkDate = subDays(checkDate, 1);
                    } else {
                        // If today has no activity, we don't break the streak yet
                        if (checkDate.toDateString() === today.toDateString()) {
                            checkDate = subDays(checkDate, 1);
                            continue;
                        }
                        break;
                    }
                }

                // Last activity
                const sortedHistory = memberHistory.sort(
                    (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
                );
                const last_activity = sortedHistory[0]?.completed_at || null;

                return {
                    id: member.id,
                    nome: member.nome,
                    avatar: member.avatar,
                    total_points: member.total_points,
                    tasks_completed_total: memberHistory.length,
                    tasks_completed_this_month: thisMonthHistory.length,
                    tasks_completed_today: todayHistory.length,
                    xp_this_month,
                    xp_today,
                    active_days_this_month,
                    current_streak,
                    last_activity,
                };
            });

            // Get daily activity for charts (last 30 days)
            const last30Days = subDays(new Date(), 30);
            const { data: recentHistory, error: recentError } = await supabase
                .from("tasks_history")
                .select("*")
                .gte("completed_at", last30Days.toISOString());

            if (recentError) throw recentError;

            // Group by date and user
            const dailyActivity: DailyActivity[] = [];
            const dateUserMap = new Map<string, Map<string, { tasks: number; xp: number }>>();

            recentHistory?.forEach((h) => {
                const date = new Date(h.completed_at).toISOString().split("T")[0];
                if (!dateUserMap.has(date)) {
                    dateUserMap.set(date, new Map());
                }
                const userMap = dateUserMap.get(date)!;
                if (!userMap.has(h.user_id)) {
                    userMap.set(h.user_id, { tasks: 0, xp: 0 });
                }
                const userData = userMap.get(h.user_id)!;
                userData.tasks++;
                userData.xp += h.xp_earned;
            });

            dateUserMap.forEach((userMap, date) => {
                userMap.forEach((data, userId) => {
                    dailyActivity.push({
                        date,
                        user_id: userId,
                        tasks_completed: data.tasks,
                        xp_earned: data.xp,
                    });
                });
            });

            return {
                members: analytics,
                dailyActivity,
            };
        },
        enabled: !!householdId,
    });
}
