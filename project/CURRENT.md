# Current Task

## Feature

Authentication Architecture Refactor

---

## Goal

Improve the internal architecture of the authentication module without changing any public API behavior.

This is a refactoring task only. Existing authentication endpoints and responses must continue to work exactly as they do today.

---

## Scope

Implement ONLY the following architectural improvements.

### 1. SessionService

Create a dedicated SessionService responsible for all session persistence.

Move all Redis session operations out of TokenService.

SessionService should own:

- Create session
- Retrieve session
- Update session
- Delete session
- Delete all sessions for a user
- Session TTL management

---

### 2. TokenService Refactor

TokenService should ONLY be responsible for:

- Creating access tokens
- Creating refresh tokens
- Verifying JWTs
- Decoding JWTs
- Creating token identifiers

It must NOT communicate directly with Redis.

---

### 3. Typed JWT Payloads

Introduce strongly typed payload interfaces.

Examples:

- AccessTokenPayload
- RefreshTokenPayload

Replace inline payload objects throughout the authentication module.

---

### 4. Configuration Cleanup

Move all authentication configuration into ConfigService.

Do not hardcode:

- Access token expiration
- Refresh token expiration
- JWT issuer
- JWT audience

Read these from environment variables.

---

### 5. Internal Cleanup

Remove duplicated authentication logic where appropriate.

Improve naming consistency.

Improve dependency injection where appropriate.

---

## Out of Scope

Do NOT implement:

- Opaque refresh tokens
- Refresh token hashing
- Replay attack detection
- Session family invalidation
- Logout
- Password reset
- OAuth
- Authentication Guards
- /auth/me

---

## Requirements

This is a refactor.

There must be **NO breaking API changes.**

Existing endpoints must continue working exactly as before.

No request or response contracts should change.

---

## Definition of Done

The task is complete only when:

- SessionService exists
- TokenService no longer communicates with Redis
- JWT payloads are strongly typed
- Authentication configuration uses ConfigService
- Existing endpoints behave identically
- Existing unit tests still pass
- Existing E2E tests still pass
- Build passes
- Lint passes
- No TypeScript errors exist

---

## Deliverables

- SessionService
- Refactored TokenService
- Typed JWT payloads
- Config improvements
- Updated project/PROGRESS.md

Do not implement anything outside this scope.