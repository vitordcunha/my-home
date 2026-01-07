import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export interface DocumentItem {
    id: string;
    created_at: string;
    user_id: string;
    household_id: string;
    title: string;
    description?: string | null;
    file_path: string;
    file_type: string;
    category: 'bill' | 'manual' | 'contract' | 'identity' | 'other';
    keywords: string[] | null;
    expiry_date?: string | null;
    is_private: boolean;
}

export interface AnalyzedData {
    title: string;
    category: DocumentItem['category'];
    keywords: string[];
    summary: string;
    expiry_date?: string | null;
}

export const useDocuments = () => {
    return useQuery({
        queryKey: ["documents"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("documents")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as DocumentItem[];
        },
    });
};

export const useAnalyzeDocument = () => {
    return useMutation({
        mutationFn: async (imageBase64: string): Promise<AnalyzedData> => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ image_base64: imageBase64 }),
            });

            if (!response.ok) {
                throw new Error("Failed to analyze document");
            }

            return response.json();
        },
    });
};

export const useCreateDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            file,
            metadata
        }: {
            file: File,
            metadata: Pick<DocumentItem, "title" | "category" | "is_private"> & { description?: string, keywords?: string[] }
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            // 1. Get household
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('household_id')
                .eq('id', user.id)
                .maybeSingle();

            if (!userProfile?.household_id) throw new Error("User has no household");

            // 2. Upload file
            const fileExt = file.name ? file.name.split('.').pop() : 'bin';
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, file, {
                    contentType: file.type || undefined,
                    upsert: false
                });

            if (uploadError) {
                console.error("Supabase Storage Upload Error:", uploadError);
                throw new Error(`Erro no upload: ${uploadError.message}`);
            }

            // 3. Create Record
            const { data, error } = await supabase
                .from('documents')
                .insert({
                    title: metadata.title,
                    category: metadata.category,
                    keywords: metadata.keywords || [],
                    description: metadata.description || null,
                    is_private: metadata.is_private,
                    user_id: user.id,
                    household_id: userProfile.household_id,
                    file_path: fileName,
                    file_type: file.type,
                })
                .select()
                .single();

            if (error) {
                console.error("Supabase Database Insert Error:", error);
                throw new Error(`Erro ao salvar no banco: ${error.message}`);
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents"] });
        },
    });
};
