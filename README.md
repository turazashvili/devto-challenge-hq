# Dev Challenge Tracker

*This is a submission for the [KendoReact Free Components Challenge](https://dev.to/challenges/kendoreact-2025-09-10).*

**Dev Challenge Tracker** is a local-first, one-tab HQ for shipping stellar DEV challenge submissions. Plan challenges, capture tasks and ideas, store research links, and draft publish-ready Markdown: all without leaving the browser or giving up control of your data. The workspace leans on an AI copiloting loop: a KendoReact Chat-driven assistant orchestrates planning steps, executes functions (e.g., structured drafting, tool calls, Nuclia enrichment), and reflects on results so you keep momentum while the agent handles the tedious parts.

## Why It Hits the Brief

- **Build without boundaries** – paste a challenge link and the app shapes it into a living brief with Markdown everywhere.
- **Local-first by design** – everything stays in the browser; no sign-ups, no sync service, no hidden database.
- **AI when you want it** – drop in a single OpenRouter key to unlock an AI copilot that understands your plan and returns Markdown replies.
- **Agentic workflow** – the assistant plans next steps, triggers function executors, and syncs research via Nuclia so progress compounds automatically.
- **One workspace, multiple submissions** – optimized to help creators juggle several DEV challenges in parallel without losing momentum.

## Features

### Core Functionality
- **Dashboard overview** – quick stats, momentum tracking, and upcoming milestone highlights.
- **Challenge pipeline** – update statuses inline, see automatic progress bars, and keep descriptions and tags close at hand.
- **Challenge detail view** – open any challenge to see every linked idea, task, and resource in a single workspace with inline capture.
- **Inline editing** – update challenge details, tasks, ideas, and resources without leaving their context.
- **Task execution tracker** – filterable status dropdowns with due dates to make editing and publishing sprints visible.
- **Idea lab & resource vault** – capture sparks, inspiration, and useful links with custom tags.
- **One-click capture** – App Bar shortcuts open KendoReact dialog forms for logging challenges, ideas, tasks, and resources from anywhere in the app.

### AI & Search Integration
- **AI Chat Assistant** – KendoReact Chat-powered copilot that understands your project context and executes planning functions
- **Nuclia RAG Search** – Live search in the AppBar with intelligent document retrieval and Q&A
- **Automatic Knowledge Sync** – Resources and entities automatically sync to Nuclia for enhanced searchability
- **Markdown Everywhere** – AI responses and content rendering optimized for copy-paste-ready DEV posts

### UX Highlights
- Single AppBar with contextual actions and Nuclia search toggle
- Rounded "panel" cards for Challenges, Ideas, Resources, and Tasks
- Dialog flows built with KendoReact inputs for consistent spacing and accessibility
- AI chat bubble with Markdown rendering, typing indicator, and responsive sizing

## Demo

- **Live app**: [Deployed on Vercel](https://devtohq.vercel.app/)
- **Repository**: https://github.com/turazashvili/devto-challenge-hq

## Getting Started

### Prerequisites

You'll need API keys for the full experience:

1. **OpenRouter API Key** (for AI features)
   - Sign up at [OpenRouter](https://openrouter.ai)
   - Get your API key from the dashboard
   - Add it in the AI Settings dialog in the app

2. **Nuclia API Key** (for RAG search features)
   - Sign up at [Nuclia](https://nuclia.com)
   - Create a Knowledge Box
   - Get your API key and Knowledge Box ID
   - Add them in the RAG Settings dialog in the app

### Installation

```bash
# Clone the repository
git clone https://github.com/turazashvili/devto-challenge-hq
cd dev-challenge-tracker

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using the workspace.

### Using KendoReact Locally

The project uses KendoReact free components plus some trial components. For production usage, you'll need a Telerik license:

[Guide](https://www.telerik.com/kendo-react-ui/components/my-license)

Without a key you may see console warnings, but the demo still runs for local exploration.

## Tech Stack

- **Framework**: [Next.js 15 App Router](https://nextjs.org/) with TypeScript
- **UI Components**: [KendoReact](https://www.telerik.com/kendo-react-ui/)
- **Styling**: Tailwind CSS + KendoReact default theme
- **AI Integration**: OpenRouter API with multiple model support
- **Search & RAG**: Nuclia Knowledge Box integration
- **Storage**: Local storage persistence for zero-backend experience

## KendoReact Components Used

### Free Components (11 required for challenge)
- **Layout**: AppBar, AppBarSection, AppBarSpacer
- **Buttons**: Button, ButtonGroup
- **Dropdowns**: DropDownList, MultiSelect
- **Date Inputs**: DatePicker
- **Inputs**: Input, TextArea
- **Labels**: Label
- **Dialogs**: Dialog, DialogActionsBar
- **Progress**: ProgressBar

### Trial/Premium Components
- **Conversational UI**: Chat (for AI assistant)
- **Data Grid**: Grid, GridColumn (for data tables)



## Data Model

| Entity     | Key Fields                                             |
|------------|--------------------------------------------------------|
| Challenge  | `title`, `theme`, `status`, optional `deadline`, `tags`|
| Task       | `challengeId` (optional), `status`, optional `dueDate` |
| Idea       | `challengeId` (optional), `impact`, `tags`             |
| Resource   | `url`, `type`, optional `challengeId`, `tags`          |

Data is stored in browser localStorage under `dev-challenge-tracker-state`. Clearing site data resets to sample content.

## Architecture Highlights

- **Local Storage Persistence** with dedicated Tracker context for all entities
- **Dialog-driven CRUD flows** wired to Nuclia helpers for knowledge base sync
- **Markdown rendering everywhere** for copy-paste-ready DEV posts
- **AI agent pipeline** (Chat + functionExecutor + Nuclia ingestion) with plan → act → learn cycles
- **Responsive AppBar** with Nuclia search slot, settings gear, and quick-action ButtonGroup
- **AI chat bubble** sized to available viewport with custom message templates

## Customization

- **Update starter content**: `src/data/defaultState.ts`
- **Tune styles**: `src/app/globals.css` (Tailwind + KendoReact theme)
- **Extend state logic**: `src/lib/useTrackerData.ts`
- **Modify AI behavior**: `src/services/aiService.ts`
- **Configure Nuclia sync**: `src/lib/nucliaClient.ts`

## Development

```bash
# Development server
pnpm run dev

# Production build
pnpm run build

# Start production server
pnpm run start

# Linting
pnpm run lint
```

## API Integration

### OpenRouter (AI Features)
The app supports multiple AI models through OpenRouter. Configure in AI Settings:
- API Key from OpenRouter dashboard
- Model selection (GPT-4, Claude, Gemini, etc.)
- Custom base URL if needed

### Nuclia (RAG Search)
Nuclia integration provides intelligent search and document retrieval:
- Knowledge Box ID and API key
- Zone and account configuration
- Automatic resource ingestion pipeline
- Real-time search in AppBar

## Why It Matters

DEV challenges move fast. Dev Challenge Tracker gives creators a single place to brainstorm, plan, execute, and polish—without waiting on backend infrastructure or losing track of progress. The KendoReact free suite handled the UI heavy lifting so we could focus on flow, accessibility, and delight.

## License

This project is open source and available under the [MIT License](LICENSE).