# Current Task

## Feature

Basic Profile Management

---

## Goal

Implement creation and editing of the core Profile entity.

This milestone allows authenticated users to create and update their personal profile information.

Only implement fields that belong directly to the Profile model.

Do not implement related entities.

---

## Scope

### Profile Creation

Implement:

POST /api/v1/profile

Creates a profile for the authenticated user.

A user may own exactly one profile.

Return:

- 201 Created
- 409 Conflict if profile already exists

---

### Profile Update

Implement:

PATCH /api/v1/profile/me

Allow updating only Profile fields.

Examples:

- firstName
- pronouns
- bio
- occupation
- company
- education
- heightCm
- religion
- drinking
- smoking
- workout
- relationship intent

Do not allow updating:

- userId
- completionScore
- isComplete

---

### Validation

Use DTOs.

Use ValidationPipe.

Validate:

- lengths
- enums
- optional fields

Follow the architecture document.

---

### Authentication

Protect every endpoint using:

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

- profile creation
- duplicate profile
- update
- invalid payload
- unauthorized request

---

## Out of Scope

Do NOT implement:

- photos
- interests
- prompts
- preferences
- uploads
- completion engine
- onboarding transitions
- profile verification

---

## Definition of Done

The task is complete only when:

- POST /profile works
- PATCH /profile/me works
- validation works
- duplicate profiles rejected
- tests pass
- build passes
- lint passes
- authentication continues working
- onboarding continues working

---

## Deliverables

- DTOs
- Controller updates
- Service updates
- Tests
- Updated project/PROGRESS.md