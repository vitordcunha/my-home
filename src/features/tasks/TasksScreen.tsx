import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TaskList from "@/components/tasks/TaskList";
import TaskFormDialog from "@/components/tasks/TaskFormDialog";
import { Button } from "@/components/ui/button";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { History, CalendarDays, Plus, TrendingUp, Trash2 } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { PullToRefreshWrapper } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { useTasksQuery, useAllActiveTasksQuery } from "@/features/tasks/useTasksQuery";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { PersonFilter } from "@/features/tasks/PersonFilter";
import { useHouseholdQuery } from "@/features/households/useHouseholdQuery";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TasksTimeline } from "@/components/tasks/TasksTimeline";

export default function TasksScreen() {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [activeTab, setActiveTab] = useState("today");

    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Fetch all data
    const { data: profile } = useProfileQuery(user?.id);
    const { data: household } = useHouseholdQuery(profile?.household_id);
    const members = household?.members || [];

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id && selectedUserId === null) {
            setSelectedUserId(user.id);
        }
        // Only run once when user loads
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const { data: allTasks } = useTasksQuery({ onlyMyTasks: false });
    const { data: filteredTasks } = useTasksQuery({
        onlyMyTasks: !!selectedUserId,
        userId: selectedUserId ?? undefined,
    });

    const { data: timelineTasks } = useAllActiveTasksQuery({
        onlyMyTasks: !!selectedUserId,
        userId: selectedUserId ?? undefined,
    });

    const handleRefresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    };

    return (
        <>
            <PullToRefreshWrapper onRefresh={handleRefresh}>
                <div className="space-y-6 overflow-visible">
                    {/* Header da página */}
                    <PageHeader
                        title="Tarefas"
                        description="Gerencie suas tarefas e acompanhe o progresso"
                        actions={
                            <Button
                                onClick={() => setShowCreateDialog(true)}
                                className="hidden md:flex gap-2"
                                size="default"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="font-medium">Nova Tarefa</span>
                            </Button>
                        }
                    />

                    {/* Tabs de visualização */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="today">Hoje</TabsTrigger>
                            <TabsTrigger value="week">Semana</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>

                        {/* Tab: Hoje */}
                        <TabsContent value="today" className="space-y-4 mt-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold">
                                    {selectedUserId
                                        ? selectedUserId === user?.id
                                            ? "Suas Tarefas"
                                            : `Tarefas de ${members
                                                .find((m) => m.id === selectedUserId)
                                                ?.nome.split(" ")[0] || "..."
                                            }`
                                        : "Todas as Tarefas"}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => navigate("/history")}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <History className="h-4 w-4" />
                                        <span className="hidden sm:inline">Histórico</span>
                                    </Button>

                                    <Button
                                        onClick={() => navigate("/tasks/trash")}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="hidden sm:inline">Lixeira</span>
                                    </Button>

                                    <div className="border-l ml-1 w-1 h-6" />

                                    <PersonFilter
                                        members={members}
                                        selectedUserId={selectedUserId}
                                        onSelectUserId={setSelectedUserId}
                                    />
                                </div>
                            </div>

                            {/* Lista de tarefas */}
                            <TaskList
                                onlyMyTasks={!!selectedUserId}
                                userId={selectedUserId || undefined}
                            />
                        </TabsContent>

                        {/* Tab: Semana */}
                        <TabsContent value="week" className="space-y-4 mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold">Visão Semanal</h3>
                                <Button
                                    onClick={() => navigate("/tasks/week")}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Ver Calendário Completo
                                </Button>
                            </div>

                            <div className="mt-6">
                                <TasksTimeline tasks={timelineTasks || []} />
                            </div>
                        </TabsContent>

                        {/* Tab: Analytics */}
                        <TabsContent value="analytics" className="space-y-4 mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold">Analytics de Tarefas</h3>
                                <Button
                                    onClick={() => navigate("/analytics")}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <TrendingUp className="h-4 w-4" />
                                    Ver Analytics Completo
                                </Button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Total de Tarefas</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{allTasks?.length || 0}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            tarefas pendentes
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Minhas Tarefas</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{filteredTasks?.length || 0}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            atribuídas a você
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Mais Métricas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Acesse o Analytics completo para ver gráficos detalhados, tendências e insights sobre suas tarefas.
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </PullToRefreshWrapper>

            {/* Floating Action Button */}
            <FloatingActionButton
                onClick={() => setShowCreateDialog(true)}
                ariaLabel="Criar nova tarefa"
                variant="blue"
                size="sm"
                mobileOnly={true}
            />

            <TaskFormDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
            />
        </>
    );
}
