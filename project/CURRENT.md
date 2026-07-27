# Current Task

## Feature

Profile Preferences

---

## Goal

Implement management of user discovery preferences.

These preferences are independent of the public profile and are used later by Discovery and Matching.

---

## Scope

### Retrieve Preferences

GET /api/v1/profile/preferences

Return the authenticated user's discovery preferences.

If none exist, return sensible defaults.

---

### Update Preferences

PATCH /api/v1/profile/preferences

Allow updating:

- minAge
- maxAge
- maxDistanceKm
- preferredGenders
- preferredIntents

---

### Validation

Enforce:

- minAge >= 18
- maxAge <= 100
- minAge <= maxAge
- distance > 0
- no duplicate enum values

---

### Authentication

Protect all endpoints using:

- JwtAuthGuard
- @CurrentUser()

---

### Swagger

Document every endpoint.

---

### Tests

Write:

- unit tests
- E2E tests

Cover:

- default preferences
- update
- invalid ranges
- duplicate enum values
- unauthorized access

---

## Out of Scope

Do NOT implement:

- matching
- recommendation engine
- discovery queries
- completion engine

---

## Definition of Done

- GET preferences works
- PATCH preferences works
- defaults returned
- validation enforced
- tests pass
- build passes
- lint passes

---

## Deliverables

- DTOs
- PreferenceRepository
- PreferenceService
- Controller updates
- Tests
- Updated project/PROGRESS.md