import { DocumentItem } from "./useDocuments";
import { format } from "date-fns";
import { Lock, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getCategoryConfig } from "./categoryConfig";

interface Props {
    document: DocumentItem;
}

export function DocumentCard({ document }: Props) {
    const categoryConfig = getCategoryConfig(document.category);
    const Icon = categoryConfig.icon;

    const handleDownload = async () => {
        // For private buckets we use createSignedUrl
        const { data: signedData } = await supabase.storage
            .from('documents')
            .createSignedUrl(document.file_path, 60); // 60 seconds

        if (signedData) {
            window.open(signedData.signedUrl, '_blank');
        }
    };

    return (
        <div
            onClick={handleDownload}
            className="flex flex-col bg-card rounded-xl shadow-sm border border-border overflow-hidden active:scale-[0.98] transition-all cursor-pointer hover:shadow-md"
        >
            <div className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-lg ${categoryConfig.bgColor}`}>
                        <Icon className={`w-8 h-8 ${categoryConfig.color}`} />
                    </div>
                    {document.is_private && (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>

                <div>
                    <h3 className="font-semibold text-foreground line-clamp-2">{document.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{document.category}</p>
                </div>

                {document.keywords && document.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {document.keywords.slice(0, 3).map((k, i) => (
                            <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                {k}
                            </span>
                        ))}
                    </div>
                )}

                <div className="mt-auto pt-2 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(document.created_at), "dd/MM/yyyy")}</span>
                </div>
            </div>
        </div>
    );
}
