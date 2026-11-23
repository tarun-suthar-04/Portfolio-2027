# Tarun Suthar Portfolio

A React portfolio with separate technical and creative experiences, a browsable media gallery, and a Firebase-backed admin panel.

## Features

- **Landing** (`#`): interactive split-screen entry to the technical or creative portfolio.
- **Technical portfolio** (`#tech`): profile, skills, project list, project case studies, printable resume, and contact form.
- **Creative portfolio** (`#creative`): studio-grid introduction, manifesto, selected work, process, toolkit, social links, and contact form.
- **Gallery** (`#gallery`): category filters, draggable and scrolling media rows, image/video lightbox, and prompt-copy controls when prompt text exists.
- **Admin** (`#admin`): overview, technical projects, creative works, inquiries, profile and links, and security/access management. Open from a portfolio admin link or press `Ctrl/Cmd+Shift+A`.

The Technical Selected Projects section shows a live project count and ruled project rows. On desktop, hovering an enabled row reveals three project-specific preview panels and a yellow folder-style pointer badge; selecting its title opens the case study. Disabled and coming-soon projects remain non-interactive.

Project details use `#tech/project/<project-id>`. Search parameter alternatives include `?view=tech`, `?view=creative`, `?view=gallery`, and `?view=admin`.

## Tech stack

- React 19, TypeScript, and Vite 8
- Tailwind CSS 4 and custom CSS for layout, motion, and view styling
- Firebase Authentication and Cloud Firestore
- Lucide React icons and Motion for selected transitions
- Node's built-in test runner with `tsx`

## Local development

```sh
npm install
npm run dev
```

Vite serves the site on port `3000`. Use the URL printed by Vite; Firebase Authentication requires the hostname (without scheme or port) to be listed in the Firebase project's **Authentication → Settings → Authorized domains**. For local development, authorize the hostname you use, such as `localhost` or `127.0.0.1`.

## Checks

```sh
npm run lint       # TypeScript check (tsc --noEmit)
npm run build      # Production build into dist/
npx --yes tsx --test src/lib/splitPhysics.test.ts
```

The repository does not currently define an `npm test` script. Additional tests are in `src/lib/*.test.ts` and `firestore.rules.test.ts`.

## Firebase setup and deployment

The web configuration is read from `firebase-applet-config.json`. It identifies project `future-layout-791ww` and a named Firestore database. `.firebaserc` selects that project as the Firebase CLI default. `firebase.json` maps `firestore.rules` to the named database and serves the Vite `dist/` directory through Firebase Hosting with an SPA rewrite.

Before using Google sign-in, enable the Google provider in Firebase Authentication and authorize the local or deployed hostname under **Authentication → Settings → Authorized domains**. Add hostnames only (for example `127.0.0.1`), not `http://` or a port.

After signing in to Firebase CLI with an account that can manage this project:

```sh
npm run build
npx --yes firebase-tools@latest deploy --only firestore:rules,hosting
```

Deploying these files does not configure Firebase Authentication's authorized-domain list. Manage that setting in the Firebase Console or an authenticated Firebase/Identity Platform configuration workflow.

## Source layout

```text
src/
  App.tsx                     View routing and page composition
  context/PortfolioDataContext.tsx
                              Static fallback data, live profile/project/work data, and auth role state
  data/portfolio.ts           Portfolio profile, technical content, creative work and toolkit data
  data/workFolderWorks.ts     Metadata for bundled media in public/work/
  data/gallery.ts             Gallery category normalization and display mapping
  components/                 Public views, project details, gallery, and admin panel
  components/admin/           Admin feature tabs
  lib/                        Firebase, validation, uploads, routing/physics, and pure helpers
firestore.rules               Firestore authorization and document validation
firebase.json                 Firestore database and Firebase Hosting configuration
firebase-applet-config.json  Firebase web app configuration
```

## Interaction

- On the landing page, click a side or drag the split handle; keyboard arrows and touch gestures are supported.
- Technical and creative views scroll independently. Scrolling at either edge stays in that view; use its Landing navigation control (or Escape) to return, and the persona control to switch views.
- Gallery rows drift automatically and support pointer drag, touch swipe, and wheel input. Select a work to open its lightbox.
- Project details, gallery, and admin views can be opened directly with their URL hashes.
