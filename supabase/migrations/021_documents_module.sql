-- Create documents table
create table if not exists public.documents (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default timezone('utc'::text, now()),
    user_id uuid not null default auth.uid(),
    household_id uuid not null,
    title text not null,
    description text,
    file_path text not null,
    file_type text not null,
    category text not null check (category in ('bill', 'manual', 'contract', 'identity', 'other')),
    keywords text[],
    expiry_date date,
    is_private boolean not null default false,
    
    constraint documents_pkey primary key (id),
    constraint documents_user_id_fkey foreign key (user_id) references auth.users(id),
    constraint documents_household_id_fkey foreign key (household_id) references public.households(id)
);

-- Enable RLS
alter table public.documents enable row level security;

-- Policies for documents table

-- View policy: 
-- 1. Users can see their own documents.
-- 2. Users can see documents in their household that are NOT private.
create policy "Users can view their own documents or shared household documents"
on public.documents for select
using (
    (user_id = auth.uid())
    OR
    (
        household_id in (select household_id from public.profiles where id = auth.uid())
        AND
        is_private = false
    )
);

-- Insert policy: Users can upload documents to their households
create policy "Users can insert documents"
on public.documents for insert
with check (
    auth.uid() = user_id
    AND
    household_id in (select household_id from public.profiles where id = auth.uid())
);

-- Update policy: Only the owner can update
create policy "Users can update their own documents"
on public.documents for update
using (user_id = auth.uid());

-- Delete policy: Only the owner can delete
create policy "Users can delete their own documents"
on public.documents for delete
using (user_id = auth.uid());


-- Storage Bucket Setup
-- We insert into storage.buckets if it doesn't exist.
-- Note: Supabase storage schemas can vary, but usually this is how it's done via SQL if extension is enabled.
-- If storage schema is not accessible, this part might fail, but usually 'storage' schema is available.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Storage RLS Policies
-- Helper policy to allow viewing files
create policy "Give access to own or shared files"
on storage.objects for select
using (
    bucket_id = 'documents' 
    AND
    (
        -- Is owner of the file (storage.objects.owner is auth.uid)
        (auth.uid() = owner)
        OR
        -- OR matches a document record that the user can see
        (exists (
            select 1 from public.documents 
            where file_path = storage.objects.name
            and (
                (user_id = auth.uid()) OR
                (household_id in (select household_id from public.profiles where id = auth.uid()) AND is_private = false)
            )
        ))
    )
);

create policy "Allow uploads"
on storage.objects for insert
with check (
    bucket_id = 'documents'
    AND
    auth.uid() = owner
);

create policy "Allow updates"
on storage.objects for update
using (
    bucket_id = 'documents'
    AND
    auth.uid() = owner
);

create policy "Allow deletes"
on storage.objects for delete
using (
    bucket_id = 'documents'
    AND
    auth.uid() = owner
);
