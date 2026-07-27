# Current Task

## Feature

Profile Completion Engine

---

## Goal

Implement a centralized service that evaluates profile completeness.

The engine computes completion percentage and determines whether the profile satisfies onboarding requirements.

---

## Scope

Create:

ProfileCompletionService

---

Implement:

GET /api/v1/profile/completion

Return:

- percentage
- completedSections
- missingSections
- isComplete

---

Sections

Evaluate:

- Basic Profile
- Photos
- Interests
- Prompts
- Preferences

Each section contributes to completion.

---

Rules

Example:

Basic Profile:
- firstName
- birthdate
- gender
- bio

Photos:
- minimum 2

Interests:
- minimum 3

Prompts:
- minimum 1

Preferences:
- always complete once defaults exist

---

Authentication

Protect endpoint.

---

Swagger

Document endpoint.

---

Tests

Write:

- unit tests
- E2E tests

Cover:

- empty profile
- partially complete
- fully complete
- unauthorized access

---

Out of Scope

Do NOT transition user status yet.

Do NOT update onboarding.

Do NOT modify profile automatically.

---

Definition of Done

- completion calculation works
- endpoint works
- tests pass
- build passes
- lint passes

---

Deliverables

- CompletionService
- Controller update
- Tests
- Updated project/PROGRESS.md