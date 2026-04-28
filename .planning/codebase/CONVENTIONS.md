# Coding Conventions

**Analysis Date:** 2026-04-28

## TypeScript

- **Strict mode** (`tsconfig.app.json`): `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`.
- **`verbatimModuleSyntax: true`** — type-only imports must use `import type { … }`.
- **`erasableSyntaxOnly: true`** — no `enum` (use `as const` unions), no namespaces, no parameter properties.
- **`moduleResolution: bundler`** + `allowImportingTsExtensions`.
- **Path alias**: `@/*` → `src/*` (TS, Vite, shadcn all aligned).
- Target: `ES2023`; Lib: `ES2023 + DOM + DOM.Iterable`; JSX: `react-jsx`.

## ESLint (`eslint.config.js`)

Flat config with:
- `@eslint/js` recommended
- `typescript-eslint` recommended
- `eslint-plugin-react-hooks` flat-recommended
- `eslint-plugin-react-refresh` (Vite)

Globally ignored: `dist`, `build`, `coverage`, `**/*.min.js`. Run via `pnpm run lint`.

> No `eslint-plugin-jsx-a11y` configured — a11y is enforced by review (see CONCERNS.md).

## Import Organization

Order (community convention, not enforced by plugin):
1. Node built-ins
2. External packages (`react`, `@tanstack/react-query`, `axios`, `zustand`, `zod`, `react-hook-form`, `i18next`, `react-router`)
3. Internal alias imports (`@/api/...`, `@/stores/...`, `@/lib/...`, `@/components/...`, `@/features/...`)
4. Relative imports (`./`, `../`)
5. Style/asset imports (`./styles.css`)

Use type-only imports where the import is types: `import type { AxiosError } from 'axios';` (required by `verbatimModuleSyntax`).

## Naming

| Kind                | Convention                       | Example                              |
|---------------------|----------------------------------|--------------------------------------|
| React components    | `PascalCase.tsx`                 | `LoginPage.tsx`, `AppSidebar.tsx`    |
| Hooks               | `useCamelCase.ts(x)`             | `useInstruments`, `useProactiveRefresh` |
| Zustand stores      | `camelCaseStore.ts`, `useXxxStore` hook | `authStore.ts` → `useAuthStore` |
| API modules         | `lowercase.ts`                   | `notebooks.ts`, `client.ts`          |
| Routes/layouts      | `kebab-case.tsx`                 | `protected-route.tsx`                |
| shadcn primitives   | `kebab-case.tsx` (shadcn default)| `dropdown-menu.tsx`                  |
| Constants           | `kebab-case.ts`                  | `notebook-colors.ts`                 |
| Tests               | `<subject>.test.ts(x)` co-located| `client.test.ts`                     |

Component prop types: `type FooProps = { … }`. Suffix with `Props`.

## Component Structure

- **Function components only.** Named exports preferred (default export only when a route file requires it).
- Body order: hooks → derived values → effects → handlers → JSX.
- Keep components ≲ 200 lines; split out subcomponents into the same folder.
- Minimal re-renders: select narrow slices from Zustand (`useAuthStore((s) => s.accessToken)`).

## State Patterns

### Zustand (`src/stores/`)

```ts
// Field-level selectors at call sites.
const accessToken = useAuthStore((s) => s.accessToken);
```

- One store per concern. Actions live inside the store object.
- **Never persist tokens.** `authStore` deliberately has no `persist` middleware.
- Imperative access from non-React code: `useAuthStore.getState()` (used in `apiClient` interceptors).

### TanStack Query

- Single `QueryClient` in `src/lib/query-client.ts`:
  - `staleTime: 0`
  - `gcTime: 300_000` (5 minutes)
  - `retry: shouldRetryQuery` — retries on **network errors and 5xx only**, max 3 attempts; **never on 4xx**.
  - `refetchOnWindowFocus: true`.
- Query keys are arrays, namespaced by domain, ordered general → specific:
  ```ts
  ['notebooks']
  ['notebooks', notebookId]
  ['lessons', lessonId, 'pages']
  ```
