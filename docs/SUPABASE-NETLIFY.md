# TERA portals on Netlify + Supabase

The existing homepage and its artwork/animations are retained. `/student` and
`/admin` are built alongside it from the approved portal UI. Netlify serves the
pages; Supabase handles accounts, academy data and private course files. The
original Sites implementation stays independently usable.

## Finish setup

1. In the Supabase project's SQL Editor, create a query, paste the complete
   `supabase/migrations/202610190001_tera.sql` and run it **once**. The transaction
   creates the private schema, authorization functions and private storage bucket.
   Success may say "No rows returned". Do not rerun after success.
2. Under Authentication → URL Configuration, set **Site URL** to the actual live
   Netlify homepage URL. Add these exact redirect URLs for that same origin:
   `https://YOUR-SITE.netlify.app/student` and `https://YOUR-SITE.netlify.app/admin`.
   Use the production custom domain instead if configured. Avoid wildcard origins.
3. Keep email confirmations enabled. Set the minimum password length to 12.
   Configure custom SMTP before inviting real students; the default Supabase email
   service is for testing and has delivery restrictions/rate limits.
4. Wait for the GitHub-triggered Netlify build. The settings remain base directory
   `netlify-public`, command `node build.mjs`, publish directory `site`, Node 22.
   A separate npm lockfile keeps this build independent of the Sites dependencies.
   The supplied project URL and **publishable** key are included in the build.
   Optional environment overrides: `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never put a service-role key in either.
5. Open `/student`, register the intended administrator and confirm the email.
   Edit the email in `supabase/grant-admin.sql`, then run that script in SQL Editor.
   That account can now open `/admin`. There is no automatic first-user admin,
   user-editable role field, or admin link in the student portal.
6. As administrator, create a draft course, add notes or a file to a lesson,
   publish the lesson, then publish the course. Online courses are beginner-only.
7. With a separate student account, apply, approve it from the admin portal, and
   verify lesson access. For an in-person course, the approved student sees the
   private WhatsApp group invitation. The course list refreshes every 30 seconds
   while visible and on window focus. WhatsApp messages are not sent automatically.

## Access and limitations

- Private-schema tables have RLS enabled and no browser grants. The exposed
  `tera_api` SECURITY DEFINER function pins its search path, derives identity from
  `auth.uid()`, and explicitly checks every operation. Admin membership is stored
  separately and only the project owner can change it through SQL.
- Student catalogue responses omit WhatsApp links. Lessons, progress and files
  require an approved enrolment in a published course. Draft lessons are hidden.
- Private Storage RLS checks the same enrolment rules. Only administrators upload
  or delete objects. MP4, WebM and PDF files are limited to 25 MB each.
- Material links expire after **5 minutes**. Revocation prevents new URLs; already
  issued links may remain usable until expiry, and downloaded files cannot be
  recalled. Video errors offer a reload action which checks current access again.
- Deleting a file removes its database access first, then the Storage object. If
  cleanup fails, remove the orphan manually from Supabase Storage; access stays
  revoked. Never manipulate `storage.objects` directly to delete actual files.
- Payments, automatic WhatsApp messages, certificates and existing Sites data
  migration are not included. Supabase starts with an empty course collection.

## Verification

`npm ci --prefix netlify-public --workspaces=false`

`npm test --prefix netlify-public`

`node netlify-public/build.mjs`

Security tests execute the actual migration in PGlite PostgreSQL with mock Supabase
Auth/Storage tables, including real roles and RLS. They cover anonymous rejection,
admin escalation attempts, draft isolation, approval, cross-user access, WhatsApp
privacy, Storage policies, revocation and archiving. These tests do not verify
Supabase email delivery or live Netlify browser behavior; finish the live steps
above before opening registrations to students.
