# Copilot Instructions for vaxsupport-frontend

## Project Overview
- This is a Next.js 15 web application using Turbopack, TypeScript, and Tailwind CSS.
- The app is structured with the `/app` directory for routes and pages, and `/components` for reusable UI elements.
- State management is mostly local (React hooks), with some context usage (see `context/user-context.tsx`).
- API communication is via Axios (`utils/axiosInstance.ts`), with endpoints like `/chat/conversation` and `/chat/message`.

## Key Patterns & Conventions
- **Routing:** Uses Next.js App Router. Locale-based routing is implemented under `app/[locale]/`.
- **UI Components:** Custom components are in `/components`, often wrapping or extending `@heroui/*` UI library elements.
- **Chat Feature:** The chat page (`app/[locale]/chat/page.tsx`) streams messages using SSE (Server-Sent Events) and manages conversations in categorized buckets (today, last 7 days, older).
- **Modals & Alerts:** Uses `@heroui/modal` and `@heroui/alert` for dialogs and notifications.
- **Internationalization:** Uses `next-intl` and custom hooks (`useTranslations`).
- **Assets:** Images and animations are in `/assets`.
- **Types:** Shared types are in `/types`.
- **Config:** Site and font configuration in `/config`.

## Developer Workflows
- **Start Dev Server:** `npm run dev` (Next.js with Turbopack)
- **Install Dependencies:** `npm install` (watch for peer dependency warnings with `@heroui/*` packages)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (if configured)
- **Test:** No test scripts or test files detected.
- **Debugging:** Check console output for SSE errors and API failures. Most errors are surfaced in the browser or terminal.

## Integration Points
- **External APIs:** All backend communication is via Axios to REST endpoints (see `axiosInstance.ts`).
- **UI Library:** Heavy use of `@heroui/*` components. Version mismatches can cause runtime errors—keep all `@heroui/*` packages in sync.
- **Icons:** Uses `@heroicons/react` for SVG icons.

## Project-Specific Advice
- When updating or adding chat features, follow the SSE streaming pattern in `chat/page.tsx`.
- For new UI, prefer extending existing components in `/components` and use the `@heroui/*` library for consistency.
- Locale and i18n logic is centralized in `i18n/`.
- If you encounter dependency errors, update all `@heroui/*` packages together.
- No backend code is present—API endpoints are assumed to be external.

## Example: Adding a Chat Message
- Use `axiosInstance.post('/chat/message', { ... })` for sending messages.
- Stream bot responses using the SSE pattern in `sendMessage` (see `chat/page.tsx`).

---

_If any section is unclear or missing, please provide feedback to improve these instructions._
