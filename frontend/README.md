# Seat Selection Frontend

React and TypeScript application for browsing venue seating, finding recommended seats, managing venues, and booking seats. It uses Vite for development/build, Tailwind CSS for styling, and Vitest with React Testing Library for tests.

## Run Locally

Prerequisites: Node.js 20.19+ or 22.12+, and the backend/PostgreSQL services running. Follow the [backend setup guide](../backend/README.md) first; it covers Docker PostgreSQL, environment configuration, Prisma Client generation, migrations, and sample data.

From `frontend/`, install dependencies and start Vite:

macOS/Linux:
```bash
npm ci
cp .env.example .env
npm run dev
```

Windows PowerShell:
```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Windows Command Prompt:
```bat
npm ci
copy .env.example .env
npm run dev
```

Vite serves the frontend at `http://localhost:5173`. Set `VITE_API_URL` in `.env` if the API is not at `http://localhost:4000`.

## Tests and Build

```bash
npm test -- --run
npm run build
npm run lint
```

## Component Structure

`src/App.tsx` owns the shared page state, API calls, and user workflows. Page sections are split into `src/Components/`:

| Component | Responsibility |
|---|---|
| `Header` | Page heading and Manage Venues action |
| `ManageVenue` | Add/delete venue interface and local form input state |
| `VenueControls` | Venue and party-size controls; composes `FindBestSeats` |
| `FindBestSeats` | Trigger for deterministic seat recommendations |
| `AskAI` | Natural-language seat request input |
| `VenueFloorSeating` | Stage, seat map, availability states, and recommendation highlights |
| `BookSeats` | Recommendation summary, status messages, and booking action |
| `types.ts` | Shared venue and seat types |

## State and Data Flow

The page uses React's built-in `useState`, `useEffect`, and `useMemo` hooks. Shared state such as the venue list, selected venue, party size, recommended seats, and request status stays in `App.tsx`; child components receive values and callbacks through props. `ManageVenue` owns its temporary form fields and reports submitted values to `App`.

Effects load the venue list and selected venue's seat map. User actions call the backend APIs; recommendation results are passed to `VenueFloorSeating` and `BookSeats`. The AI assistant only interprets the natural-language request; the backend's deterministic algorithm selects seats, and booking remains a separate explicit action.

TanStack Query and Zustand are present in the package dependencies but are not currently used for application state or data fetching.

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
