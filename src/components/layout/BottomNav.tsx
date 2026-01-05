import { NavLink } from "react-router-dom";
import { Home, ShoppingCart, Trophy, Wallet /*, Wrench */ } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    to: "/",
    icon: Home,
    label: "Hoje",
  },
  {
    to: "/expenses",
    icon: Wallet,
    label: "Despesas",
  },
  {
    to: "/shopping",
    icon: ShoppingCart,
    label: "Mercado",
  },
  // {
  //   to: "/maintenance",
  //   icon: Wrench,
  //   label: "Manutenção",
  // },
  {
    to: "/ranking",
    icon: Trophy,
    label: "Ranking",
  },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t safe-area-inset-bottom">
      <div className="container flex h-20 items-center justify-around px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all duration-200 thumb-friendly",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-in" />
                )}
                <div className="relative">
                  <item.icon
                    className={cn(
                      "h-6 w-6 transition-all duration-200",
                      isActive && "scale-110"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-all duration-200 relative",
                    isActive && "font-semibold"
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
