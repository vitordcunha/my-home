import { Lock, Unlock, Globe, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PrivacyFilter, SortOption } from "./useDocumentFilters";

interface DocumentControlsProps {
    privacy: PrivacyFilter;
    sort: SortOption;
    onPrivacyChange: (privacy: PrivacyFilter) => void;
    onSortChange: (sort: SortOption) => void;
}

const PRIVACY_OPTIONS: Array<{ value: PrivacyFilter; label: string; icon: typeof Lock }> = [
    { value: 'all', label: 'Todos', icon: Globe },
    { value: 'private', label: 'Privados', icon: Lock },
    { value: 'shared', label: 'Compartilhados', icon: Unlock },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
    { value: 'recent', label: 'Mais Recentes' },
    { value: 'oldest', label: 'Mais Antigos' },
    { value: 'alphabetical', label: 'A-Z' },
];

export function DocumentControls({
    privacy,
    sort,
    onPrivacyChange,
    onSortChange,
}: DocumentControlsProps) {
    const currentPrivacy = PRIVACY_OPTIONS.find(opt => opt.value === privacy);
    const PrivacyIcon = currentPrivacy?.icon || Globe;
    const currentSort = SORT_OPTIONS.find(opt => opt.value === sort);

    return (
        <div className="flex items-center gap-2">
            {/* Privacy Filter */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 text-sm"
                    >
                        <PrivacyIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">{currentPrivacy?.label}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {PRIVACY_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() => onPrivacyChange(option.value)}
                                className="gap-2"
                            >
                                <Icon className="h-4 w-4" />
                                {option.label}
                                {privacy === option.value && (
                                    <span className="ml-auto text-primary">✓</span>
                                )}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 text-sm"
                    >
                        <ArrowUpDown className="h-4 w-4" />
                        <span className="hidden sm:inline">{currentSort?.label}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {SORT_OPTIONS.map((option) => (
                        <DropdownMenuItem
                            key={option.value}
                            onClick={() => onSortChange(option.value)}
                        >
                            {option.label}
                            {sort === option.value && (
                                <span className="ml-auto text-primary">✓</span>
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
