-- Create enum types
CREATE TYPE public.agent_status AS ENUM ('draft', 'published');
CREATE TYPE public.member_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE public.flow_node_type AS ENUM ('speak', 'ask', 'condition', 'webhook', 'end');
CREATE TYPE public.conversation_status AS ENUM ('completed', 'failed', 'in_progress');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  elevenlabs_api_key TEXT, -- Encrypted at rest by Supabase
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workspace members table (links users to workspaces with roles)
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Create agents table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status agent_status NOT NULL DEFAULT 'draft',
  voice_id TEXT NOT NULL DEFAULT 'rachel',
  voice_style TEXT DEFAULT 'conversational',
  voice_speed TEXT DEFAULT 'normal',
  welcome_timeout INTEGER DEFAULT 5,
  max_call_duration INTEGER DEFAULT 10,
  fallback_behavior TEXT DEFAULT 'transfer',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create flow_nodes table for agent conversation flows
CREATE TABLE public.flow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  node_type flow_node_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create conversations table for call logs
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  phone_number TEXT,
  status conversation_status NOT NULL DEFAULT 'in_progress',
  outcome TEXT,
  duration_seconds INTEGER DEFAULT 0,
  transcript JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flow_nodes_updated_at BEFORE UPDATE ON public.flow_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

-- Helper function to check if user is workspace admin or owner
CREATE OR REPLACE FUNCTION public.is_workspace_admin(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id 
    AND workspace_id = _workspace_id
    AND role IN ('admin', 'owner')
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for workspaces
CREATE POLICY "Users can view workspaces they belong to" ON public.workspaces
  FOR SELECT USING (public.is_workspace_member(auth.uid(), id));

CREATE POLICY "Admins can update their workspaces" ON public.workspaces
  FOR UPDATE USING (public.is_workspace_admin(auth.uid(), id));

CREATE POLICY "Authenticated users can create workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for workspace_members
CREATE POLICY "Users can view members of their workspaces" ON public.workspace_members
  FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can manage workspace members" ON public.workspace_members
  FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Users can add themselves when creating workspace" ON public.workspace_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for agents
CREATE POLICY "Users can view agents in their workspaces" ON public.agents
  FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create agents" ON public.agents
  FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update agents" ON public.agents
  FOR UPDATE USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete agents" ON public.agents
  FOR DELETE USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- RLS Policies for flow_nodes
CREATE POLICY "Users can view flow nodes of accessible agents" ON public.flow_nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_id AND public.is_workspace_member(auth.uid(), a.workspace_id)
    )
  );

CREATE POLICY "Members can manage flow nodes" ON public.flow_nodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_id AND public.is_workspace_member(auth.uid(), a.workspace_id)
    )
  );

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations of accessible agents" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_id AND public.is_workspace_member(auth.uid(), a.workspace_id)
    )
  );

CREATE POLICY "System can insert conversations" ON public.conversations
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX idx_agents_workspace ON public.agents(workspace_id);
CREATE INDEX idx_flow_nodes_agent ON public.flow_nodes(agent_id);
CREATE INDEX idx_conversations_agent ON public.conversations(agent_id);
CREATE INDEX idx_conversations_started ON public.conversations(started_at DESC);