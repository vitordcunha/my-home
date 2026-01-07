import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { useAnalyticsQuery } from "./useAnalyticsQuery";
import { PageHeader } from "@/components/ui/page-header";
import { TrendingUp, Flame, Trophy, Target, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AnalyticsScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: profile } = useProfileQuery(user?.id);
    const { data: analytics, isLoading } = useAnalyticsQuery(profile?.household_id ?? undefined);

    const [period, setPeriod] = useState<"today" | "month">("month");

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!analytics) {
        return null;
    }

    const { members } = analytics;

    // Sort members by XP this month
    const sortedMembers = [...members].sort((a, b) =>
        period === "today"
            ? b.xp_today - a.xp_today
            : b.xp_this_month - a.xp_this_month
    );

    // Calculate totals
    const totalTasksToday = members.reduce((sum, m) => sum + m.tasks_completed_today, 0);
    const totalTasksMonth = members.reduce((sum, m) => sum + m.tasks_completed_this_month, 0);
    const totalXpMonth = members.reduce((sum, m) => sum + m.xp_this_month, 0);
    const maxStreak = Math.max(...members.map(m => m.current_streak));

    // Top performer
    const topPerformer = sortedMembers[0];

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <PageHeader
                title="Analytics"
                description="Desempenho e progresso da casa"
                onBack={() => navigate("/")}
            />

            {/* Period Toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
                <button
                    onClick={() => setPeriod("today")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        period === "today"
                            ? "bg-background shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Hoje
                </button>
                <button
                    onClick={() => setPeriod("month")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        period === "month"
                            ? "bg-background shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Este Mês
                </button>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary/10 border-primary/20 rounded-2xl p-4 border shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {period === "today" ? "Hoje" : "Este Mês"}
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-foreground">
                        {period === "today" ? totalTasksToday : totalTasksMonth}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Tarefas completadas</div>
                </div>

                <div className="bg-primary/10 border-primary/20 rounded-2xl p-4 border shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">XP Total</span>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{totalXpMonth}</div>
                    <div className="text-xs text-muted-foreground mt-1">Pontos acumulados</div>
                </div>

                <div className="bg-destructive/10 border-destructive/20 rounded-2xl p-4 border shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Flame className="h-5 w-5 text-destructive" />
                        <span className="text-sm font-medium text-muted-foreground">Maior Streak</span>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{maxStreak}</div>
                    <div className="text-xs text-muted-foreground mt-1">Dias consecutivos</div>
                </div>

                <div className="bg-success/10 border-success/20 rounded-2xl p-4 border shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-5 w-5 text-success" />
                        <span className="text-sm font-medium text-muted-foreground">MVP</span>
                    </div>
                    <div className="text-xl font-bold text-foreground truncate">{topPerformer?.nome.split(" ")[0]}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {period === "today" ? topPerformer?.xp_today : topPerformer?.xp_this_month} XP
                    </div>
                </div>
            </div>

            {/* Podium - Top 3 */}
            {period === "month" && sortedMembers.length >= 3 && (
                <div className="bg-card rounded-2xl p-6 shadow-sm border">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-success" />
                        Pódio do Mês
                    </h3>
                    <div className="flex items-end justify-center gap-4 md:gap-8">
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center flex-1 max-w-[120px]">
                            <div className="relative mb-3">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center text-2xl md:text-3xl font-bold text-foreground shadow-lg border-2 border-border">
                                    {sortedMembers[1]?.avatar || sortedMembers[1]?.nome.charAt(0)}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-sm shadow-md border border-border">
                                    2
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-sm md:text-base truncate w-full">
                                    {sortedMembers[1]?.nome.split(" ")[0]}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {sortedMembers[1]?.xp_this_month} XP
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {sortedMembers[1]?.tasks_completed_this_month} tarefas
                                </div>
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div className="flex flex-col items-center flex-1 max-w-[140px] -mt-6">
                            <div className="relative mb-3">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-success/20 flex items-center justify-center text-3xl md:text-4xl font-bold text-foreground shadow-xl ring-4 ring-success/30 border-2 border-success">
                                    {sortedMembers[0]?.avatar || sortedMembers[0]?.nome.charAt(0)}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-success flex items-center justify-center font-bold shadow-lg">
                                    👑
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-base md:text-lg truncate w-full">
                                    {sortedMembers[0]?.nome.split(" ")[0]}
                                </div>
                                <div className="text-sm font-semibold text-success">
                                    {sortedMembers[0]?.xp_this_month} XP
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {sortedMembers[0]?.tasks_completed_this_month} tarefas
                                </div>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center flex-1 max-w-[120px]">
                            <div className="relative mb-3">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-destructive/20 flex items-center justify-center text-2xl md:text-3xl font-bold text-foreground shadow-lg border-2 border-destructive/30">
                                    {sortedMembers[2]?.avatar || sortedMembers[2]?.nome.charAt(0)}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-destructive/80 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    3
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-sm md:text-base truncate w-full">
                                    {sortedMembers[2]?.nome.split(" ")[0]}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {sortedMembers[2]?.xp_this_month} XP
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {sortedMembers[2]?.tasks_completed_this_month} tarefas
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Individual Stats */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Desempenho Individual
                </h3>
                <div className="grid gap-4">
                    {sortedMembers.map((member, index) => {
                        const xp = period === "today" ? member.xp_today : member.xp_this_month;
                        const tasks = period === "today" ? member.tasks_completed_today : member.tasks_completed_this_month;
                        const maxXp = period === "today"
                            ? Math.max(...members.map(m => m.xp_today))
                            : Math.max(...members.map(m => m.xp_this_month));
                        const percentage = maxXp > 0 ? (xp / maxXp) * 100 : 0;

                        return (
                            <div
                                key={member.id}
                                className="bg-card rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Position Badge */}
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                        index === 0 && "bg-success/20 text-success border border-success/30",
                                        index === 1 && "bg-muted text-foreground border border-border",
                                        index === 2 && "bg-destructive/20 text-destructive border border-destructive/30",
                                        index > 2 && "bg-muted text-muted-foreground border border-border"
                                    )}>
                                        {index + 1}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xl font-bold">
                                        {member.avatar || member.nome.charAt(0)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold truncate">{member.nome}</h4>
                                            {member.current_streak > 0 && (
                                                <div className="flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full border border-destructive/20">
                                                    <Flame className="h-3 w-3" />
                                                    {member.current_streak}
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                                            <div
                                                className="bg-gradient-to-r from-primary to-primary/60 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="font-medium text-foreground">{xp} XP</span>
                                            <span>{tasks} tarefas</span>
                                            {period === "month" && (
                                                <>
                                                    <span>{member.active_days_this_month} dias ativos</span>
                                                    {member.last_activity && (
                                                        <span className="hidden md:inline">
                                                            Última: {formatDistanceToNow(new Date(member.last_activity), {
                                                                addSuffix: true,
                                                                locale: ptBR
                                                            })}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Badges Section */}
            {period === "month" && (
                <div className="bg-card rounded-2xl p-6 shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        🏅 Conquistas do Mês
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* MVP */}
                        <div className="text-center p-4 rounded-xl bg-success/10 border border-success/20">
                            <div className="text-3xl mb-2">👑</div>
                            <div className="font-semibold text-sm">MVP do Mês</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {topPerformer?.nome.split(" ")[0]}
                            </div>
                        </div>

                        {/* Streak Master */}
                        {(() => {
                            const streakMaster = [...members].sort((a, b) => b.current_streak - a.current_streak)[0];
                            return (
                                <div className="text-center p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                                    <div className="text-3xl mb-2">🔥</div>
                                    <div className="font-semibold text-sm">Streak Master</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {streakMaster?.nome.split(" ")[0]} ({streakMaster?.current_streak} dias)
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Most Active */}
                        {(() => {
                            const mostActive = [...members].sort((a, b) => b.active_days_this_month - a.active_days_this_month)[0];
                            return (
                                <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                                    <div className="text-3xl mb-2">⚡</div>
                                    <div className="font-semibold text-sm">Mais Ativo</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {mostActive?.nome.split(" ")[0]} ({mostActive?.active_days_this_month} dias)
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Most Tasks */}
                        {(() => {
                            const mostTasks = [...members].sort((a, b) => b.tasks_completed_this_month - a.tasks_completed_this_month)[0];
                            return (
                                <div className="text-center p-4 rounded-xl bg-success/10 border border-success/20">
                                    <div className="text-3xl mb-2">💪</div>
                                    <div className="font-semibold text-sm">Mais Tarefas</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {mostTasks?.nome.split(" ")[0]} ({mostTasks?.tasks_completed_this_month})
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
