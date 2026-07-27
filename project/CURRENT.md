# Current Task

## Feature

Profile Database Schema

---

## Goal

Implement the Profile domain database schema based on the approved architecture document.

This task is limited to database modeling only.

No business logic, controllers, services, DTOs, or APIs should be implemented.

The objective is to establish a clean, scalable database foundation for the Profile domain.

---

## Scope

Implement ONLY the database schema.

### Profile

Create the Profile model.

Include only the fields approved in the architecture document.

Keep authentication data inside the existing User model.

---

### ProfilePhoto

Create the ProfilePhoto model.

Support:

- multiple photos
- ordering
- moderation status
- blur hash

Do not implement uploads.

---

### Interest

Create the Interest catalog model.

System-managed only.

---

### ProfileInterest

Create the junction table.

Support many-to-many relationships.

---

### Prompt

Create the Prompt catalog model.

System-managed only.

---

### ProfilePrompt

Create the user's prompt response model.

Do not implement prompt APIs.

---

### Preference

Create the Preference model.

Keep discovery preferences separate from Profile.

---

### ProfileVerification

Create the ProfileVerification model.

Do not implement verification logic.

---

### Enums

Implement the approved enums.

Only include enums that are required for the schema.

---

### Relationships

Implement all foreign keys.

Implement indexes.

Implement unique constraints.

Implement cascade behavior where appropriate.

---

## Out of Scope

Do NOT implement:

- Controllers
- Services
- DTOs
- APIs
- Validation
- Profile completion engine
- File uploads
- Voice intro uploads
- Matching
- Discovery
- AI
- Moderation logic
- Background jobs

---

## Requirements

Generate a Prisma migration.

Generate Prisma Client.

Ensure schema formatting passes.

Ensure migrations apply successfully.

---

## Definition of Done

The task is complete only when:

- Schema compiles
- Prisma format passes
- Prisma generate passes
- Prisma migrate succeeds
- Database reflects the new models
- Existing authentication tables remain intact
- Existing onboarding continues working
- Build passes
- Lint passes
- Existing unit tests pass
- Existing E2E tests pass

---

## Deliverables

- Updated schema.prisma
- Prisma migration
- Generated Prisma Client
- Updated project/PROGRESS.md

No application code should be added.