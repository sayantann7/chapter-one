# AGENTS.md

## Overview

This repository contains the source code for **Chapter One**, a relationship-first dating platform.

The product vision, requirements, and architecture are documented inside the `docs/` directory.

Before doing any work, you MUST read the project state files.

Required reading order:

1. README.md
2. docs/vision.pdf
3. docs/prd.pdf
4. docs/system-design.pdf
5. project/DECISIONS.md
6. project/FEATURES.md
7. project/PROGRESS.md
8. project/CURRENT.md

---

# Rules

## 1. Work on ONE task only.

Only implement the feature described in `project/CURRENT.md`.

Do not begin another feature.

Do not perform unrelated refactors.

---

## 2. Respect architectural decisions.

Do not override decisions documented inside `project/DECISIONS.md`.

If a better approach exists, document it instead of silently changing architecture.

---

## 3. Keep the repository as the source of truth.

Never rely on previous conversations.

All important decisions must exist inside this repository.

---

## 4. Verify before declaring completion.

A task is NOT complete until verification succeeds.

Always run applicable verification commands.

Examples include:

- Build
- Type checking
- Lint
- Tests

If the application can be started, start it.

Never claim success based only on static reasoning.

---

## 5. Update project state.

After completing work, update:

- project/PROGRESS.md

Only update other project files if explicitly required.

---

## 6. Keep scope small.

Prefer one completed feature over several partially completed ones.

Do not implement future roadmap items.

---

## Expected Output

When a task is finished, provide:

### Completed

- What was implemented

### Verification

- Commands executed
- Results

### Files Changed

- List of modified files

### Remaining Work

- Anything still pending

Do not simply say "Done."