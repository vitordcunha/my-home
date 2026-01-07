import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReceiptCaptureProps {
    onCapture: (base64Image: string) => void;
    isProcessing?: boolean;
}

export function ReceiptCapture({ onCapture, isProcessing = false }: ReceiptCaptureProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith("image/")) {
            toast({
                title: "Formato inválido",
                description: "Por favor, selecione uma imagem.",
                variant: "destructive"
            });
            return;
        }

        // Preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        try {
            // Compress/Resize logic could go here (using canvas)
            // For now, simple base64 conversion
            const base64 = await convertToBase64(file);
            onCapture(base64);
        } catch (error) {
            console.error("Error reading file", error);
            toast({
                title: "Erro ao ler imagem",
                variant: "destructive"
            });
            setPreview(null);
        }
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const clearSelection = () => {
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className="w-full">
            <input
                type="file"
                accept="image/*"
                capture="environment" // Prefer rear camera on mobile
                className="hidden"
                ref={inputRef}
                onChange={handleFileChange}
                disabled={isProcessing}
            />

            {!preview ? (
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2 border-dashed border-2 hover:bg-accent/50"
                        onClick={() => inputRef.current?.click()}
                        disabled={isProcessing}
                    >
                        <Camera className="h-6 w-6 text-primary" />
                        <span className="text-xs font-medium">Tirar Foto</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2 border-dashed border-2 hover:bg-accent/50"
                        onClick={() => inputRef.current?.click()} // Same input handles both for simplicity in this UI
                        disabled={isProcessing}
                    >
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs font-medium">Galeria</span>
                    </Button>
                </div>
            ) : (
                <div className="relative rounded-lg overflow-hidden border bg-background">
                    <img src={preview} alt="Receipt preview" className="w-full max-h-[300px] object-contain bg-black/5" />

                    {isProcessing && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center flex-col gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-foreground">Analisando nota...</p>
                        </div>
                    )}

                    {!isProcessing && (
                        <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                            onClick={clearSelection}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
