import { useState } from "react";
import { useDebounce } from "react-use";
import { Search, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";

interface SearchBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  recentSearches?: string[];
  onRecentSearchClick?: (search: string) => void;
}

export function SearchBar({
  open,
  onOpenChange,
  onSearch,
  placeholder = "Buscar tarefas, atividades...",
  recentSearches = [],
  onRecentSearchClick,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  useDebounce(
    () => {
      if (query.trim()) {
        onSearch(query);
      }
    },
    300,
    [query]
  );

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  const handleRecentClick = (search: string) => {
    setQuery(search);
    onRecentSearchClick?.(search);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="h-full w-full rounded-none border-none p-0"
      >
        <div className="flex flex-col h-full bg-background">
          {/* Header com input */}
          <SheetHeader className="border-b px-4 py-4 space-y-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="thumb-friendly p-2 -ml-2 hover:bg-accent rounded-xl transition-all"
                aria-label="Fechar busca"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="w-full h-12 pl-11 pr-4 bg-secondary/60 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  autoFocus
                />
              </div>

              {query && (
                <button
                  onClick={handleClear}
                  className="thumb-friendly p-2 hover:bg-accent rounded-xl transition-all"
                  aria-label="Limpar busca"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </SheetHeader>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-4">
            {!query && recentSearches.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground px-1">
                  BUSCAS RECENTES
                </h3>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentClick(search)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-all text-left"
                    >
                      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground px-1">
                  Buscando por "{query}"...
                </p>
                {/* Resultados serão renderizados pelo componente pai */}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

