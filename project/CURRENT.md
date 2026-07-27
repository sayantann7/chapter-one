# Current Task

## Feature

Account Verification

---

## Goal

Implement the account verification flow for newly registered users.

This task completes the user registration journey by allowing users to verify the code generated during registration.

---

## Scope

Implement ONLY the account verification feature.

This includes:

- Verify 6-digit verification code
- Validate expiration
- Validate incorrect codes
- Prevent code reuse
- Update user status from UNVERIFIED to PENDING_ONBOARDING
- Remove verification code from Redis after successful verification
- Return success response

---

## Out of Scope

Do NOT implement:

- Login
- JWT generation
- Refresh Tokens
- Logout
- Password Reset
- OAuth
- Profile Creation
- Matching
- Government Verification

---

## Definition of Done

The task is complete only when:

- Verification endpoint works correctly
- Invalid codes are rejected
- Expired codes are rejected
- Used codes cannot be reused
- User status updates correctly
- Redis cleanup works
- Swagger documentation updated
- Unit tests pass
- Integration tests pass
- Build passes
- Lint passes
- No TypeScript errors exist

---

## Deliverables

- Verification endpoint
- DTOs
- Services
- Tests
- Updated project/PROGRESS.md

Do not implement features outside this scope.