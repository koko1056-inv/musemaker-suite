-- Add summary column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN summary text,
ADD COLUMN key_points jsonb DEFAULT '[]'::jsonb;