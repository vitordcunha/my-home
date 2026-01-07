import { FileText, Receipt, FileSignature, CreditCard, BookOpen, Folder } from "lucide-react";
import { DocumentItem } from "./useDocuments";

interface CategoryConfig {
    icon: typeof FileText;
    label: string;
    emoji: string;
    color: string;
    bgColor: string;
}

export const CATEGORY_CONFIG: Record<DocumentItem['category'], CategoryConfig> = {
    bill: {
        icon: Receipt,
        label: 'Conta',
        emoji: '🧾',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    contract: {
        icon: FileSignature,
        label: 'Contrato',
        emoji: '📝',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    identity: {
        icon: CreditCard,
        label: 'Documento',
        emoji: '🪪',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    manual: {
        icon: BookOpen,
        label: 'Manual',
        emoji: '📘',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    other: {
        icon: Folder,
        label: 'Outros',
        emoji: '📁',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    },
};

export const getCategoryConfig = (category: DocumentItem['category']): CategoryConfig => {
    return CATEGORY_CONFIG[category];
};
