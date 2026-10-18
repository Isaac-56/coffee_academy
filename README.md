# Henok Asrat — Coffee Academy

A planned coffee training website and learning platform for Henok Asrat.

## Status

The cinematic public website frontend is implemented with procedural Three.js scenes, responsive styling, course exploration and an enquiry draft flow. Student accounts, admin tools, protected lessons and live integrations remain pending. See [implementation and setup](docs/IMPLEMENTATION.md) for instructions and launch requirements.

## Confirmed requirements

- Instructor: Henok Asrat.
- Online training: beginner level only, using videos, detailed written lessons, or both.
- In-person training: beginner, intermediate and professional levels.
- Henok needs an admin panel to publish content and manage students and classes.
- In-person students register on the website and receive instructions to join the WhatsApp group assigned to their class batch.

## Product areas

### Public website

Home, instructor profile, online courses, in-person training and enquiries. Clearly distinguish online beginner courses from the three in-person levels. Do not invent qualifications, testimonials, prices, experience, certificates or training locations.

### Student dashboard

- Enrolled courses and continue-learning action.
- Course > module > lesson navigation.
- Video lessons, rich text notes and optional downloadable resources.
- Saved lesson completion and playback position.
- Registration status and confirmed in-person class details.
- WhatsApp group invitation for the student's confirmed batch.
- Mobile-friendly reading and video playback.

### Instructor administration

- Course, module and lesson creation and ordering.
- Video uploads, formatted notes and resource attachments.
- Draft, preview, publish and unpublish controls.
- Student access approval, revocation and progress review.
- In-person batches with level, dates, venue, capacity and waitlist.
- Registration approval and batch assignment.
- Per-batch WhatsApp invitation link management.
- Editable instructor profile and public course content.

## Proposed operating defaults

These are working assumptions pending Henok's confirmation:

- Manual enrolment approval; no automatic course access from account creation alone.
- Recorded online lessons; live teaching is outside the initial scope.
- Website and email registration notifications.
- One WhatsApp group per in-person class batch.
- Payment processing, certificates, quizzes, scheduled lesson releases and automated WhatsApp messaging deferred until their requirements are confirmed.

## Registration and WhatsApp flow

1. Student chooses an in-person level and available batch.
2. Student submits contact details, including WhatsApp number with country code.
3. Registration is stored as pending and appears in the admin panel.
4. Henok confirms a place or moves the student to a waitlist.
5. Confirmed students see the class details and Join WhatsApp Group action in their dashboard.
6. Henok manages actual group membership in WhatsApp.

A click on an invitation link is not proof of joining. Do not automatically mark a student as joined. Do not expose private group links publicly or to unapproved registrations. Inform students that ordinary WhatsApp groups expose members' phone numbers. Automated direct messages require a configured WhatsApp Business integration, applicable templates and opt-in; an ordinary invite link does not send messages.

## Implementation checklist

- [ ] Establish application framework and development scripts.
- [ ] Design public homepage and student lesson screen.
- [ ] Extend responsive design to courses, registration and admin screens.
- [ ] Implement authentication and server-enforced instructor/student roles.
- [ ] Implement database, enrolments, capacity controls and per-student progress.
- [ ] Implement protected lesson and media access; never rely on hidden UI for security.
- [ ] Implement course editing, uploads and publishing.
- [ ] Implement batch registration and private WhatsApp handoff.
- [ ] Connect email delivery and provide clear failure/retry states.
- [ ] Verify enrolment permissions, draft visibility, revocation and duplicate registrations.
- [ ] Test phone and desktop layouts and complete deployment setup.

## Information required before launch

Henok's approved biography, photograph, qualifications, curriculum, learning materials, pricing, payment arrangements, class schedule, venue, capacity, contact details and WhatsApp group links. Certificate availability remains unconfirmed.

## Repository hygiene

Keep credentials, student records, private group links and unpublished course media out of Git. Store configuration secrets in the deployment environment. Use illustrative data only in demos, clearly labelled as sample content.

