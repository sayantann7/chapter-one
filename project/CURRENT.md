# Current Task

## Feature

User Login

---

## Goal

Implement secure user authentication for verified users.

This task allows users to log in using their email and password and receive an access token.

---

## Scope

Implement ONLY the login functionality.

This includes:

- Login DTO
- Email lookup
- Password verification using Argon2id
- Reject invalid credentials
- Reject unverified users
- Reject suspended/deactivated users
- JWT access token generation
- Standardized login response
- Swagger documentation
- Unit tests
- Integration tests

---

## Out of Scope

Do NOT implement:

- Refresh Tokens
- Refresh Token Rotation
- Logout
- Password Reset
- OAuth
- Session Management
- /auth/me
- Profile Creation

---

## Definition of Done

The task is complete only when:

- Verified users can log in
- Password verification works correctly
- Invalid credentials return 401 Unauthorized
- Unverified users cannot log in
- Suspended users cannot log in
- JWT access token is generated correctly
- Swagger documentation is updated
- Unit tests pass
- Integration tests pass
- Build passes
- Lint passes
- No TypeScript errors exist

---

## Deliverables

- Login endpoint
- JWT configuration
- Login DTO
- Services
- Tests
- Updated project/PROGRESS.md

Do not implement features outside this scope.