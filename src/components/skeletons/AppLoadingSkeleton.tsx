import { Home } from "lucide-react";

export function AppLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-6 animate-in">
        <div className="relative">
          <div className="h-20 w-20 mx-auto">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-primary/20 to-primary/5 animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Home className="h-10 w-10 text-primary animate-pulse" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 w-32 mx-auto bg-primary/20 rounded-full animate-pulse" />
          <div className="h-2 w-48 mx-auto bg-primary/10 rounded-full animate-pulse delay-75" />
        </div>
      </div>
    </div>
  );
}

