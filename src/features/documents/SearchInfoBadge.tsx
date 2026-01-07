import { Sparkles } from "lucide-react";

interface SearchInfoBadgeProps {
    tokenCount: number;
    resultCount: number;
    totalCount: number;
}

export function SearchInfoBadge({ tokenCount, resultCount, totalCount }: SearchInfoBadgeProps) {
    if (tokenCount === 0) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/50 text-sm">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-900 dark:text-blue-100">
                {tokenCount > 1 ? (
                    <>
                        Buscando <strong>{tokenCount} palavras</strong> · {resultCount} de {totalCount} documentos
                    </>
                ) : (
                    <>
                        {resultCount} de {totalCount} documentos
                    </>
                )}
            </span>
        </div>
    );
}
