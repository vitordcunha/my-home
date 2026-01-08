import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { DebtManager } from "./components/DebtManager";
import { PageHeader } from "@/components/ui/page-header";

export function DebtsScreen() {
    const { user } = useAuth();
    const { data: profile } = useProfileQuery(user?.id);
    const navigate = useNavigate();

    if (!profile?.household_id) return null;

    return (
        <div className="pb-24 space-y-6">
            <PageHeader
                title="Gestão de Dívidas"
                description="Cadastre seus cartões e dívidas recorrentes"
                onBack={() => navigate(-1)}
            />
            <div className="px-4">
                <DebtManager householdId={profile.household_id} />
            </div>
        </div>
    );
}
