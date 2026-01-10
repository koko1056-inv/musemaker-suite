-- Create spreadsheet_integrations table for Google Sheets integration
CREATE TABLE public.spreadsheet_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  spreadsheet_id TEXT,
  sheet_name TEXT DEFAULT 'Sheet1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_authorized BOOLEAN NOT NULL DEFAULT false,
  google_access_token TEXT,
  google_refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  export_on_call_end BOOLEAN NOT NULL DEFAULT true,
  export_on_call_failed BOOLEAN NOT NULL DEFAULT false,
  include_transcript BOOLEAN NOT NULL DEFAULT false,
  include_summary BOOLEAN NOT NULL DEFAULT true,
  include_extracted_data BOOLEAN NOT NULL DEFAULT true,
  agent_ids TEXT[] DEFAULT NULL,
  column_mapping JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.spreadsheet_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for spreadsheet_integrations
CREATE POLICY "Users can view spreadsheet integrations in their workspace"
ON public.spreadsheet_integrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = spreadsheet_integrations.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage spreadsheet integrations"
ON public.spreadsheet_integrations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = spreadsheet_integrations.workspace_id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.role IN ('owner', 'admin')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_spreadsheet_integrations_updated_at
BEFORE UPDATE ON public.spreadsheet_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();