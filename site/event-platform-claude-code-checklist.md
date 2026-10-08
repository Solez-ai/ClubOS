# EVENT PLATFORM - COMPLETE IMPLEMENTATION CHECKLIST
## Claude Code Codebase Audit & Implementation Specification

Purpose:
This document is the complete implementation checklist for the current event/fest platform. Claude Code should inspect the entire existing codebase first, identify the current architecture, and then implement/fix the requirements below.

IMPORTANT:
- Do not merely hide missing functionality behind UI buttons.
- Audit the existing authentication, database schema, routing, authorization, storage, email system, and event/registration data model before making changes.
- Reuse existing architecture where it is sound, but refactor broken foundations rather than stacking patches on top of them.
- The organizer and participant experiences must be genuinely separated.
- Event/fest routing must be fixed at the underlying data/routing level.
- Test complete end-to-end flows after implementation.

---

# 1. AUTHENTICATION AND ACCOUNT TYPES

[ ] Landing page clearly separates:
    [ ] Participant Login
    [ ] Participant Signup
    [ ] Organizer Login
    [ ] Organizer Signup

[ ] Signup requires selecting an account type:
    [ ] Participant
    [ ] Organizer

[ ] Participant and organizer accounts have separate experiences.

[ ] Authentication persists across refreshes and sessions.

[ ] Logged-in users are redirected to the correct dashboard based on account type.

[ ] Participants cannot access organizer routes by manually entering URLs.

[ ] Organizers cannot access participant-only management routes.

[ ] Role protection is enforced at the application/backend/database level, not just by hiding UI buttons.

---

# 2. PARTICIPANT HOME / EVENT DISCOVERY FEED

[ ] Participant dashboard contains a large home feed.

[ ] Feed displays active/current events/fests created by organizers.

[ ] Participants can discover events without already knowing the organizer.

[ ] Event cards display relevant information:
    [ ] Fest/event name
    [ ] Cover image
    [ ] Organizer
    [ ] Date
    [ ] Location
    [ ] Categories
    [ ] Short description
    [ ] Registration status
    [ ] Availability if applicable

[ ] Clicking an event opens its actual event page.

[ ] Event URLs resolve correctly.

[ ] Fix the existing "Fest not found" problem.

[ ] Event pages work when opened:
    [ ] From participant feed
    [ ] From search
    [ ] From filters
    [ ] From organizer dashboard
    [ ] From a direct URL
    [ ] After browser refresh

[ ] Final implementation uses persistent real event data rather than fake/static event data.

---

# 3. PARTICIPANT SEARCH

[ ] Add a dedicated event search function.

[ ] Search events/fests.

[ ] Search supports at least:
    [ ] Fest/event title
    [ ] Organizer name
    [ ] Description
    [ ] Categories/tags
    [ ] Location

[ ] Search results update correctly.

[ ] Empty search results have a proper empty state.

[ ] Search works with filters.

---

# 4. PARTICIPANT FILTERING

[ ] Add a dedicated filter interface.

[ ] Filter system is feature-rich, not just a basic category dropdown.

[ ] Participants can filter by date.

[ ] Date filtering supports appropriate date selection.

[ ] Participants can filter by category/tag.

[ ] Create a large predefined category/tag system.

Suggested categories include:

[ ] Science
[ ] Technology
[ ] Programming
[ ] Robotics
[ ] Engineering
[ ] Mathematics
[ ] Business
[ ] Entrepreneurship
[ ] Innovation
[ ] Artificial Intelligence
[ ] Cybersecurity
[ ] Gaming
[ ] Music
[ ] Art
[ ] Design
[ ] Literature
[ ] Debate
[ ] Sports
[ ] Education
[ ] Culture
[ ] Photography
[ ] Film
[ ] Media
[ ] Social Impact
[ ] Environment
[ ] Career
[ ] Others

[ ] Organizers select categories when creating a fest/event.

[ ] Participants can select one or multiple categories.

[ ] Filters can be combined.

[ ] Participants can clear all filters.

[ ] Active filters are visibly indicated.

[ ] Search + filters work together.

---

# 5. ORGANIZER ACCOUNTS

[ ] Organizer has a dedicated organizer dashboard.

[ ] Dashboard displays all fests/events owned or managed by the organizer.

[ ] Organizers can create multiple fests/events.

