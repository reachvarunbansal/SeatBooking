---
name: frontend-booking
description: Use when changing or debugging the React seat-booking UI, venue management, seat map, booking confirmation, AI prompt interaction, or frontend tests in this repository.
---

# Frontend Seat Booking

## Component Structure

The frontend is React + TypeScript. `frontend/src/App.tsx` owns shared application state, API requests, and workflows. Page components live in `frontend/src/Components/`:

- `Header.tsx`: page heading and venue-management action.
- `ManageVenue.tsx`: add/delete UI and local form fields; reports actions to `App` through callbacks.
- `VenueControls.tsx`: selected venue and party-size controls; composes `FindBestSeats.tsx`.
- `FindBestSeats.tsx`: recommendation action button.
- `AskAI.tsx`: natural-language request input and loading state display.
- `VenueFloorSeating.tsx`: stage, rows, seat status, and recommended-seat highlights.
- `BookSeats.tsx`: recommended-seat summary, status, and booking action.
- `types.ts`: shared seat and venue types.

Keep shared state in `App` and pass values/callbacks through props unless a state is genuinely local to a component. Avoid adding a state library for page-local state without a concrete need.

## Styling

- Component-specific styles are in `frontend/src/Components/components.css`; global page/background styles are in `frontend/src/index.css`.
- Prefer semantic class names from the component stylesheet over long Tailwind utility strings or React `style` props.
- Preserve seat status and recommendation classes (`seat-available`, `seat-recommended`, `seat-reserved`, `seat-booked`) and their accessible labels when changing the seat map.
- Keep row labels outside the seat layout flow so each row stays centered under the stage.

## Data and Booking Flow

- Use the shared `requestJson` helper in `App.tsx` for API requests. It preserves JSON headers and parses API errors.
- Best-seat requests use the backend's deterministic algorithm; AI only interprets the natural-language input.
- Book using database seat IDs, but display human-readable labels such as `A5`.
- Refresh the seat map after booking or venue changes so persisted state is visible.
- Keep venue management authorization token in component state only; do not persist it to local storage or log it.

## Tests and Validation

Update `frontend/src/test/App.test.tsx` when changing key user flows or accessible text. Prefer assertions on user-visible behavior and semantic classes, not obsolete Tailwind implementation details.

From `frontend/` run:

```bash
npm test -- --run
npm run build
```
