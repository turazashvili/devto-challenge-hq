# DEV Challenge Companion

A modern Next.js workspace to plan, track, and ship submissions for [DEV.to](https://dev.to/) challenges. It runs entirely in the browser using local storage, so you can brainstorm, prioritise, and manage tasks without creating an account or wiring up a backend.

## Features

- **Dashboard overview** – quick stats, momentum tracking, and upcoming milestone highlights.
- **Challenge pipeline** – update statuses inline, see automatic progress bars, and keep descriptions and tags close at hand.
- **Challenge detail view** – open any challenge to see every linked idea, task, and resource in a single monochrome workspace with inline capture.
- **Inline editing** – update challenge details, tasks, ideas, and resources without leaving their context.
- **Task execution tracker** – filterable status dropdowns with due dates to make editing and publishing sprints visible.
- **Idea lab & resource vault** – capture sparks, inspiration, and useful links with custom tags.
- **One-click capture** – App Bar shortcuts open KendoReact dialog forms for logging challenges, ideas, tasks, and resources from anywhere in the app.

## Tech stack

- [Next.js 15 App Router](https://nextjs.org/) with TypeScript and Tailwind CSS
- [KendoReact](https://www.telerik.com/kendo-react-ui/) components (AppBar, Grid, Dialogs, Inputs, Dropdowns, ProgressBar)
- Local storage persistence (`window.localStorage`) for a zero-backend experience

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using the workspace. Data is stored in your browser under the key `dev-challenge-tracker-state`. Clearing site data or switching browsers will reset the workspace to the starter sample content.

- Dashboard view: `/`
- Focused challenge view: `/challenges/<challenge-id>`

### Using KendoReact locally

The project pulls in KendoReact packages from npm. Telerik requires a license key for production usage. If you are evaluating the library, request a trial key and export it as `KENDO_UI_LICENSE` before running `npm run dev`:

```bash
export KENDO_UI_LICENSE="{your-license-key}"
```

Without a key you may see console warnings when the development server boots, but the demo still runs for local exploration.

## Data model cheatsheet

| Entity     | Key fields                                             |
|------------|--------------------------------------------------------|
| Challenge  | `title`, `theme`, `status`, optional `deadline`, `tags`|
| Task       | `challengeId` (optional), `status`, optional `dueDate` |
| Idea       | `challengeId` (optional), `impact`, `tags`             |
| Resource   | `url`, `type`, optional `challengeId`, `tags`          |

Entries are timestamp-free and designed for quick capture. Challenge status automatically updates the progress bar using a simple percentage mapping.

## Customisation tips

- Update starter content in `src/data/defaultState.ts`.
- Tune styles in `src/app/globals.css`; the UI layers use Tailwind utility classes plus the default Kendo theme.
- Extend state logic or persistence strategies in `src/lib/useTrackerData.ts` if you later want to sync to a backend.

## Linting

```bash
npm run lint
```

The script runs ESLint with the default Next.js configuration.
