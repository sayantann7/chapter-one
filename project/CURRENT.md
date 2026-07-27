# Current Task

## Feature

Profile Photos

---

## Goal

Implement profile photo management.

This feature allows authenticated users to manage their profile photo gallery.

File upload implementation is NOT part of this task.

Assume image URLs already exist.

---

## Scope

### Create Photo

POST /api/v1/profile/photos

Body:

- url
- thumbnailUrl (optional)
- blurHash (optional)

Assign displayOrder automatically.

Reject more than six photos.

---

### Delete Photo

DELETE /api/v1/profile/photos/:photoId

Delete only photos owned by the authenticated user.

Reorder remaining photos.

---

### Reorder Photos

PUT /api/v1/profile/photos/reorder

Accept ordered list of photo IDs.

Validate ownership.

Update displayOrder.

---

### Validation

Maximum:

- 6 photos

Minimum validation will be added later by the completion engine.

---

### Authentication

Use:

- JwtAuthGuard
- @CurrentUser()

---

### Swagger

Document all endpoints.

---

### Tests

Unit tests.

E2E tests.

Cover:

- upload metadata
- delete
- reorder
- unauthorized access
- ownership validation
- max photo limit

---

## Out of Scope

Do NOT implement:

- multipart uploads
- S3
- Cloudflare R2
- image resizing
- moderation
- AI
- completion engine
- blur generation

---

## Definition of Done

- create photo works
- delete works
- reorder works
- max 6 enforced
- ownership enforced
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