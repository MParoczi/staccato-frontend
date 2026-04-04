# Frontend Development Guidelines

YesAuto-generated from all feature plans. Last updated: 2026-04-04

## Active Technologies
- TypeScript 5.9+ with strict mode enabled + React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand 5, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod 4, react-i18next, @react-oauth/google, Lucide React (002-auth-token-management)
- N/A (frontend-only; access token in Zustand memory, refresh token in backend-managed HttpOnly cookie) (002-auth-token-management)
- TypeScript 5.9+ with strict mode enabled + React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand 5, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod, react-i18next, Lucide React (003-user-profile-settings)
- N/A (frontend-only; server state via TanStack Query cache, auth token in Zustand memory) (003-user-profile-settings)

- TypeScript 5.9+ with strict mode enabled + React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod, react-i18next, @microsoft/signalr, Lucide React (001-project-infra-setup)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

pnpm test; pnpm run lint

## Code Style

TypeScript 5.9+ with strict mode enabled: Follow standard conventions

## Recent Changes
- 003-user-profile-settings: Added TypeScript 5.9+ with strict mode enabled + React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand 5, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod, react-i18next, Lucide React
- 002-auth-token-management: Added TypeScript 5.9+ with strict mode enabled + React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand 5, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod 4, react-i18next, @react-oauth/google, Lucide React

- 001-project-infra-setup: Added TypeScript 5.9+ with strict mode enabled + React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod, react-i18next, @microsoft/signalr, Lucide React

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
