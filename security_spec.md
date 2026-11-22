# Security Specification — Portfolio Admin Panel

## 1. Data & Access Invariants
1. **Default Deny**: Every unmatched Firestore path is denied (`allow read, write: if false`).
2. **Verified Admin Gate**: Every privileged write and private read requires `request.auth != null`, `request.auth.token.email_verified == true`, and either a bootstrapped super-admin identity (`ahirwalshiwani9@gmail.com`, `cdstarun2004@gmail.com`, `cdstarun1837@gmail.com`) or an active document in `/admins/{request.auth.uid}` (`active == true`).
3. **Zero Self-Escalation**: Non-admin authenticated users can NEVER create, update, or delete documents in `/admins/{adminUid}` or inject `role: "super_admin"`.
4. **Immutable Append-Only Audit Logs**: `/audit_logs/{logId}` can only be created by verified admins (`actorUid == request.auth.uid` and `createdAt == request.time`), and can NEVER be updated or deleted (`allow update, delete: if false`).
5. **Strict Schema & No Shadow Fields**: Every `create` verifies `keys().hasAll(...)` and `keys().hasOnly(...)`; every `update` verifies `isValid[Entity](incoming())` first, preserves immutable fields (`createdAt`, `uid`), enforces `updatedAt == request.time`, and restricts modified keys via `affectedKeys().hasOnly(...)`.
6. **Path ID & Size Hardening**: Single-document operations validate `isValidId(docId)` (`<= 128` chars, `^[a-zA-Z0-9_\-]+$`), every string enforces `.size()` limits, every array enforces bounded `.size()` and element type checks, and external URLs enforce `^https://.*$` (blocking `javascript:` / `data:` XSS URLs).
7. **PII Isolation & Query Enforcement**: `/admins` and `/audit_logs` never allow blanket `isSignedIn()` reads or `get()`/`exists()` inside `allow list`. Published portfolio items (`published == true`) are publicly queryable, while unpublished drafts are hidden from non-admins.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Write to Projects**: Anonymous client attempts `create` on `/projects/pwn` -> `PERMISSION_DENIED`.
2. **Email Spoofing (`email_verified: false`)**: Attacker signs in with unverified token matching admin email -> `PERMISSION_DENIED`.
3. **Self-Privilege Escalation**: Regular verified user attempts `create` on `/admins/{theirUid}` with `role: "super_admin"` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Project Create**: Verified admin sends extra ghost field `isVerified: true` on `/projects/proj-1` -> `PERMISSION_DENIED` (`hasOnly` rejection).
5. **Shadow Field Injection on Update**: Verified admin modifies unwhitelisted field `createdAt` or injects `shadowFlag: 1` during update -> `PERMISSION_DENIED`.
6. **ID Poisoning**: Attacker targets `/projects/../../etc/passwd` or 200-char ID -> `PERMISSION_DENIED` (`isValidId` rejection).
7. **XSS URL Scheme Injection**: Payload supplies `githubUrl: "javascript:alert(1)"` or `linkedinUrl: "data:text/html,..."` -> `PERMISSION_DENIED` (`^https://` regex guard).
8. **Audit Log Tampering / Deletion**: Even a verified super-admin attempts `update` or `delete` on `/audit_logs/log-1` -> `PERMISSION_DENIED`.
9. **Audit Log Identity Spoofing**: Admin attempts to log an event with `actorUid` set to a different UID -> `PERMISSION_DENIED`.
10. **Client Timestamp Forgery**: Payload passes backdated `createdAt` or `updatedAt != request.time` -> `PERMISSION_DENIED`.
11. **Denial-of-Wallet Oversized String / Array**: Payload submits 50KB `summary` or 100 items in `stack` array -> `PERMISSION_DENIED` (`.size()` limit).
12. **PII Blanket Read on `/admins` & Draft Leak on `/projects`**: Non-admin verified user attempts `get` on another user's `/admins/{otherUid}` or `list` on unpublished `/projects` (`published == false`) -> `PERMISSION_DENIED`.