[ ] Organizers are not restricted to one fest.

[ ] Each fest has an independent management area.

[ ] Organizer can open a fest from the dashboard.

[ ] Clicking a fest leads to a real management page.

[ ] No dead "Fest not found" page when accessing an organizer's own event.

---

# 6. CREATE FEST / EVENT

[ ] Add proper "Create Fest" / "Create Event" flow.

Organizer can enter:

[ ] Fest/event title
[ ] Description
[ ] Cover image
[ ] Date
[ ] Location
[ ] Categories/tags
[ ] Other relevant event information

[ ] Cover image can be uploaded.

[ ] Event information is persisted to the database.

[ ] Draft/published state is handled properly.

[ ] Organizer can edit an existing fest.

[ ] Organizer can update cover image.

[ ] Organizer can update description.

[ ] Organizer can update categories.

[ ] Organizer can update location.

[ ] Organizer can update event dates.

---

# 7. EVENT LOCATION

[ ] Every fest/event has a location.

[ ] Organizer can manually enter an address/location.

[ ] Organizer can paste a Google Maps link.

[ ] Google Maps link is stored with the event.

[ ] Participant event page clearly displays location.

[ ] If a Google Maps link exists, provide a button to open it.

[ ] Google Maps is optional; manual address entry remains supported.

---

# 8. FEST SEGMENTS

[ ] Each fest can contain multiple segments/events.

[ ] Organizer can add segments.

[ ] Organizer can edit segments.

[ ] Organizer can delete segments.

Each segment should support:

[ ] Name/title
[ ] Description
[ ] Price
[ ] Free/paid status

[ ] Multiple segments can exist inside one fest.

[ ] Participant event page displays all available segments.

[ ] Participants can select which segments they want to join.

[ ] Participants are not forced to register for every segment.

[ ] Selected segment prices automatically calculate into a total price.

---

# 9. ORGANIZER PAYMENT CONFIGURATION

[ ] Organizers configure payment information for paid segments.

[ ] Organizer can select:
    [ ] bKash
    [ ] Nagad

[ ] Organizer can specify the payment number/account.

[ ] Organizer can choose the payment method/type.

Payment method must distinguish between:

[ ] Send Money
[ ] Pay Bill

[ ] Send Money and Pay Bill are NOT treated as the same thing.

[ ] Organizer can configure appropriate payment instructions for paid segments/events.

[ ] Participants see exactly how they should pay.

[ ] Payment instructions display the relevant number/account.

---

# 10. PARTICIPANT EVENT PAGE

Event page displays:

[ ] Cover image
[ ] Title
[ ] Description
[ ] Organizer
[ ] Date
[ ] Location
[ ] Google Maps link if available
[ ] Categories
[ ] Segments
[ ] Prices
[ ] Registration information

[ ] Clear "Register" button.

[ ] Register button actually initiates registration flow.

---

# 11. PARTICIPANT REGISTRATION FORM

[ ] Clicking Register opens a substantial registration form.

Required participant information:

[ ] Full name
[ ] Email address
[ ] Mobile number

[ ] Participant can select desired segments.

[ ] Segment prices are displayed.

[ ] Selected segment prices calculate automatically.

[ ] Total registration price is displayed prominently.

If all selected segments are free:

[ ] Skip payment.
[ ] Do not display unnecessary payment fields.

If any selected segment is paid:

[ ] Display payment interface.

---

# 12. BKASH PAYMENT

[ ] Add dedicated bKash payment option.

[ ] bKash button uses bKash visual identity:
    [ ] Pink
    [ ] White accents
    [ ] bKash logo

[ ] Clicking bKash displays organizer-configured payment instructions.

Display:

[ ] Payment number
[ ] Payment type
[ ] Amount to pay
[ ] Required instructions

[ ] Clearly distinguish Send Money from Pay Bill.

Participant must submit:

[ ] Payment screenshot
[ ] Transaction ID
[ ] Mobile number used to make payment

[ ] Payment submission is stored with registration.

---

# 13. NAGAD PAYMENT

[ ] Add dedicated Nagad payment option.

[ ] Nagad button uses appropriate Nagad visual identity:
    [ ] Orange
    [ ] Yellow
    [ ] White accents
    [ ] Nagad logo

[ ] Clicking Nagad displays organizer-configured payment instructions.

Display:

