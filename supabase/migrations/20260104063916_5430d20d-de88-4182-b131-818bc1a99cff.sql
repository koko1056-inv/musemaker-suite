-- Add ElevenLabs document ID column to knowledge_items
ALTER TABLE public.knowledge_items
ADD COLUMN elevenlabs_document_id text;

-- Add index for faster lookups
CREATE INDEX idx_knowledge_items_elevenlabs_doc_id ON public.knowledge_items(elevenlabs_document_id) WHERE elevenlabs_document_id IS NOT NULL;