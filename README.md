# MUSA - AI Voice Call Center Platform

ノーコードで音声AIエージェントを構築・管理するプラットフォーム。ElevenLabs連携によるリアルタイム音声対話、Twilio連携によるインバウンド/アウトバウンドコール、ビジュアルフロービルダーを搭載。

## Features

- **AIエージェント管理** - ElevenLabsと連携した音声AIエージェントの作成・設定
- **インバウンド/アウトバウンドコール** - Twilio連携による電話対応の自動化
- **リアルタイム分析** - 通話メトリクス、エージェントパフォーマンスのダッシュボード
- **ナレッジベース** - エージェントの知識を管理・同期
- **通知連携** - Slack、メール、Google Calendar、スプレッドシートへの自動連携
- **チーム管理** - ワークスペースベースの権限管理

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui (Radix UI) + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Edge Functions + Auth) |
| Voice AI | ElevenLabs Conversational AI |
| Telephony | Twilio Voice API |
| State | TanStack React Query |

## Getting Started

```sh
# Clone
git clone https://github.com/koko1056-inv/musemaker-suite.git
cd musemaker-suite

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase and API keys

# Start dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |

## Project Structure

```
src/
  components/     # React components
    agents/       # Agent management UI
    conversations/# Conversation views
    dashboard/    # Dashboard widgets
    flow/         # Visual flow builder
    layout/       # App layout (sidebar, nav)
    notifications/# Integration managers
    voice/        # Voice call panel
  contexts/       # React contexts (Auth)
  hooks/          # Custom hooks (data fetching)
  integrations/   # Supabase client & types
  lib/            # Utilities
  pages/          # Route pages
  types/          # Shared TypeScript types
supabase/
  functions/      # Edge Functions (28 functions)
  migrations/     # Database migrations
```

## Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## License

Private