[ ] Payment number
[ ] Payment type
[ ] Amount to pay
[ ] Required instructions

Participant must submit:

[ ] Payment screenshot
[ ] Transaction ID
[ ] Mobile number used to make payment

[ ] Nagad and bKash use the same underlying payment-submission architecture where appropriate, but have different provider presentation/branding.

---

# 14. REGISTRATION SUBMISSION

[ ] Registration creates a persistent registration record.

[ ] Generate a unique participant/registration identifier immediately after registration.

[ ] Identifier must be unique.

Store:

[ ] Participant name
[ ] Participant email
[ ] Participant phone
[ ] Fest/event
[ ] Selected segments
[ ] Total amount
[ ] Payment provider
[ ] Payment method
[ ] Payment screenshot
[ ] Transaction ID
[ ] Paying mobile number
[ ] Registration timestamp
[ ] Verification status
[ ] Organizer comments/reason if applicable

[ ] Registration begins in an appropriate pending state.

[ ] Payment is not considered officially verified until organizer verification.

---

# 15. ORGANIZER PARTICIPANT MANAGEMENT

[ ] Every fest has a participant-management section.

[ ] Organizer can open a fest and see its participants.

[ ] Participants displayed in a large table.

Table contains relevant information:

[ ] Unique identifier
[ ] Name
[ ] Email
[ ] Phone
[ ] Selected segments
[ ] Amount
[ ] Payment method
[ ] Transaction ID
[ ] Payment mobile number
[ ] Registration date
[ ] Verification status

[ ] Table supports scrolling.

[ ] Participant records are easy to inspect.

[ ] Organizer can verify payment.

[ ] Organizer can decline payment.

[ ] Add "Verify Payment" button.

[ ] Add "Decline Payment" button.

[ ] Verification updates registration status.

[ ] Once verified, unique identifier becomes finalized/official.

[ ] Participant becomes officially registered.

---

# 16. DECLINED REGISTRATIONS

[ ] Organizer can decline a registration.

[ ] Organizer can provide a reason/comment.

[ ] Decline reason is persisted.

[ ] Participant is notified when registration/payment is declined.

[ ] Decline notification is sent by email.

[ ] Decline status appears in participant account.

[ ] Participant can see organizer's decline comment.

---

# 17. AUTOMATED REGISTRATION EMAIL

[ ] Automatically send email after registration.

[ ] Email thanks participant for registering.

[ ] Email identifies event/fest.

[ ] Email identifies organization/organizer.

[ ] Email lists selected segments.

[ ] Email contains relevant registration information.

[ ] Email includes unique identifier where appropriate.

[ ] Email communicates pending payment verification vs confirmed registration where appropriate.

---

# 18. PARTICIPANT ACCOUNT / PROFILE

[ ] Participant has an account/profile menu.

[ ] Participant can view profile.

[ ] Participant can edit account information.

[ ] Participant can edit profile picture.

[ ] Participant can update relevant personal details.

[ ] Account changes persist.

---

# 19. PARTICIPANT MANAGE / HISTORY

[ ] Add "Manage" section to participant navigation.

[ ] Manage contains complete registration history.

[ ] Show events participant registered for.

[ ] Show active/upcoming registrations.

[ ] Show previously completed events.

[ ] Completed events are visually subdued/grayed out.

[ ] Active registrations remain visually prominent.

[ ] Each registration can be opened.

Registration detail should show:

[ ] Event/fest
[ ] Organizer
[ ] Unique identifier
[ ] Registration information
[ ] Selected segments
[ ] Amount paid
[ ] Payment provider
[ ] Payment method
[ ] Transaction ID where appropriate
[ ] Registration status
[ ] Payment verification status
[ ] Decline reason if applicable
[ ] Other relevant registration information

[ ] This functions as a persistent registration/history record.

---

# 20. REGISTRATION STATUS SYSTEM

Support clear registration states, at minimum:

[ ] Pending
[ ] Payment pending
[ ] Verified/confirmed
[ ] Declined
[ ] Completed

[ ] Participant UI clearly communicates current state.

[ ] Organizer UI clearly communicates current state.

---

# 21. ORGANIZER DASHBOARD

[ ] Completely fix/rebuild organizer dashboard as needed.

[ ] Dashboard shows organizer's fests.

[ ] Each fest is clickable.

[ ] Clicking fest opens management interface.

