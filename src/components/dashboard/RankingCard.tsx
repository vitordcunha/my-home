import { Trophy, Crown, TrendingUp } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { useNavigate } from "react-router-dom";

interface RankingCardProps {
  topUserName: string;
  topUserPoints: number;
  currentUserPosition?: number;
  currentUserPoints?: number;
}

export function RankingCard({
  topUserName,
  topUserPoints,
  currentUserPosition,
  currentUserPoints
}: RankingCardProps) {
  const navigate = useNavigate();
  const isCurrentUserTop = currentUserPosition === 1;

  return (
    <BentoCard
      className="h-full"
      onClick={() => navigate("/ranking")}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-muted">
            <Trophy className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-sm">Ranking</h3>
        </div>

        <div className="flex flex-col gap-2">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Crown className="h-4 w-4 text-warning" />
              <span className="text-sm font-semibold truncate">{topUserName}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {topUserPoints} pontos
            </p>
          </div>

          {currentUserPosition && !isCurrentUserTop && (
            <div className="pt-2 mt-2 border-t">
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Você está em {currentUserPosition}º
                </span>
              </div>
              {currentUserPoints !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  {currentUserPoints} pontos
                </p>
              )}
            </div>
          )}

          {isCurrentUserTop && (
            <div className="pt-2 mt-2 border-t">
              <p className="text-xs text-warning font-medium flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Você está em 1º lugar!
              </p>
            </div>
          )}
        </div>
      </div>
    </BentoCard>
  );
}

