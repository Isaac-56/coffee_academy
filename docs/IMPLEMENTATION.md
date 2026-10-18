# Website implementation

## Run locally

Node.js 22 or newer:

```sh
npm ci
npm run build
npm run check
npx --yes serve dist
```

Serve over HTTP; do not open index.html using file:// because ES modules require an HTTP origin. The committed dist directory is directly deployable to static hosting. No secret credentials are needed to review the frontend.

## Editing

- `dist/content.js`: academy identity, proposed courses, craft journey and integration endpoint configuration.
- `dist/index.html`: page sections, labels, contact placeholders and editorial copy.
- `dist/styles.css`: design tokens, responsive layout and motion preferences.
- `dist/app.js`: filters, dialogs, navigation, forms and lazy scene loading.
- `src/scene.js`: Three.js orchestration, studio reflections, shadows, animation and lifecycle. Models, materials and steam are separated into `src/coffee-models.js`, `src/materials.js` and `src/steam.js`. Run `npm run build` after changing this file; do not edit the generated `dist/scene.js`.
- `dist/assets`: replace reference photos and favicon here. Update alt text alongside imagery.

The approved brand is TERA Coffee Academy. Henok Asrat remains the named instructor.

## Included

Ten public sections: hero, philosophy, courses, interactive craft, instructor, facilities, student-story placeholder, certification/partner placeholder, admissions and footer. Responsive styles, local fonts, reference imagery, course filtering, dialogs, keyboard-operable stage selection and rotation, reduced-motion control, lightweight CSS fallback and progressive reveal.

The hero includes a smooth-profile porcelain cup, a tapered D-shaped handle, saucer, fine gold trim, textured crema and latte art, sculpted beans and animated turbulence-based steam. The craft scene progresses through bean, roast, grounds, dripper and cup. These are authored procedural models, not scanned photorealistic GLB assets. Desktop scrolling changes stages and camera distance; buttons allow direct control on all layouts. Scenes suspend animation when out of view or when the document is hidden. Mobile/save-data/low-memory/reduced-motion clients start with CSS artwork and may explicitly activate 3D.

## What is not live yet

This is the public website frontend. Student accounts, protected lessons, the instructor admin panel, persistent enrolments, payments, email delivery and WhatsApp Business automation are not implemented by this release. They remain in the original project scope.

The admissions form validates locally and creates a downloadable text enquiry. It does not transmit data or reserve a seat. A live HTTPS `enquiryEndpoint` may be configured after implementing a server that validates the same rules, verifies consent, applies rate limiting, stores registrations and returns `{ "accepted": true }` only after durable acceptance. Never embed an API key in frontend code. HTTP errors, timeouts and an unconfirmed response must not show a successful submission.

Newsletter collection is deliberately disabled until a double-opt-in service and privacy notice are configured. The optional endpoint must return `accepted: true` only after queuing a confirmation request.

Do not place private WhatsApp invitation links in `content.js`. Retrieve them server-side only for authenticated, confirmed batch members. Clicking a link must not be treated as verified membership.

## Before a public launch

Replace proposed topics, placeholder fees/duration, biography, portrait, reference facility imagery, contact details, map, social profiles, student stories and certifications with Henok-approved content. Only display partner logos with a real affiliation. Provide the final privacy notice and retention policy. Configure and verify the live registration backend and delivery channel. Conduct desktop/mobile browser and assistive-technology QA; browser rendering was not verified in the build environment.

## Image references

Images are downloaded Unsplash reference photographs, not Henok's facilities:
- https://images.unsplash.com/photo-1511081692775-05d0f180a065
- https://images.unsplash.com/photo-1442512595331-e89e73853f31
- https://images.unsplash.com/photo-1447933601403-0c6688de566e

Font and Three.js licenses are included alongside this document.

## TERA realism revision

Replaced the circular handle with a custom tapered D-shaped mesh, smoothed the porcelain profile, added image-based studio lighting and grounded shadows, and replaced faint sprite dots with animated noise-driven rising steam. Beans now use recessed geometry and fine surface texture. Course cards use illustrative photography. Brand updated to TERA Coffee Academy; instructor identity is preserved.

Additional reference photograph: https://images.unsplash.com/photo-1541167760496-1628856ab772

## Coffee collection and craft revision

Courses 2 and 4 now use separate photographs. Replaced the stacked latte-art pattern with one larger heart. The brew stage is an integrated glass pour-over vessel, paper filter and wooden collar; the unsupported cone/ring/cup assembly is removed. Bean and roast stages show sample dishes; grounds use a smaller particle scale. A shared presentation base grounds the craft stages. Cup and saucer use continuous porcelain rims to avoid intersecting gold mesh artifacts.

Sensory course image: https://images.unsplash.com/photo-1495474472287-4d71bcdd2085 (illustrative reference).

The cup uses a generated photographic coffee-surface texture at `dist/assets/latte-surface.webp`, also used by the lightweight hero fallback. It was generated with the built-in image tool using this brief: orthographic top-down cappuccino surface, edge-to-edge caramel crema, one broad naturally poured ivory heart occupying roughly 72% of the width, organic microfoam and feathered edges, no cup or baked shadows. The runtime retains a local heart texture if the image cannot load.


## TERA photographic journal revision
The craft section now uses three photographic chapters (Character, Ritual, Expression), with scroll crossfades on desktop and accessible chapter buttons everywhere. Existing licensed reference photographs are illustrative, not academy facilities. The second WebGL canvas is no longer loaded. Hero ceramic handle uses a continuous Bezier ribbon with rounded bevels and two bowl attachment shoulders; latte surface and steam are preserved. Reduced-motion and compact layouts avoid the pinned scroll experience.

Ceramic lighting revision: asymmetric studio softbox reflections, restrained fill, glazed dielectric material, tighter shadow frustum and foot contact shadow. CSS fallback has shaped highlight and shadow gradients. Reference image guides lighting only; cup geometry and photographic journal are preserved.

## Photographic hero
The hero now uses a generated photorealistic product image instead of WebGL or a CSS cup. Desktop and mobile WebP assets live in dist/assets/hero-ceramic.webp and hero-ceramic-mobile.webp. Native CSS steam and modest pointer parallax respect the pause control and reduced-motion preferences. Three.js source is retained for reference but no longer downloaded by the public page. Image is illustrative brand artwork, not an actual academy photograph.
Generated with the built-in image generation tool. Prompt: Photorealistic luxury TERA cappuccino product photograph; ivory glazed ceramic cup, natural D-shaped handle, broad heart latte art, matching saucer, understated gold TERA lettering, dark espresso backdrop, soft window light and realistic contact shadow, three-quarter camera, no baked-in steam or CGI appearance.

Hero cutout revision: transparent RGBA cup/saucer with burlap sack, roasted beans and scoop, based on user reference. Built-in image generation edit preserved ceramic styling and removed background; WebP alpha is preserved. Assets: dist/assets/hero-cutout.webp and hero-cutout-mobile.webp. CSS mask removed, steam aligned above cup in the fixed-aspect image layer. Prompt: isolate TERA cup and saucer beside a smaller coffee sack and scoop, natural photorealistic materials, transparent background, no baked-in steam.

Hero spacing refinement: desktop composition reduced from 59vw to 47vw with a 6vw right inset; mobile uses 24px side gutters. Steam uses three softened SVG ribbons aligned with the cup, with staggered drift and visible static wisps when motion is paused or reduced.
