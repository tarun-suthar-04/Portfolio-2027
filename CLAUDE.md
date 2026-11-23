# Contributor guide

## Project commands

- `npm run dev` starts Vite on port 3000.
- `npm run lint` runs the TypeScript compiler in check-only mode (`tsc --noEmit`).
- `npm run build` creates the production site in `dist/`.
- Focused unit tests can be run with `npx --yes tsx --test src/lib/<name>.test.ts`. There is no `npm test` script in `package.json`.

The app uses React 19, TypeScript, Vite 8, Tailwind CSS 4, Firebase Auth/Firestore, Motion, and Lucide React.

## Code organization

- Keep portfolio profile, technical projects, skills, creative work, process, and toolkit content in `src/data/portfolio.ts` unless it has a dedicated data module.
- Keep pure calculations, data normalization, routing, and validation helpers in `src/lib/`; add or update a nearby `*.test.ts` when changing tested pure logic.
- `src/context/PortfolioDataContext.tsx` owns live profile/project/work data and auth-role state. `src/App.tsx` owns view and project routing.
- Keep admin feature UI in `src/components/admin/` and shared admin loading, subscriptions, and navigation in `src/components/AdminPanel.tsx`.

## UI and interaction conventions

- Preserve the deliberate distinction between the ruled-paper Technical view, the light-grid/dark-panel Creative view, the charcoal media Gallery, and the utilitarian Admin dashboard.
- Avoid React state updates on every pointer move for high-frequency visuals; use refs and CSS custom properties where the existing interaction pattern does so.
- Keep views keyboard reachable and use native buttons/links with accessible names. Inactive top-level layers use `inert`.
- Respect reduced-motion preferences for animated effects and input-driven movement.
- Technical and Creative views scroll independently; do not use edge overscroll to navigate between views. Keep Landing/persona changes on explicit navigation controls, with Escape as the keyboard return shortcut.
- In Technical Selected Projects, preserve the existing `ProjectItem` source and case-study route. Keep desktop hover-only previews and the pointer badge scoped to that section; do not add a separate case-study button or always-visible preview cards to rows.
- Don't add public actions that lead to dead links or inert controls. Development-only missing-media placeholders are intentional fallback behavior.

## Data and security boundaries

- Treat `firestore.rules` as the server-side access control. Keep any corresponding client-side validation in `src/lib/adminValidation.ts` aligned, but do not rely on client validation for security.
- Never add a client-side service-account credential or secret. The browser Firebase config is public configuration; Firebase rules and project settings provide access control.
- The three bootstrap administrator emails are duplicated between the client check and Firestore rules. When changing them, update both files and their tests together.
- Keep profile contact email use consistent across profile data and forms.
- Creative image uploads accept JPEG, PNG, WebP, or GIF up to 10 MB before compression; image data is compressed in the browser and written to Firestore within the rule-enforced field limit. Video assets are currently referenced by URL/path; this repo does not configure Cloud Storage.
- Firebase Authentication authorized domains and Google provider configuration live in Firebase project settings; they are not changed by the Firestore rules deployment.

## Before proposing a release

Run `npm run lint` and `npm run build` when verification is requested or needed for the change. Run relevant focused tests for changed helper logic. If the change affects Firestore access, review the rule tests and ensure the deployed rules correspond to `firestore.rules`. Check the responsive layouts and reduced-motion behavior for UI changes.
