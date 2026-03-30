# Quickstart: Project Infrastructure Setup

**Branch**: `001-project-infra-setup` | **Date**: 2026-03-30

## Prerequisites

- Node.js LTS (20+)
- pnpm

## Getting Started

```bash
# Clone and checkout the feature branch
git clone <repo-url>
cd Frontend
git checkout 001-project-infra-setup

# Install dependencies
pnpm install

# Copy environment config
cp .env.example .env

# Edit .env with your values:
#   VITE_API_BASE_URL=http://localhost:5000
#   VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Start dev server
pnpm run dev
```

The app should start at `http://localhost:5173`.

## Key Paths

| What | Where |
|------|-------|
| Axios instance (main) | `src/api/client.ts` |
| Axios instance (refresh) | `src/api/raw-client.ts` |
| API function modules | `src/api/*.ts` |
| Auth store | `src/stores/authStore.ts` |
| UI store | `src/stores/uiStore.ts` |
| TanStack Query client | `src/lib/query-client.ts` |
| Shared types | `src/lib/types/index.ts` (barrel) |
| Constants | `src/lib/constants/index.ts` (barrel) |
| Route definitions | `src/routes/index.tsx` |
| Protected route guard | `src/routes/protected-route.tsx` |
| i18n config | `src/i18n/index.ts` |
| Translations (EN) | `src/i18n/en.json` |
| Translations (HU) | `src/i18n/hu.json` |
| Tailwind theme (CSS vars) | `src/index.css` |
| shadcn components | `src/components/ui/` |
| shadcn config | `components.json` |
| cn() utility | `src/lib/utils.ts` |

## How to Import Shared Types

```typescript
import { NotebookSummary, ModuleType, PageSize } from '@/lib/types';
import { PAGE_SIZE_DIMENSIONS, MODULE_MIN_SIZES } from '@/lib/constants';
```

The `@/` alias resolves to `src/`.

## How to Make API Calls

All API calls go through typed functions in `src/api/`:

```typescript
import { getNotebooks } from '@/api/notebooks';

// In a TanStack Query hook:
const { data } = useQuery({
  queryKey: ['notebooks'],
  queryFn: getNotebooks,
});
```

Never import `client.ts` directly in components — use the domain-specific API modules.

## How to Use Translations

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('notebooks.dashboard.title')}</h1>;
}
```

Keys are namespaced by feature: `auth.*`, `notebooks.*`, `editor.*`, `chords.*`, `exports.*`, `profile.*`, `common.*`.

## How to Use Stores

```typescript
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

function MyComponent() {
  const token = useAuthStore((s) => s.accessToken);
  const { sidebarOpen, setSidebarOpen } = useUIStore();
}
```

## How to Use shadcn/ui Components

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="secondary">Cancel</Button>
      </CardContent>
    </Card>
  );
}
```

All components render in the earthy theme automatically.

## Route Structure

| Path | Type | Description |
|------|------|-------------|
| `/` | Redirect | → `/app/notebooks` (auth) or `/login` (no auth) |
| `/login` | Public | Login page |
| `/register` | Public | Registration page |
| `/app/notebooks` | Protected | Dashboard |
| `/app/notebooks/new` | Protected | Create notebook |
| `/app/notebooks/:notebookId` | Protected | Notebook cover view |
| `/app/notebooks/:notebookId/index` | Protected | Notebook index page |
| `/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId` | Protected | Page editor |
| `/app/profile` | Protected | User settings |
| `/app/exports` | Protected | Export history |
| `/app/chords` | Protected | Chord library |

Protected routes redirect to `/login` if not authenticated. On page reload, the `ProtectedRoute` guard attempts a silent token refresh before redirecting.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
