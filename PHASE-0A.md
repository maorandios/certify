# Session — PHASE 0A

Date: 27 Aug 2026

## Product correction

The app does **not** define required certifications, profession, or legal eligibility.

An employee is only:

- `fullName`
- `identityNumber`
- `profileImage?`
- `description?` (unstructured; never interpreted as a rule)

Status is **document health** of active stored documents:

- `current` → המסמכים בתוקף
- `expiring` → לקראת פקיעת תוקף
- `expired` → מסמך פג תוקף
- `needs_review` → נדרשת בדיקה
- `no_documents` → טרם הועלו מסמכים

`superseded` / `archived` documents stay in history and do not affect status. A certain replacement marks the old document `הוחלף`.

Removed: `RequirementTemplate`, `EmployeeRequirement`, profession, missing-requirement copy, eligibility claims.

## Built in PHASE 0A

- Next.js + TypeScript + Tailwind, Hebrew RTL (`Google Sans`), teal design tokens
- Mobile bottom nav + FAB; compact desktop top bar (no rail)
- Home: compact document-health strip + agentic activity feed
- Global upload composer (handoff only)
- Non-blocking jobs: capsule `מעבדים מסמך…`, jobs sheet, persisted Zustand store
- Happy-path mock: assign to יוסף לוי and supersede an existing height-work cert
- Toast + feed update; `עובדים` placeholder only (12 seeded employees)

## Verification

`npm run typecheck`, `npm run lint`, `npm test` (7 tests), `npm run build` — passed.

Browser: home, employees placeholder, upload from another screen, capsule, replacement toast/feed.

## Not in this session

PHASE 0B (list, details, create, unmatched/ambiguous, document viewer), 0C (sharing), 0D (remaining states, demo switcher).