Management interface includes:

[ ] Overview
[ ] Event/fest details
[ ] Segments
[ ] Participants
[ ] Payment configuration
[ ] Registration information

[ ] Organizer can edit fest.

[ ] Organizer can add/edit/delete segments.

[ ] Organizer can view participants.

[ ] Organizer can verify registrations/payments.

[ ] Organizer can decline registrations/payments.

[ ] Organizer can manage payment settings.

---

# 22. COMPLETE ORGANIZER/PARTICIPANT SEPARATION

This is a major architectural requirement.

Participant application experience contains:

[ ] Participant navigation
[ ] Participant feed
[ ] Search
[ ] Filters
[ ] Event browsing
[ ] Registration
[ ] Manage/history
[ ] Profile

Organizer application experience contains:

[ ] Organizer dashboard
[ ] Fest management
[ ] Segment management
[ ] Participant management
[ ] Payment configuration
[ ] Event editing

[ ] Do not mix their navigation.

[ ] Do not show organizer controls to participants.

[ ] Do not show participant registration controls inside organizer management pages.

[ ] Use proper authorization rules in backend/database.

[ ] UI hiding alone is insufficient.

---

# 23. DATABASE / DATA MODEL

Properly model relationships between:

[ ] Users
[ ] Participants
[ ] Organizers
[ ] Organizations
[ ] Fests
[ ] Segments
[ ] Registrations
[ ] Payments
[ ] Payment evidence
[ ] Notifications

[ ] Every fest has a stable unique ID.

[ ] Every segment has a stable unique ID.

[ ] Every registration has a stable unique ID.

[ ] Organizer ownership is associated with the fest.

[ ] Segments belong to a fest.

[ ] Registrations belong to participant + fest.

[ ] Selected segments are associated with registration.

[ ] Payment records are associated with relevant registration.

[ ] Avoid using event names as database identifiers.

[ ] Ensure foreign keys/relationships are reliable.

[ ] Ensure organizer authorization is based on ownership/permissions.

---

# 24. EVENT ROUTING AND "FEST NOT FOUND" BUG

The current application has a serious bug where organizer "View Event Page" can result in:

"Fest not found"

and a link back to Passport.

Fix the underlying architecture.

[ ] Audit current event routing.

[ ] Audit event IDs/slugs.

[ ] Audit database fetches.

[ ] Audit organizer dashboard links.

[ ] Audit participant event links.

[ ] Audit route parameters.

[ ] Audit server/client rendering behavior if applicable.

[ ] Fix the actual cause rather than replacing the error screen.

[ ] Organizer event URLs resolve correctly.

[ ] Participant event URLs resolve correctly.

[ ] Refreshing event page does not cause event to disappear.

[ ] Opening copied event URL in a new tab works.

[ ] Event page retrieves correct persistent event.

[ ] Remove obsolete "back to Passport" behavior if it exists only because of broken architecture.

---

# 25. DATA PERSISTENCE AND RELIABILITY

[ ] Created fests persist.

[ ] Created segments persist.

[ ] Registrations persist.

[ ] Payment submissions persist.

[ ] Participant history persists.

[ ] Organizer participant tables update when registrations occur.

[ ] New registrations appear without manual database manipulation.

[ ] Verification immediately updates relevant registration state.

[ ] Declining immediately updates relevant registration state.

[ ] Email notifications trigger on appropriate events.

[ ] Forms validate input.

[ ] Required fields are genuinely required.

[ ] Invalid payment information cannot be submitted.

[ ] Duplicate registrations are prevented where appropriate.

[ ] Invalid segment selections are prevented.

[ ] Registration for unavailable/inactive events is handled correctly.

[ ] Loading states exist.

[ ] Error states exist.

[ ] Empty states exist.

[ ] Missing images are handled.

[ ] Missing Google Maps links are handled.

[ ] Free events skip unnecessary payment UI.

---

# 26. UI / UX REQUIREMENTS

[ ] Participant interface feels like an event discovery platform.

[ ] Organizer interface feels like an event-management system.

[ ] Do not make both dashboards identical except for a few buttons.

[ ] Event cards are visually clear.

[ ] Filters remain usable with many categories.

[ ] Large registration forms are divided into logical sections where appropriate.

[ ] Payment screens clearly display exact amount to pay.

[ ] Payment provider buttons are visually distinguishable.

