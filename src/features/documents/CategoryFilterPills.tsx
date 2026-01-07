import { Badge } from "@/components/ui/badge";
import { CATEGORY_CONFIG } from "./categoryConfig";
import { DocumentCategory } from "./useDocumentFilters";

interface CategoryFilterPillsProps {
    selected: DocumentCategory;
    onSelect: (category: DocumentCategory) => void;
}

const CATEGORIES: Array<{ value: DocumentCategory; label: string; emoji: string }> = [
    { value: 'all', label: 'Todos', emoji: '📋' },
    { value: 'bill', label: CATEGORY_CONFIG.bill.label, emoji: CATEGORY_CONFIG.bill.emoji },
    { value: 'contract', label: CATEGORY_CONFIG.contract.label, emoji: CATEGORY_CONFIG.contract.emoji },
    { value: 'identity', label: CATEGORY_CONFIG.identity.label, emoji: CATEGORY_CONFIG.identity.emoji },
    { value: 'manual', label: CATEGORY_CONFIG.manual.label, emoji: CATEGORY_CONFIG.manual.emoji },
    { value: 'other', label: CATEGORY_CONFIG.other.label, emoji: CATEGORY_CONFIG.other.emoji },
];

export function CategoryFilterPills({ selected, onSelect }: CategoryFilterPillsProps) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {CATEGORIES.map((category) => (
                <Badge
                    key={category.value}
                    variant={selected === category.value ? "default" : "outline"}
                    className="shrink-0 snap-start cursor-pointer px-3 py-2 h-9 text-sm transition-all hover:scale-105"
                    onClick={() => onSelect(category.value)}
                >
                    <span className="mr-1.5">{category.emoji}</span>
                    {category.label}
                </Badge>
            ))}
        </div>
    );
}
