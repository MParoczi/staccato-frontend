# Testing

**Analysis Date:** 2026-04-28

## Framework

- **Vitest 4.1** — runner. Configured inside `vite.config.ts` `test` block:
  - `environment: 'jsdom'`
  - `globals: true` (use `describe`/`it`/`expect` without imports)
  - `setupFiles: ['./src/test-setup.ts']`
- **Setup file** `src/test-setup.ts`:
  ```ts
  import '@testing-library/jest-dom/vitest';
  ```
  (Single line; jest-dom matchers only. No global mocks, no MSW server start.)

- **Libraries:**
  - `@testing-library/react` — `render`, `screen`, `within`
  - `@testing-library/jest-dom` (`/vitest` entry)
  - `jsdom@^29` — DOM environment
  - `msw@^2.12` — installed but **no handlers defined yet**; HTTP mocking currently done via `vi.mock('@/api/...')`

- **Commands** (`package.json` + `CLAUDE.md`):
  ```
  pnpm test          # vitest run
  pnpm run lint      # eslint .
  ```

## Test File Inventory (current)

Co-located beside source. Discovered files:

| Area              | Files                                                                                   |
|-------------------|-----------------------------------------------------------------------------------------|
| `src/api/`        | `client.test.ts`, `modules.test.ts`, `notebooks.test.ts`, `presets.test.ts` (4)         |
| `src/stores/`     | `authStore.test.ts`, `uiStore.test.ts` (2)                                              |
| `src/lib/`        | `query-client.test.ts`, `utils/user-display.test.ts` (2)                                |
| `src/routes/`     | `notebook-layout.test.tsx`, `protected-route.test.tsx` (2)                              |
| `src/components/` | `layout/AppSidebar.test.tsx`, `layout/UserMenu.test.tsx`, `common/DottedPaper.test.tsx` (3) |
| `src/features/`   | none yet                                                                                |
| `src/i18n/`       | none                                                                                    |
| `src/hooks/`      | none                                                                                    |

**Total:** 13 test files. **Coverage gap:** the entire `src/features/*` tree has zero co-located tests — a high-value surface (auth flow, notebook shell, profile, styling).

To refresh inventory:

```powershell
Get-ChildItem -Recurse -Path src -Include *.test.ts,*.test.tsx | Select-Object FullName
```

## Test Structure (canonical)

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the user name', () => {
    render(<UserCard user={{ id: '1', name: 'Ada' }} />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });
});
```

- One `describe` per unit; `it('does X when Y')` reads as behavior.
- Prefer `getByRole` / `getByLabelText` / `findByText` over `getByTestId`.
- Reset mocks in `beforeEach`.

## Hook Testing

```ts
import { renderHook, act } from '@testing-library/react';

const { result } = renderHook(() => useCounter());
act(() => result.current.increment());
expect(result.current.count).toBe(1);
```

For hooks needing `QueryClientProvider`: wrap in a `wrapper` with a fresh `QueryClient`:
```ts
new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
```

## Mocking Patterns

### Module mocks (current style — see `src/api/client.test.ts`)
```ts
vi.mock('@/stores/authStore', () => ({
  useAuthStore: { getState: vi.fn(() => ({ accessToken: 'abc', isLoggingOut: false })) },
}));
```

### Spies
```ts
const setAuthSpy = vi.spyOn(useAuthStore.getState(), 'setAuth');
```

### Env stubs
```ts
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000');
```

### Network
- **Today:** `vi.mock('@/api/<resource>')` or mock `axios` directly.
- **Future (recommended):** wire MSW handlers via `setupServer()` in `src/test-setup.ts` to test through the real Axios interceptors. The `msw` dependency is already installed.

### Zustand reset
```ts
beforeEach(() => useAuthStore.setState(useAuthStore.getInitialState(), true));
```

### TanStack Query
- New `QueryClient` per test with `retry: false`, `gcTime: 0`.
- Test query/mutation hooks via `renderHook` with the QC provider.

### i18n
- `src/i18n/index.ts` is side-effect-loaded; if a test renders a translated component, either:
  - import `@/i18n` once in `test-setup.ts` (currently not done), or
  - mock `useTranslation` to return `(key) => key`.

## What to Mock vs Not

**Do mock:** network (`@/api/...`), `useAuthStore` boundaries, time (`vi.useFakeTimers()`), `localStorage` if necessary.
**Do not mock:** internal pure utilities, Zod schemas, `cn()`, your own components in integration tests.

## Coverage Gaps (verified from inventory)

| Surface                                              | Gap        | Why it matters                                         |
|------------------------------------------------------|------------|--------------------------------------------------------|
| `src/features/auth/`                                 | No tests   | Login/register/refresh flows are critical paths        |
| `src/features/notebooks/`                            | No tests   | Owns the canvas, page sequence, dialogs (open issues)  |
| `src/features/profile/`                              | No tests   | Issue 7 (language switch overwrites name) lives here   |
| `src/features/styling/`                              | No tests   | Spec 007 active surface                                |
| `src/api/raw-client.ts`                              | No test    | Used by refresh path                                   |
| `src/api/{auth,chords,exports,instruments,lessons,pages,users}.ts` | No tests | Several resource clients untested        |
| `src/i18n/`, `src/hooks/`                            | No tests   | Smaller surface but still untested                     |

## Coverage Reporting

- Provider not yet configured. Add `@vitest/coverage-v8` and `coverage` block in `vite.config.ts` `test` to enforce thresholds (suggested: 60 % lines initially, raise as features land).
- Suggested excludes: `src/main.tsx`, `src/components/ui/**`, `**/*.d.ts`.

## Common Patterns

**Async finds:**
```ts
expect(await screen.findByRole('heading', { name: /profile/i })).toBeInTheDocument();
```

**Form testing (RHF + Zod):**
```ts
await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email');
await userEvent.click(screen.getByRole('button', { name: /submit/i }));
expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
```

**Error path:**
```ts
await expect(loadUser('bad-id')).rejects.toThrow();
```

## E2E

Not present. If end-to-end coverage is required (login → notebook → logout), add Playwright in a sibling `e2e/` folder — out of scope for the Vitest config.

