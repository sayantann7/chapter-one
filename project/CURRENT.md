# Current Task

## Feature

Profile Architecture Refactor

---

## Goal

Refactor the Profile module to improve maintainability before implementing the remaining profile features.

This is an internal architectural improvement.

No external API behavior should change.

---

## Scope

### Service Split

Extract responsibilities into dedicated services:

- ProfileService
- PhotoService
- InterestService

Each service should own only its corresponding business logic.

---

### Repository Layer

Introduce repositories:

- ProfileRepository
- PhotoRepository
- InterestRepository

Move all Prisma access into repositories.

Services should no longer access Prisma directly.

---

### Dependency Injection

Register repositories and services using NestJS dependency injection.

---

### Backward Compatibility

Controllers should continue exposing the exact same API.

No request or response contracts should change.

---

## Out of Scope

Do NOT implement:

- prompts
- preferences
- completion engine
- onboarding changes
- matching
- discovery
- AI

---

## Definition of Done

- Prisma accessed only through repositories
- Services have single responsibility
- Controllers unchanged
- All tests pass
- Build passes
- Lint passes
- No API behavior changes

---

## Deliverables

- Repository classes
- Refactored services
- Updated dependency injection
- Updated tests if required
- Updated project/PROGRESS.md