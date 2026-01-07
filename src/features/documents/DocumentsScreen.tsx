import { useState } from "react";
import { useDocuments, DocumentItem } from "./useDocuments";
import { DocumentCard } from "./DocumentCard";
import { DocumentUpload } from "./DocumentUpload";
import { PageHeader } from "../../components/ui/page-header";
import { FloatingActionButton } from "../../components/ui/floating-action-button";
import { Sheet, SheetContent } from "../../components/ui/sheet";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Search, FileText, Tag, X } from "lucide-react";
import { PullToRefreshWrapper } from "../../components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { useDocumentFilters, filterDocuments } from "./useDocumentFilters";
import { CategoryFilterPills } from "./CategoryFilterPills";
import { DocumentControls } from "./DocumentControls";
import { TagFilterSheet, ActiveTagsChips } from "./TagFilterSheet";
import { useDocumentSearch } from "./useDocumentSearch";
import { SearchInfoBadge } from "./SearchInfoBadge";

export function DocumentsScreen() {
    const [search, setSearch] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);

    // Fetch all documents
    const { data: documents, isLoading } = useDocuments();
    const queryClient = useQueryClient();

    // Apply hybrid search
    const { results: searchResults, searchInfo } = useDocumentSearch(documents, search);

    // Apply filters
    const {
        filters,
        updateFilter,
        toggleTag,
        clearFilters,
        hasActiveFilters,
    } = useDocumentFilters();

    const handleRefresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ["documents"] });
    };

    // Apply filters to search results
    const filteredDocuments = filterDocuments(searchResults, filters);

    return (
        <PullToRefreshWrapper onRefresh={handleRefresh}>
            <div className="space-y-4 pb-24">
                <PageHeader
                    title="Documentos"
                    description="Seu cofre digital inteligente."
                />

                {/* Search Bar */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nome, tag, empresa..."
                            className="pl-9 bg-muted/50 border-0 h-12"
                        />
                    </div>

                    {/* Search Info Badge */}
                    {searchInfo.hasQuery && (
                        <SearchInfoBadge
                            tokenCount={searchInfo.tokenCount}
                            resultCount={searchInfo.resultCount}
                            totalCount={searchInfo.totalCount}
                        />
                    )}
                </div>

                {/* Category Filter Pills */}
                <CategoryFilterPills
                    selected={filters.category}
                    onSelect={(category) => updateFilter('category', category)}
                />

                {/* Controls Row: Privacy, Sort, and Tag Filter */}
                <div className="flex items-center justify-between gap-2">
                    <DocumentControls
                        privacy={filters.privacy}
                        sort={filters.sort}
                        onPrivacyChange={(privacy) => updateFilter('privacy', privacy)}
                        onSortChange={(sort) => updateFilter('sort', sort)}
                    />

                    <div className="flex items-center gap-2">
                        {/* Tag Filter Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2 text-sm"
                            onClick={() => setIsTagFilterOpen(true)}
                        >
                            <Tag className="h-4 w-4" />
                            <span className="hidden sm:inline">Tags</span>
                            {filters.selectedTags.length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                                    {filters.selectedTags.length}
                                </span>
                            )}
                        </Button>

                        {/* Clear Filters Button */}
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 gap-2 text-sm"
                                onClick={clearFilters}
                            >
                                <X className="h-4 w-4" />
                                <span className="hidden sm:inline">Limpar</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Active Tags Chips */}
                {filters.selectedTags.length > 0 && (
                    <ActiveTagsChips
                        tags={filters.selectedTags}
                        onRemoveTag={toggleTag}
                    />
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12 text-muted-foreground animate-pulse">
                        Carregando documentos...
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && filteredDocuments.length === 0 && !search && !hasActiveFilters && (
                    <div className="text-center py-16 space-y-6 animate-in">
                        <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                            <FileText className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">Nenhum documento</h3>
                            <p className="text-muted-foreground">Adicione contas, manuais ou contratos.</p>
                        </div>
                    </div>
                )}

                {/* No Results State */}
                {!isLoading && filteredDocuments.length === 0 && (search || hasActiveFilters) && (
                    <div className="text-center py-16 space-y-4">
                        <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-muted">
                            <Search className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">Nenhum resultado</h3>
                            <p className="text-muted-foreground text-sm">
                                Tente ajustar os filtros ou buscar por outro termo
                            </p>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="mt-4"
                            >
                                Limpar filtros
                            </Button>
                        )}
                    </div>
                )}

                {/* Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocuments.map((doc: DocumentItem) => (
                        <DocumentCard key={doc.id} document={doc} />
                    ))}
                </div>

                {/* Upload Sheet */}
                <Sheet open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <SheetContent side="bottom" className="h-[90vh] sm:h-[80vh] p-0 rounded-t-xl bg-background">
                        <div className="h-full flex flex-col">
                            <div className="p-4 border-b">
                                <h3 className="font-semibold text-lg">Novo Documento</h3>
                            </div>
                            <div className="flex-1 overflow-hidden bg-background p-4">
                                <DocumentUpload
                                    onSuccess={() => setIsUploadOpen(false)}
                                    onCancel={() => setIsUploadOpen(false)}
                                />
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Tag Filter Sheet */}
                <TagFilterSheet
                    open={isTagFilterOpen}
                    onOpenChange={setIsTagFilterOpen}
                    selectedTags={filters.selectedTags}
                    onTagsChange={(tags) => updateFilter('selectedTags', tags)}
                    allDocuments={documents || []}
                />

                {/* FAB */}
                <FloatingActionButton
                    onClick={() => setIsUploadOpen(true)}
                    ariaLabel="Adicionar Documento"
                    variant="blue"
                    size="sm"
                />
            </div>
        </PullToRefreshWrapper>
    );
}
