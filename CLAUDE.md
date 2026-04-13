# Frontend Development Guidelines

YesAuto-generated from all feature plans. Last updated: 2026-04-06

## Active Technologies
- TypeScript 5.9+ with strict mode enabled + React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand 5, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod 4, react-i18next, @react-oauth/google, Lucide React (002-auth-token-management)
- N/A (frontend-only; access token in Zustand memory, refresh token in backend-managed HttpOnly cookie) (002-auth-token-management)
- TypeScript 5.9+ with strict mode enabled + React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand 5, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod, react-i18next, Lucide React (003-user-profile-settings)
- N/A (frontend-only; server state via TanStack Query cache, auth token in Zustand memory) (003-user-profile-settings)
- TypeScript 5.9+ with strict mode + React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand 5, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod, react-i18next, Lucide React (005-notebook-shell-navigation)
- N/A (frontend-only; server state via TanStack Query cache, zoom in Zustand) (005-notebook-shell-navigation)
- TypeScript 5.9+ with strict mode + React 19, Vite 8, Tailwind CSS v4, shadcn/ui (via unified `radix-ui` package), TanStack Query v5, React Router v7, Axios, react-i18next, Lucide React (006-app-nav-sidebar)
- N/A (frontend-only; user display projection comes from the existing `['user', 'profile']` TanStack Query cache; no new client state) (006-app-nav-sidebar)

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
- 006-app-nav-sidebar: Added TypeScript 5.9+ with strict mode + React 19, Vite 8, Tailwind CSS v4, shadcn/ui (via unified `radix-ui` package), TanStack Query v5, React Router v7, Axios, react-i18next, Lucide React
- 005-notebook-shell-navigation: Added TypeScript 5.9+ with strict mode + React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand 5, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod, react-i18next, Lucide React
- 004-notebook-dashboard: Added TypeScript 5.9+ with strict mode enabled + React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand 5, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod, react-i18next, Lucide React


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
