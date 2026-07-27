# Current Task

## Feature

Authentication Infrastructure

---

## Goal

Implement the shared authentication infrastructure required by all authenticated endpoints.

This feature establishes JWT authentication across the application and provides the reusable components that every protected API will rely on.

---

## Scope

Implement ONLY the authentication infrastructure.

This includes:

### JWT Strategy

- Validate JWT signatures
- Validate expiration
- Validate issuer
- Validate audience
- Load authenticated user from database
- Reject deleted users
- Reject invalid tokens

---

### JWT Authentication Guard

Create a reusable JwtAuthGuard for protecting authenticated routes.

---

### Current User Decorator

Create a strongly typed @CurrentUser() decorator that injects the authenticated user into controllers.

---

### Swagger

Configure Bearer Authentication globally.

Protected endpoints should automatically display the authorization requirement.

---

### Testing

Write:

- Unit tests
- Integration (E2E) tests

---

## Out of Scope

Do NOT implement:

- /auth/me
- Logout
- Password Reset
- OAuth
- RolesGuard
- UserStatusGuard
- Rate Limiting
- Profile APIs

---

## Requirements

This feature must introduce reusable authentication infrastructure only.

Do not introduce authorization logic.

Do not modify existing authentication endpoints.

---

## Definition of Done

The task is complete only when:

- JwtStrategy validates JWTs correctly
- JwtAuthGuard protects endpoints
- @CurrentUser() works correctly
- Invalid JWTs return 401
- Missing JWTs return 401
- Expired JWTs return 401
- Deleted users cannot authenticate
- Swagger supports Bearer Authentication
- Unit tests pass
- Integration tests pass
- Build passes
- Lint passes
- No TypeScript errors exist

---

## Deliverables

- JwtStrategy
- JwtAuthGuard
- CurrentUser decorator
- Swagger Bearer configuration
- Tests
- Updated project/PROGRESS.md

Do not implement anything outside this scope.