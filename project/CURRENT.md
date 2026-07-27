# Current Task

## Feature

Refresh Token Infrastructure

---

## Goal

Implement secure refresh token generation and storage to enable long-lived authenticated sessions.

This task introduces refresh tokens but does NOT yet implement logout.

---

## Scope

Implement ONLY the refresh token infrastructure.

This includes:

- Create TokenService
- Move JWT generation out of AuthService
- Generate access tokens
- Generate refresh tokens
- Generate token family IDs
- Generate token IDs (JTI)
- Store refresh token metadata in Redis
- Update login endpoint to return both tokens
- Swagger documentation
- Unit tests
- Integration tests

---

## Out of Scope

Do NOT implement:

- Refresh endpoint
- Logout
- Token rotation
- Password reset
- OAuth
- Session invalidation
- /auth/me

---

## Definition of Done

The task is complete only when:

- TokenService exists
- AuthService no longer signs JWTs directly
- Login returns access token and refresh token
- Refresh token metadata is stored in Redis
- JWT payload follows authentication-design.md
- Swagger documentation updated
- Unit tests pass
- Integration tests pass
- Build passes
- Lint passes

---

## Deliverables

- TokenService
- Redis session storage
- Login updates
- Tests
- Updated project/PROGRESS.md

Do not implement features outside this scope.