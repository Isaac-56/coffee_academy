# TERA Coffee Academy

Coffee education with Henok Asrat. One repository contains the public website, instructor administration and student learning portal.

## Pages

- `/`: approved marketing website and photographic coffee hero.
- `/admin`: course drafts, lesson notes, video/PDF uploads and enrolment decisions.
- `/student`: course applications, approved lessons, completion tracking and in-person class/WhatsApp details.

## Development

Node.js 22.13+ and pnpm 11.25.0 are required. Install with `pnpm install --frozen-lockfile`, then `pnpm dev`. Run `pnpm check` and `pnpm build` before deployment. The managed Sites helper handles hosting-specific builds.

The current production site uses platform-owned ChatGPT authentication, Cloudflare D1 and R2. Do not expose the API behind a proxy that trusts client-supplied identity headers. `ADMIN_EMAILS` is a server-side comma-separated allowlist configured through hosting secrets. No credentials belong in this repository. Missing admin configuration grants nobody admin access.

## Course workflow

1. Create a draft course. Online courses are beginner-only; in-person courses support all three levels.
2. For online courses, save a lesson, write notes and/or upload teaching files, then publish the lesson.
3. Publish the course to make it available in the student catalogue.
4. Students sign in, save contact details and submit an application with consent.
5. Review applications in the admin panel. Approval grants access; revocation removes it immediately.
6. Approved online students can open videos/notes and save progress. Approved in-person students can see the schedule, venue and private WhatsApp group invitation.

Lesson uploads support MP4, WebM and PDF, up to 25 MB each. Split longer videos into short lessons; a dedicated long-video streaming provider is a future integration. Videos should include captions or a transcript in notes. Files are served through an authenticated endpoint, never a public bucket URL.

## Structure

- `legacy/home.html`: homepage HTML, served by `app/route.ts`.
- `public/`: self-hosted homepage assets, styles, scripts and photographs.
- `app/portal.tsx`, `app/globals.css`: admin and student interfaces.
- `server/academy.mjs`: server-enforced permissions and business rules.
- `db/schema.ts`, `drizzle/`: database schema and immutable migrations.
- `tests/academy.test.mjs`: SQLite-backed authentication, enrolment, lesson, file and WhatsApp access tests.
- `src/` and `tests/models.test.mjs`: historical 3D prototype retained for reference; not loaded by the website or included in current test commands.

## Deployment and launch

Sites provisions the D1/R2 bindings and applies the generated migrations during deployment. Never change applied migration files. To change the schema, edit `db/schema.ts` and run `pnpm db:generate`.

The site remains owner-private. The current owner is the initial administrator. Henok's verified sign-in email must be added to `ADMIN_EMAILS`, and hosting access granted, before he can use it. Student access outside this private workspace needs an explicit sharing/launch decision. Payments, automatic email/WhatsApp messages, certificates and public email/password authentication are not implemented. Approval and group invitations appear inside the portal. Real courses, fees and contact information await Henok's confirmation.
