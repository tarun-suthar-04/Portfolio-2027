# Architecture

## Application map

This is a client-rendered React single-page app. `src/App.tsx` owns the active view, selected project, and gallery category; each view is mounted as a layer and made inert while inactive.

```text
PortfolioDataProvider
└── AppShell
    ├── LandingSplit
    ├── TechnicalView ── ProjectDetailPage
    ├── CreativeView
    ├── GalleryView
    └── AdminPanel
```

`ViewMode` is defined in `src/lib/splitPhysics.ts`: `land`, `tech`, `cre`, `gallery`, and `admin`. The canonical view hashes are `#tech`, `#creative`, `#gallery`, and `#admin`; an empty hash opens the landing view. Project details use `#tech/project/<id>`. Query parameters such as `?view=tech` are also parsed on initial load. `App.tsx` synchronizes the active view with browser history and supports `Ctrl/Cmd+Shift+A` for the admin view.

## Data flow

- `src/data/portfolio.ts` is the bundled source for the profile defaults, technical projects and skills, creative works, process steps, toolkit, and platform links.
- `src/data/workFolderWorks.ts` adds metadata for media bundled under `public/work/`.
- `src/data/gallery.ts` normalizes category values and maps creative work data into gallery items.
- `PortfolioDataContext` listens to `site_config/profile`, published `projects`, and published `creative_works`. When remote content is missing or empty, the public site falls back to bundled data. Remote creative works are combined with bundled items whose IDs are not already present remotely.
- The context also observes Firebase Auth and the current user's admin record, and exposes `isAdmin`, `isSuperAdmin`, and sign-in/sign-out actions.

## Interaction and rendering

`src/lib/splitPhysics.ts` contains pure helpers for clamping split progress, easing, pointer velocity, swipe outcomes, and URL view parsing. `LandingSplit` writes drag progress to the `--p` CSS custom property through a DOM ref so each pointer move does not require a React render. Technical and Creative views remain independent scroll containers; edge overscroll does not change the active view. Landing navigation is explicit, with Escape also returning to Landing.

The Technical Selected Projects section renders the existing project list with a dynamic count, ruled rows, scroll-active title highlighting, and fine-pointer desktop hover previews. The hover strip uses project-specific media frames; a yellow folder-style cursor badge follows the pointer. Project titles keep the existing case-study route, and disabled/coming-soon items remain unavailable. Project detail routing and case-study fallback generation are implemented in `src/lib/projectCaseStudy.ts`.

The Gallery uses horizontal media rows and a lightbox with image or video content. It supports category filtering, pointer/touch dragging, wheel input, keyboard navigation, and reduced-motion handling.

## Admin and Firebase

`AdminPanel` subscribes to admin-only collections only after Auth is ready and the user is recognized as an admin. Its feature tabs are overview, technical projects, creative works, inquiries, profile/links, and security/access. Mutations are issued from the browser with the Firebase client SDK; `firestore.rules` is the authoritative data-access boundary.

`src/lib/firebase.ts` initializes Firebase Auth and the configured named Firestore database. It also centralizes Firestore error reporting and best-effort client-side audit-log writes. Image uploads are resized/compressed in `src/lib/imageUpload.ts` and stored as bounded data URLs in creative-work records; this project does not currently configure Firebase Storage.

The Firebase project, database ID, and Hosting rewrite are configured by `firebase-applet-config.json`, `.firebaserc`, and `firebase.json`. Authentication authorized domains and Google-provider settings are managed in Firebase Authentication, not by deploying `firestore.rules` or Hosting.
