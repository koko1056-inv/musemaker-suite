-- Add elevenlabs_agent_id column to agents table
ALTER TABLE public.agents ADD COLUMN elevenlabs_agent_id TEXT;

-- Add system_prompt column for agent prompt configuration
ALTER TABLE public.agents ADD COLUMN system_prompt TEXT;