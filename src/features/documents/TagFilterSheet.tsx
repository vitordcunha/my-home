import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Tag, X } from "lucide-react";
import { DocumentItem } from "./useDocuments";

interface TagFilterSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    allDocuments: DocumentItem[];
}

export function TagFilterSheet({
    open,
    onOpenChange,
    selectedTags,
    onTagsChange,
    allDocuments,
}: TagFilterSheetProps) {
    // Extract all unique tags from documents
    const allTags = Array.from(
        new Set(
            allDocuments
                .flatMap(doc => doc.keywords || [])
                .filter(Boolean)
        )
    ).sort();

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            onTagsChange(selectedTags.filter(t => t !== tag));
        } else {
            onTagsChange([...selectedTags, tag]);
        }
    };

    const handleClear = () => {
        onTagsChange([]);
    };

    const handleApply = () => {
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl border-t">
                <div className="h-full flex flex-col">
                    <SheetHeader className="space-y-3 pb-6">
                        <SheetTitle className="text-xl flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Filtrar por Tags
                        </SheetTitle>
                        <SheetDescription>
                            Selecione uma ou mais tags para filtrar seus documentos
                        </SheetDescription>
                    </SheetHeader>

                    {/* Content with scroll */}
                    <div className="flex-1 overflow-y-auto space-y-4 pb-6">
                        {allTags.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Tag className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>Nenhuma tag encontrada</p>
                                <p className="text-sm mt-1">
                                    Tags são adicionadas automaticamente ao fazer upload de documentos
                                </p>
                            </div>
                        ) : (
                            <>
                                {selectedTags.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Selecionadas ({selectedTags.length})
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="default"
                                                    className="cursor-pointer px-3 py-2 h-9 text-sm"
                                                    onClick={() => toggleTag(tag)}
                                                >
                                                    #{tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Todas as Tags ({allTags.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant={selectedTags.includes(tag) ? "default" : "outline"}
                                                className="cursor-pointer px-3 py-2 h-9 text-sm transition-all hover:scale-105"
                                                onClick={() => toggleTag(tag)}
                                            >
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer with buttons */}
                    <div className="flex gap-3 pt-4 border-t safe-area-inset-bottom">
                        <Button
                            variant="outline"
                            onClick={handleClear}
                            className="flex-1 rounded-xl font-medium h-12"
                            disabled={selectedTags.length === 0}
                        >
                            Limpar
                        </Button>
                        <Button
                            onClick={handleApply}
                            className="flex-1 rounded-xl font-medium h-12"
                        >
                            Aplicar ({selectedTags.length})
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// Active Tags Chips Component
interface ActiveTagsChipsProps {
    tags: string[];
    onRemoveTag: (tag: string) => void;
}

export function ActiveTagsChips({ tags, onRemoveTag }: ActiveTagsChipsProps) {
    if (tags.length === 0) return null;

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {tags.map((tag) => (
                <Badge
                    key={tag}
                    variant="secondary"
                    className="shrink-0 snap-start flex items-center gap-2 px-3 py-2 h-9"
                >
                    <Tag className="h-3 w-3" />
                    <span className="text-sm">#{tag}</span>
                    <button
                        onClick={() => onRemoveTag(tag)}
                        className="hover:bg-background/50 rounded-full p-0.5 transition-colors"
                        aria-label={`Remover tag ${tag}`}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
        </div>
    );
}