[ ] Statuses are visually obvious.

[ ] Participant tables remain usable with many records.

[ ] Long tables scroll correctly.

[ ] Mobile layout works.

[ ] Desktop layout works.

[ ] No broken navigation.

[ ] No dead buttons.

[ ] No placeholder functionality presented as complete functionality.

---

# 27. COMPLETE END-TO-END PARTICIPANT TEST

Claude Code should manually/test-programmatically verify the following complete flow:

[ ] Create participant account.

[ ] Log in as participant.

[ ] See active events.

[ ] Search for an event.

[ ] Filter events.

[ ] Open event.

[ ] View event information.

[ ] View segments.

[ ] Select segments.

[ ] Confirm calculated total.

[ ] Register for a free event.

[ ] Register for a paid event.

[ ] Select bKash.

[ ] See correct payment instructions.

[ ] Upload payment screenshot.

[ ] Enter transaction ID.

[ ] Enter paying mobile number.

[ ] Submit registration.

[ ] Receive registration email.

[ ] See registration in Manage.

[ ] See pending status.

[ ] Organizer verifies registration.

[ ] Participant sees verified status.

[ ] Participant sees finalized unique identifier.

[ ] Register another participant/registration.

[ ] Organizer declines it.

[ ] Organizer enters decline reason.

[ ] Participant receives decline email.

[ ] Participant sees decline reason in account.

---

# 28. COMPLETE END-TO-END ORGANIZER TEST

[ ] Create organizer account.

[ ] Log in as organizer.

[ ] Create fest.

[ ] Add title.

[ ] Add description.

[ ] Upload cover image.

[ ] Add location.

[ ] Add Google Maps link.

[ ] Select categories.

[ ] Add free segment.

[ ] Add paid segment.

[ ] Configure bKash.

[ ] Configure Nagad.

[ ] Configure Send Money / Pay Bill.

[ ] Publish fest.

[ ] Open fest from organizer dashboard.

[ ] Open actual event page.

[ ] Confirm event does NOT show "Fest not found".

[ ] Receive participant registration.

[ ] Open participant management.

[ ] See participant in table.

[ ] Inspect payment information.

[ ] Verify payment.

[ ] Confirm participant becomes officially verified.

[ ] Decline another registration.

[ ] Add decline reason.

[ ] Confirm participant receives decline notification.

[ ] Edit fest.

[ ] Confirm participant-facing event page reflects changes.

---

# 29. FINAL CODEBASE AUDIT

Before declaring the implementation complete, Claude Code must inspect the entire codebase for:

[ ] Broken routes.

[ ] Broken imports.

[ ] Dead components.

[ ] Placeholder data.

[ ] Mock event data accidentally used in production flows.

[ ] Hardcoded event IDs.

[ ] Hardcoded participant data.

[ ] Incorrect role checks.

[ ] Missing authorization.

[ ] Database schema inconsistencies.

[ ] Broken foreign-key relationships.

[ ] Event routing inconsistencies.

[ ] Incorrect redirects.

[ ] Unhandled loading states.

[ ] Unhandled errors.

[ ] Registration edge cases.

[ ] Payment edge cases.

[ ] Duplicate registration problems.

[ ] Broken image uploads.

[ ] Broken email triggers.

[ ] Mobile layout issues.

[ ] Desktop layout issues.

[ ] Security issues caused by trusting client-side role information.

[ ] Any existing functionality that was accidentally broken by the new implementation.

---

# 30. IMPLEMENTATION PRIORITY

Implement in this order so that the application is built on a stable foundation:

PHASE 1 - ARCHITECTURE
[ ] Audit entire codebase.
[ ] Audit authentication.
[ ] Audit database schema.
[ ] Audit event/fest data model.
[ ] Audit routing.
[ ] Audit organizer/participant roles.
[ ] Fix foundational architectural problems.

PHASE 2 - AUTHENTICATION
[ ] Participant signup/login.
[ ] Organizer signup/login.
[ ] Role-based routing.
[ ] Role-based authorization.
[ ] Separate dashboards.

PHASE 3 - ORGANIZER SYSTEM
[ ] Organizer dashboard.
[ ] Create fest.
[ ] Edit fest.
[ ] Cover image.
[ ] Location.
[ ] Categories.
[ ] Segments.
[ ] Payment configuration.
[ ] Publish/manage fest.

