# Current Task

## Feature

Profile Interests

---

## Goal

Implement user interest management using the existing Interest catalog and ProfileInterest junction table.

The Interest catalog is system-managed.

Users may only select interests from the catalog.

---

## Scope

### Catalog

GET /api/v1/profile/interests

Return all active interests grouped by category.

Catalog is read-only.

---

### User Interests

PUT /api/v1/profile/interests

Replace the authenticated user's selected interests.

Requirements:

- minimum 3 interests
- maximum 10 interests
- IDs must exist
- no duplicates

Replace the entire selection atomically.

---

### Validation

Enforce:

- 3–10 selections
- unique IDs
- valid Interest IDs

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

- list catalog
- update interests
- invalid IDs
- duplicate IDs
- too few
- too many
- unauthorized access

---

## Out of Scope

Do NOT implement:

- recommendations
- matching
- embeddings
- completion engine
- AI
- discovery ranking

---

## Definition of Done

- catalog endpoint works
- update endpoint works
- validation enforced
- atomic replacement
- tests pass
- build passes
- lint passes

---

## Deliverables

- DTOs
- Controller updates
- Service updates
- Tests
- Updated project/PROGRESS.md