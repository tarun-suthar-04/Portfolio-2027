# Firestore security model

This document summarizes the rules currently implemented in `firestore.rules`. The deployed Firebase project can differ until these rules are deployed. Client-side validation in `src/lib/adminValidation.ts` improves form feedback; Firestore rules remain the authorization and schema boundary.

## Global behavior and identities

- Rules use Firestore Rules version 2 and deny all reads and writes on unmatched paths.
- A verified user must have a Firebase Auth token with `email_verified == true` for privileged actions.
- Bootstrap Super Admin access is granted to `ahirwalshiwani9@gmail.com`, `cdstarun2004@gmail.com`, and `cdstarun1837@gmail.com` in both `src/lib/adminValidation.ts` and `firestore.rules`.
- Other admins are resolved from `/admins/{uid}` and must have an active record with role `admin` or `super_admin`. A registered `super_admin` can manage the roster; bootstrap admins are treated as super admins.
- Email verification is required for admin recognition. Admin role is not granted by the email address alone when the Firebase token is unverified.

## Collection access

| Path | Reads | Writes |
| --- | --- | --- |
| `/site_config/profile` | Public single-document read; collection listing denied | Admin create/update with validated profile fields; delete denied |
| `/projects/{id}` | Published items are public; an admin can get a draft. Bootstrap admins can list all drafts; a verified user can list documents they authored (`updatedBy` matches their UID). A non-bootstrap registered admin cannot list another admin's drafts. | Admin create/update/delete with validated project fields and timestamp/author checks |
| `/creative_works/{id}` | Published items are public; an admin can get a draft. Bootstrap admins can list all drafts; a verified user can list documents they authored (`updatedBy` matches their UID). A non-bootstrap registered admin cannot list another admin's drafts. | Admin create/update/delete with validated creative-work fields and timestamp/author checks |
| `/admins/{uid}` | A verified user may read their own record; admins may read a record; list is available to bootstrap admins or through the caller's own-UID query | Super Admin create/update; Super Admin may delete another admin but not their own record. A user cannot deactivate or downgrade their own Super Admin record. |
| `/audit_logs/{id}` | Admin get; bootstrap admins can list all, other admins can list their own actor records | Admin create only; update and delete are denied |
| `/project_inquiries/{id}` | Admin get; **list is restricted to bootstrap admins** | Public create with strict shape/size checks and initial `new` status; admins can change only status or delete |

Firestore queries must be constrained so every possible result satisfies the relevant `list` rule. The client admin panel loads inquiry lists only for bootstrap admins, matching the current inquiry-list rule.

## Validation and invariants

Rules validate document keys and types, bounded strings/lists, safe document IDs, timestamp fields, and entity-specific URL/image values. Project and creative-work writes bind `updatedBy` to the signed-in UID; creates and updates use server request time for their timestamps. Admin records and audit entries bind actor/UID fields to Auth identity. Exact limits and accepted values are defined in `firestore.rules` and should be changed there deliberately.

Creative image data is limited to WebP, JPEG, or PNG data URLs under the configured size cap; SVG and HTML data URLs are rejected. Local media paths and video URLs are constrained by the rule helpers. The client upload helper is in `src/lib/imageUpload.ts`.

Audit records are append-only at the rules layer. The client writes them best-effort through `recordAuditLog`; an audit event should not be treated as guaranteed if that write fails.

## Operational notes

- Firestore rules are deployed from the repository's `firestore.rules` mapping in `firebase.json`; the configured named database must match the Firebase project.
- Firebase Authentication provider enablement and authorized domains are separate project settings. Deploying Firestore rules or Hosting does not authorize a browser hostname for Google sign-in.
- Rule tests are in `firestore.rules.test.ts`; helper validation tests are in `src/lib/adminValidation.test.ts`. This document does not claim those tests have been run against the current Firebase deployment.