- Co-locate query/mutation hooks under `src/features/<feature>/hooks/use<Resource>.ts`.
- After mutations: `queryClient.invalidateQueries({ queryKey: [...] })` or `setQueryData` for optimistic updates.

### Axios

- Always import `apiClient` from `src/api/client.ts` (or `rawClient` from `raw-client.ts` for auth-exempt calls).
- Per-resource modules under `src/api/` export typed functions; no React.
- Auth header and `Accept-Language` are injected by interceptor — do **not** add them manually.

## Forms (RHF + Zod)

Schema-first; types are inferred:

```ts
// src/features/auth/schemas/login-schema.ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginValues = z.infer<typeof loginSchema>;
```

```ts
const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
```

Submit handlers wrap a TanStack `useMutation`. Errors surface via `form.setError` and/or `sonner` toasts.

## i18n

- Library: `i18next` + `react-i18next` + `i18next-browser-languagedetector`.
- Resources: `src/i18n/en.json`, `src/i18n/hu.json` (single `translation` namespace).
- **Key format:** dot-namespaced by feature → screen → concern, e.g. `notebooks.shell.index.pageNumber`, `auth.login.errors.invalidCredentials`, `common.actions.save`.
- All user-facing strings via `t(...)`. Add to `en.json` first, then mirror to `hu.json`.
- `keySeparator: '.'`, `interpolation.escapeValue: false` (React handles escaping).

## Tailwind v4 + shadcn/ui

- v4 CSS-first: theme tokens defined inside `src/index.css` (no `tailwind.config.js`).
- shadcn config: `style: "radix-nova"`, `baseColor: "neutral"`, `cssVariables: true`, `iconLibrary: "lucide"`.
- Composition helper: `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge). Always prefer `cn()` for conditional classes.
- Add primitives via `pnpm dlx shadcn@latest add <component>` — lands in `src/components/ui/`.

## Error Handling

- Transport errors: typed via `AxiosError`; do not `catch (e: any)`. Use a guard: `import { isAxiosError } from 'axios'`.
- Mutation errors: surfaced via `sonner` toast; **do not double-toast** (see `bug-audit-2026-04.md` Issue 2 — toast in hook OR component, never both).
- Page-level errors: `src/components/common/PageErrorBoundary.tsx`.
- Refresh failure: `silentRefresh` clears auth and rejects; `ProtectedRoute` does the navigation — **never** use `window.location.href` from API code (Issue 3).

## Logging

- `console.error` / `console.warn` only (interceptors, error boundaries).
- Avoid `console.log` in committed code.

## File / Module Design

- One primary export per file; co-located helpers may stay un-exported.
- No barrel files except in `src/lib/types/index.ts` and `src/lib/constants/index.ts` (curated).
- Keep `src/api/<resource>.ts` React-free.
- Keep `src/stores/<x>Store.ts` network-free (delegate to `src/api/`).

## Cross-Feature Boundaries

- `src/features/auth` ⇒ `src/features/notebooks` is **forbidden**. If shared code is needed, push it down to `src/components/`, `src/lib/`, `src/hooks/`, or `src/stores/`.
- API modules (`src/api/`) and lib (`src/lib/`) may be imported by any feature.

## Speckit Workflow

- Feature work proceeds through specs in `specs/NNN-<slug>/` (`spec.md`, `plan.md`, `tasks.md`, `contracts/`, `checklists/`).
- See `CLAUDE.md` for the canonical guidance and the `<!-- SPECKIT START -->` block in `.github/copilot-instructions.md`.

## Testing Discipline

- `pnpm test` runs Vitest.
- Tests are co-located: `<file>.test.ts(x)` next to source. Existing examples: `src/api/{client,modules,notebooks,presets}.test.ts`, `src/stores/{authStore,uiStore}.test.ts`, `src/lib/{query-client,utils/user-display}.test.ts`, `src/routes/{notebook-layout,protected-route}.test.tsx`, `src/components/layout/{AppSidebar,UserMenu}.test.tsx`, `src/components/common/DottedPaper.test.tsx`.
- See `TESTING.md`.

