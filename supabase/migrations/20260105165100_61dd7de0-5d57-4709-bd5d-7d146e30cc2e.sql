-- Add VAD settings to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS vad_mode text DEFAULT 'server_vad',
ADD COLUMN IF NOT EXISTS vad_threshold numeric DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS vad_silence_duration_ms integer DEFAULT 500,
ADD COLUMN IF NOT EXISTS vad_prefix_padding_ms integer DEFAULT 300;

-- Add comment for the columns
COMMENT ON COLUMN public.agents.vad_mode IS 'Voice Activity Detection mode: server_vad or manual';
COMMENT ON COLUMN public.agents.vad_threshold IS 'VAD sensitivity threshold (0-1). Higher values reduce noise pickup';
COMMENT ON COLUMN public.agents.vad_silence_duration_ms IS 'Duration of silence before end of speech is detected';
COMMENT ON COLUMN public.agents.vad_prefix_padding_ms IS 'Padding before detected speech starts';