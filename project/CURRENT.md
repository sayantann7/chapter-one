# Current Task

## Feature

Profile Prompts

---

## Goal

Implement management of profile prompts and user responses.

The Prompt catalog is system-managed.

Users may answer up to three prompts from the catalog.

---

## Scope

### Prompt Catalog

GET /api/v1/profile/prompts

Return all active prompts grouped by category.

Catalog is read-only.

---

### User Prompt Responses

PUT /api/v1/profile/prompts

Replace the authenticated user's prompt responses.

Requirements:

- minimum 1 response
- maximum 3 responses
- prompt IDs must exist
- no duplicate prompt IDs
- answer length: 5–300 characters

Replace the entire set atomically.

---

### Validation

Validate:

- 1–3 responses
- unique prompt IDs
- valid prompt IDs
- answer length

---

### Authentication

Protect all endpoints with:

- JwtAuthGuard
- @CurrentUser()

---

### Swagger

Document all endpoints.

---

### Tests

Write:

- unit tests
- E2E tests

Cover:

- catalog retrieval
- successful replacement
- duplicate prompts
- invalid prompt IDs
- invalid answer lengths
- unauthorized access

---

## Out of Scope

Do NOT implement:

- AI prompt suggestions
- voice prompt answers
- completion engine
- matching
- embeddings

---

## Definition of Done

- catalog endpoint works
- replacement endpoint works
- validation enforced
- atomic replacement
- tests pass
- build passes
- lint passes

---

## Deliverables

- DTOs
- PromptService
- PromptRepository
- Controller updates
- Tests
- Updated project/PROGRESS.md