PHASE 4 - EVENT DISCOVERY
[ ] Participant feed.
[ ] Search.
[ ] Categories.
[ ] Date filters.
[ ] Combined filters.
[ ] Correct event pages.
[ ] Fix "Fest not found".

PHASE 5 - REGISTRATION
[ ] Registration form.
[ ] Segment selection.
[ ] Price calculation.
[ ] Free registration.
[ ] Paid registration.
[ ] Registration records.
[ ] Unique identifiers.

PHASE 6 - PAYMENTS
[ ] bKash.
[ ] Nagad.
[ ] Send Money.
[ ] Pay Bill.
[ ] Payment screenshots.
[ ] Transaction IDs.
[ ] Paying mobile numbers.
[ ] Organizer payment verification.

PHASE 7 - PARTICIPANT MANAGEMENT
[ ] Participant Manage section.
[ ] Registration history.
[ ] Registration details.
[ ] Statuses.
[ ] Profile/account editing.

PHASE 8 - ORGANIZER PARTICIPANT MANAGEMENT
[ ] Participant table.
[ ] Verify payment.
[ ] Decline payment.
[ ] Decline reasons.
[ ] Registration statuses.

PHASE 9 - EMAILS
[ ] Registration confirmation email.
[ ] Segment information in email.
[ ] Unique identifier where appropriate.
[ ] Decline email.
[ ] Decline reason in notification.

PHASE 10 - TESTING
[ ] Complete participant flow.
[ ] Complete organizer flow.
[ ] Free event flow.
[ ] Paid event flow.
[ ] bKash flow.
[ ] Nagad flow.
[ ] Verification flow.
[ ] Decline flow.
[ ] Direct event URL.
[ ] Refresh event URL.
[ ] Mobile UI.
[ ] Desktop UI.
[ ] Authorization/security testing.

---

# DEFINITION OF DONE

The platform should NOT be considered complete until:

[ ] A participant can create an account.
[ ] An organizer can create an account.
[ ] The two experiences are properly separated.
[ ] An organizer can create multiple fests.
[ ] An organizer can create segments inside each fest.
[ ] Organizers can configure free and paid segments.
[ ] Organizers can configure bKash/Nagad and Send Money/Pay Bill.
[ ] Participants can discover events.
[ ] Participants can search.
[ ] Participants can filter by date/categories.
[ ] Participants can open working event pages.
[ ] The "Fest not found" issue is fixed at the architectural level.
[ ] Participants can register.
[ ] Participants can select segments.
[ ] Total price calculates correctly.
[ ] Free registrations work.
[ ] Paid registrations work.
[ ] Payment screenshots can be uploaded.
[ ] Transaction IDs can be submitted.
[ ] Paying mobile numbers can be submitted.
[ ] Registrations receive unique identifiers.
[ ] Organizers can see registrations.
[ ] Organizers can verify payments.
[ ] Organizers can decline registrations.
[ ] Organizers can provide decline reasons.
[ ] Participants can see registration history.
[ ] Participants can see registration/payment status.
[ ] Participants can edit their profile.
[ ] Automated registration emails work.
[ ] Automated decline emails work.
[ ] The registration email contains selected segments.
[ ] Event information persists correctly.
[ ] Registration information persists correctly.
[ ] Organizer authorization is enforced.
[ ] Participant authorization is enforced.
[ ] Complete end-to-end participant flow works.
[ ] Complete end-to-end organizer flow works.
[ ] No major dead buttons, broken routes, placeholder data, or "Fest not found" errors remain.

FINAL INSTRUCTION TO CLAUDE CODE:

Do not treat this document as a request to merely add UI elements. Treat it as a full product implementation and codebase repair specification.

First inspect the existing repository and determine:
1. What currently exists.
2. What is incomplete.
3. What is broken.
4. What architecture must be changed.
5. What database/schema changes are required.
6. What routes need to be created or fixed.
7. What authentication/authorization changes are required.
8. What existing functionality can safely be preserved.

Then implement the requirements systematically.

Do not stop after implementing the frontend. Ensure the database, backend/server actions/API, authentication, authorization, storage, routing, payment evidence, email triggers, and frontend are all connected into one working system.

After implementation, run the relevant build, type-check, lint, and tests available in the repository and fix resulting errors. Then perform the end-to-end flows described above.
