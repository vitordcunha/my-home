import { NavLink, useLocation } from "react-router-dom";
import { Home, ShoppingCart, Wallet, FileText, ListTodo /*, Wrench */ } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";

const navItems = [
  {
    to: "/",
    icon: Home,
    label: "Hoje",
  },
  {
    to: "/tasks",
    icon: ListTodo,
    label: "Tarefas",
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
  {
    to: "/documents",
    icon: FileText,
    label: "Docs",
  },
];

export default function BottomNav() {
  const { trigger } = useHaptic();
  const location = useLocation();

  // Encontra o índice do item ativo para posicionar o indicador
  const activeIndex = navItems.findIndex((item) =>
    item.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.to)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-area-inset-bottom">
      {/* Ilha flutuante com glassmorphism premium */}
      <div className="mx-4 mb-2 relative">
        {/* Container principal com glass effect */}
        <div className="relative bg-background/70 backdrop-blur-2xl border border-border/30 rounded-full shadow-2xl overflow-hidden">
          {/* Indicador pill animado - posicionado absolutamente */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-16 h-12 transition-all duration-300 ease-out rounded-full bg-primary/10"
            style={{
              left: `calc((100% / ${navItems.length}) * ${activeIndex} + (100% / ${navItems.length} / 2))`,
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Items da navegação - usando grid para garantir tamanhos iguais */}
          <div className="relative grid h-14 items-center" style={{ gridTemplateColumns: `repeat(${navItems.length}, 1fr)` }}>
            {navItems.map((item) => {
              const isCurrentlyActive =
                item.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => {
                    // Só dispara haptic se não estiver na página atual
                    if (!isCurrentlyActive) {
                      trigger("light");
                    }
                  }}
                  className={({ isActive }) =>
                    cn(
                      "relative flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-all duration-200 rounded-full",
                      "active:scale-95",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          "h-5 w-5 transition-all duration-200",
                          isActive && "scale-110"
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span
                        className={cn(
                          "text-[10px] transition-all duration-200 leading-tight",
                          isActive && "font-semibold"
                        )}
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
