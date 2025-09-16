*This is a submission for the [KendoReact Free Components Challenge](https://dev.to/challenges/kendoreact-2025-09-10).*

## What I Built

Dev Challenge Tracker — a local‑first, one‑tab companion for DEV challenges. It helps every DEV.to creator ideate fast, turn links into challenge drafts, break work into actionable tasks, capture ideas/resources, and submit with confidence.

Why it’s exciting:
- Build without boundaries: add a challenge, paste a link, and the app shapes it into a clean, Markdown‑ready brief.
- Local‑first mindset: your data lives in your browser. No accounts. No servers. Your data is yours.
- One API key, endless flow: plug in a single OpenRouter key if you want AI help. That’s it.
- Designed to multiply submissions: lighter workflows → more entries across DEV challenges.

UX touches:
- Beautiful, consistent Markdown everywhere (descriptions, notes, and AI replies)
- An AI chat bubble that speaks Markdown, with an animated “processing” indicator
- Compact controls, smart wrapping, and smaller sub‑headings for ideas/tasks/resources

## Demo

- Live app: YOUR_URL_HERE
- Repository: https://github.com/YOUR_ORG_OR_USER/dev-challenge-tracker

Screenshots or short clip recommended here.

## KendoReact Components Used

The app uses well over 10 KendoReact components. Counting only components that are part of the free set, we used:

- AppBar, AppBarSection, AppBarSpacer (`@progress/kendo-react-layout`)
- Button, ButtonGroup (`@progress/kendo-react-buttons`)
- Input, TextArea, Label (`@progress/kendo-react-inputs`, `@progress/kendo-react-labels`)
- DropDownList, MultiSelect (`@progress/kendo-react-dropdowns`)
- DatePicker (`@progress/kendo-react-dateinputs`)
- Dialog, DialogActionsBar (`@progress/kendo-react-dialogs`)
- ProgressBar (`@progress/kendo-react-progressbars`)

Additionally (not counted toward the 10 free components):
- Conversational UI – Chat (`@progress/kendo-react-conversational-ui`) for the AI assistant

## [Optional: Code Smarter, Not Harder prize category] AI Coding Assistant Usage

We used the KendoReact MCP Server (“kendo-react-assistant”) throughout development from our IDE console. It served as our AI Coding Assistant by:
- Answering questions about KendoReact components/APIs with proprietary context
- Generating tailored snippets (e.g., Dialog/DropDownList grids, input forms) we dropped into the app
- Unblocking UI wiring and config quickly (e.g., Chat props, uploadConfig, filtering)

Setup notes: configured the MCP server via `mcp.json` and authenticated with our Telerik license, then invoked it using the `#kendo-react-assistant` handle during daily work.

## [Optional: RAGs to Riches prize category] Nuclia Integration

No Nuclia integration included. If we add it, we’ll document the setup and what the RAG agent powers in the UI.

---

### What’s Inside (High‑Level)

- Local‑first data model; everything persists in your browser
- Challenge/Task/Idea/Resource management with friendly dialogs and inputs
- Markdown‑first rendering and AI replies for readable content
- Model picker with search; instant settings apply to the chat
- Chat UX polish (inline typing indicator, wide/padded user bubbles, no attachments)

### Why It Matters

We built a universal helper for DEV challenges. It removes friction, keeps ownership local, and turns ideas into submissions—fast. Add a link, shape a plan, and ship.


