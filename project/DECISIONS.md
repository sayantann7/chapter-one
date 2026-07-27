# Architecture Decisions

## Backend

NestJS

Reason:
Modular architecture, strong TypeScript support, scalable for long-term development.

---

## Frontend

Next.js

Reason:
Fast development, modern React ecosystem, excellent developer experience.

---

## Mobile

React Native (Expo)

Reason:
Single cross-platform codebase for Android and iOS.

---

## Database

PostgreSQL

Reason:
Reliable relational database with excellent Prisma support.

---

## ORM

Prisma

Reason:
Excellent TypeScript integration and migration tooling.

---

## Cache

Redis

Reason:
Realtime features, caching, and session management.

---

## Storage

Cloudflare R2

Reason:
Cost-effective object storage.

---

## Authentication

Supabase Auth

Reason:
Rapid MVP development with secure authentication.

---

## AI

OpenAI API

Reason:
Conversation moderation and AI-powered features.

---

## Deployment

Docker + Coolify

Reason:
Simple deployments during MVP stage.

---

## Architecture

Modular Monolith

Reason:
Avoid premature complexity.

Microservices will only be considered when scaling requires them.

---

## API Style

REST

Reason:
Simple, predictable, and sufficient for MVP.