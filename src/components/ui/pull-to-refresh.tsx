import PullToRefresh from "react-simple-pull-to-refresh";
import { Loader2 } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";

interface PullToRefreshWrapperProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefreshWrapper({
  onRefresh,
  children,
}: PullToRefreshWrapperProps) {
  const { trigger } = useHaptic();

  const handleRefresh = async () => {
    await onRefresh();
    trigger("success");
  };

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      pullingContent={
        (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm mt-2 text-muted-foreground">
              Puxe para atualizar
            </span>
          </div>
        ) as any
      }
      refreshingContent={
        (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm mt-2 text-muted-foreground">
              Atualizando...
            </span>
          </div>
        ) as any
      }
      pullDownThreshold={70}
      maxPullDownDistance={120}
      resistance={2.5}
      className="overscroll-none"
    >
      <div>{children}</div>
    </PullToRefresh>
  );
}
