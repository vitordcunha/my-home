import { useState, useRef } from "react";
import { useAnalyzeDocument, useCreateDocument, DocumentItem } from "./useDocuments";
import { convertPdfPageToImage } from "./utils/pdf-to-image";
import { Loader2, Upload, FileText, X, Check, Lock, Unlock, Image as ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useToast } from "../../hooks/use-toast";

interface Props {
    onSuccess: () => void;
    onCancel: () => void;
}

export function DocumentUpload({ onSuccess, onCancel }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<DocumentItem['category']>('other');
    const [keywords, setKeywords] = useState<string[]>([]);
    const [newKeyword, setNewKeyword] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [summary, setSummary] = useState("");

    const analyzeMutation = useAnalyzeDocument();
    const createMutation = useCreateDocument();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            if (selectedFile.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    setPreview(result);
                    analyzeFile(result);
                };
                reader.readAsDataURL(selectedFile);
            } else if (selectedFile.type === "application/pdf") {
                try {
                    setPreview(null);
                    console.log("Converting PDF to image for preview...");
                    const result = await convertPdfPageToImage(selectedFile);
                    setPreview(result);
                    analyzeFile(result);
                } catch (error) {
                    console.error("PDF conversion error:", error);
                    // Set a generic PDF icon as preview instead of failing
                    setPreview("pdf-placeholder");
                    toast({
                        title: "PDF Carregado",
                        description: "Análise automática não disponível. Preencha os dados manualmente.",
                        variant: "default"
                    });
                    // Set a default title based on filename
                    const filename = selectedFile.name.replace(/\.pdf$/i, '');
                    setTitle(filename);
                }
            }
        }
    };

    const analyzeFile = (base64: string) => {
        setIsAnalyzing(true);
        analyzeMutation.mutate(base64, {
            onSuccess: (data) => {
                setTitle(data.title.replace(/['"]/g, '')); // Clean AI title
                setCategory(data.category);
                setKeywords(data.keywords || []);
                setSummary(data.summary);
                setIsAnalyzing(false);
            },
            onError: () => {
                toast({
                    title: "Erro na Análise",
                    description: "Não conseguimos ler o documento automaticamente. Preencha manualmente.",
                    variant: "destructive"
                });
                setIsAnalyzing(false);
            }
        });
    };

    const handleSave = () => {
        if (!file || !title) return;

        createMutation.mutate({
            file,
            metadata: {
                title,
                category,
                keywords,
                is_private: isPrivate,
                description: summary
            }
        }, {
            onSuccess: () => {
                toast({ title: "Documento Salvo!" });
                onSuccess();
            },
            onError: (error) => {
                console.error("Save failed:", error);
                toast({
                    title: "Erro ao salvar",
                    description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
                    variant: "destructive"
                });
            }
        });
    };

    const addKeyword = () => {
        if (newKeyword && !keywords.includes(newKeyword)) {
            setKeywords([...keywords, newKeyword]);
            setNewKeyword("");
        }
    };

    return (
        <div className="flex flex-col h-full bg-background rounded-xl overflow-hidden">
            {/* Header / Preview */}
            <div className="relative bg-muted/30 border-b min-h-[160px] flex items-center justify-center group transition-colors hover:bg-muted/50">
                {preview ? (
                    <>
                        {preview === "pdf-placeholder" ? (
                            <div className="flex flex-col items-center gap-3 p-8">
                                <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                    <FileText className="w-10 h-10 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-sm">PDF Carregado</p>
                                    <p className="text-xs text-muted-foreground mt-1">Preencha os dados abaixo</p>
                                </div>
                            </div>
                        ) : (
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-48 object-contain backdrop-blur-sm p-4"
                            />
                        )}
                        <button
                            onClick={() => {
                                setFile(null);
                                setPreview(null);
                            }}
                            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white transition-all shadow-sm z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center gap-3 cursor-pointer p-8 w-full h-full justify-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform dark:bg-blue-900/20">
                            <Upload className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="font-semibold text-foreground">Toque para adicionar</p>
                            <p className="text-sm text-muted-foreground">PDF ou Imagem</p>
                        </div>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                />

                {isAnalyzing && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                        <p className="font-medium animate-pulse text-sm">Analisando documento...</p>
                    </div>
                )}
            </div>

            {/* Form Fields */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Informações Básicas
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Nome do documento"
                            className="h-12 bg-muted/30 border-muted-foreground/20 text-lg font-medium placeholder:text-muted-foreground/50 transition-all focus:bg-background"
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1 space-y-2">
                            {/* Custom Select using browser default for now to keep it simple but styled */}
                            <div className="relative">
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as any)}
                                    className="w-full h-11 pl-3 pr-8 rounded-lg border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
                                >
                                    <option value="bill">🧾 Conta</option>
                                    <option value="contract">📝 Contrato</option>
                                    <option value="identity">🪪 Documento</option>
                                    <option value="manual">📘 Manual</option>
                                    <option value="other">📁 Outros</option>
                                </select>
                                <div className="absolute right-3 top-3 pointer-events-none opacity-50">
                                    <ImageIcon className="w-4 h-4" /> {/* Should be ChevronDown but let's just leave standard for now or use Lucide */}
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => setIsPrivate(!isPrivate)}
                            className={`h-11 px-4 gap-2 transition-all ${isPrivate
                                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50"
                                : "text-muted-foreground"
                                }`}
                        >
                            {isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            <span className="text-xs font-semibold">{isPrivate ? "Privado" : "Público"}</span>
                        </Button>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        Tags
                        <span className="text-[10px] font-normal normal-case opacity-70">
                            {keywords.length} tags
                        </span>
                    </label>

                    <div className="bg-muted/30 rounded-xl p-3 border border-muted-foreground/10 space-y-3">
                        <div className="flex flex-wrap gap-2 min-h-[32px]">
                            {keywords.length === 0 && (
                                <span className="text-sm text-muted-foreground/50 italic py-1">Sem tags...</span>
                            )}
                            {keywords.map((k, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground animate-in zoom-in-50 duration-200"
                                >
                                    #{k}
                                    <button
                                        onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))}
                                        className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2 relative">
                            <Input
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                                placeholder="Adicionar nova tag..."
                                className="h-9 bg-background/50 border-0 focus-visible:ring-1 focus-visible:bg-background transition-all pr-10 shadow-sm"
                            />
                            <Button
                                size="sm"
                                onClick={addKeyword}
                                className="absolute right-1 top-1 h-7 w-7 p-0 rounded-md"
                                disabled={!newKeyword}
                            >
                                <Check className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Persistent Footer Actions */}
            <div className="p-4 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={onCancel} className="h-12 border-dashed">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!file || !title || createMutation.isPending}
                        className="h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                    >
                        {createMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <Check className="w-5 h-5 mr-2" />
                        )}
                        Salvar
                    </Button>
                </div>
            </div>
        </div>
    );
}
