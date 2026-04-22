# Bug Audit — April 2026

Issues below are formatted for the `bug-fixing` agent (see `.github/agents/bug-fixing.agent.md`). Each issue is self-contained: reproduction steps, root cause hypothesis, and expected behavior. All fixes must be frontend-only, must not add new dependencies, and must pass `pnpm test` and `pnpm run lint`.

---

## Issue 1 — Lesson page prev/next and keyboard navigation are broken

**Labels:** `bug`, `area:notebook-shell`, `priority:critical`

### Summary

Within an open notebook, the prev/next arrows (`PageNavigationArrows`) and keyboard arrow-key navigation (`useKeyboardNavigation`) never move between lesson pages. On lesson pages the toolbar's global page number also stops updating.

### Reproduction

1. Open a notebook that contains a lesson with ≥ 2 pages.
2. Click the lesson in the sidebar to land on page 1.
3. Click the right-arrow button in the canvas overlay or press `ArrowRight`.
4. Observe: nothing navigates, or the URL changes to something like `/app/notebooks/:id/lessons/:lessonId/pages/2` and the page renders the "page not found" fallback from `LessonPage`.

### Root cause

`src/features/notebooks/utils/page-sequence.ts` builds lesson URLs using `pageNumberInLesson` (a 1-based index) instead of the real page id:

```ts
url: `${basePath}/lessons/${entry.lessonId}/pages/${page}`, // `page` = 1..N, not a UUID
```

But:

- The route (`src/routes/index.tsx`) resolves `:pageId` to the real id.
- `LessonPage` looks up pages by `p.id === pageId`.
- `NotebookSidebar`, `useCreatePage`, `useDeletePage` all navigate with real page ids.
- `usePageNavigation` compares `url.endsWith('/pages/${pageId}')` against these index-based URLs, so it never finds the current page and returns `null` prev/next.

### Expected

Prev/next arrows and `ArrowLeft` / `ArrowRight` keys navigate across pages within a lesson and across lesson boundaries. Global page number updates correctly on lesson pages.

### Hints for the fix

- Extend `buildPageSequence` to accept real page ids (e.g., take `LessonDetail[]` or a `lessonId -> pageIds[]` map) and emit `/pages/${pageId}` URLs.
- Surface page ids through the hooks feeding `NotebookLayout` (e.g., hydrate via `useLesson` per lesson, or have `usePageNavigation` prefetch the lessons it needs).
- Update `page-sequence.test.ts` with the new contract and add a regression test that `usePageNavigation` returns non-null `prevUrl`/`nextUrl` when standing on a middle lesson page.

### Acceptance

- [ ] Prev/next buttons and arrow keys navigate within a lesson.
- [ ] Navigation crosses lesson boundaries and to/from the index page.
- [ ] Global page number badge in `NotebookToolbar` updates on every page change.
- [ ] New/updated unit tests cover ID-based URL generation and the prev/next resolution.

### Scope notes

- Frontend-only fix preferred. If the backend response needs to include page ids in `NotebookIndex` or `LessonSummary` to avoid N per-lesson fetches, leave a comment on the issue rather than opening a PR and flag it as a backend coordination item.

---

## Issue 2 — Delete-page error shows two toasts

**Labels:** `bug`, `area:notebook-shell`, `priority:low`

### Summary

Failing to delete a page fires two destructive toasts stacked on top of each other.

### Reproduction

1. Open a lesson page.
2. Simulate a delete failure (e.g., throttle network or have the backend return 500 on `DELETE /lessons/:lessonId/pages/:pageId`).
3. Click the trash icon, confirm.
4. Observe: two error toasts.

### Root cause

`useDeletePage` already toasts in its own `onError` (including the `LAST_PAGE_DELETION` branch). `DeletePageButton.handleConfirm` passes a second `onError` that toasts again.

### Expected

Exactly one toast per failed deletion.

### Hints for the fix

- Drop the inline `onError` toast in `src/features/notebooks/components/DeletePageButton.tsx` and rely on the hook.
- Add a unit test that mocks the mutation rejection and asserts `toast.error` is called once.

### Acceptance

- [ ] Only one toast shown on delete failure.
- [ ] Last-page deletion (422 `LAST_PAGE_DELETION`) still shows the specific message.
- [ ] Regression test added.

---

## Issue 3 — `silentRefresh` hard-redirects via `window.location.href`

**Labels:** `bug`, `area:auth`, `priority:medium`

### Summary

When the refresh token call fails, `silentRefresh` does `window.location.href = '/login'`. This bypasses the React Router runtime, does a full page reload, and can interrupt the login page itself.

### Reproduction

1. Be logged in, then invalidate the refresh cookie (or stop the backend).
2. Trigger any authenticated request.
3. Observe a full page reload to `/login` instead of an SPA navigation. Any in-progress UI state is lost.

### Root cause

`src/api/client.ts` in `silentRefresh` calls `window.location.href = '/login'` in the `.catch`. `ProtectedRoute` already handles "refresh failed" by rendering `<Navigate to="/login" />`, so the hard redirect is both redundant and harmful.

### Expected

On refresh failure:
1. `authStore.clearAuth()` runs.
2. `ProtectedRoute` redirects to `/login` via the router.
3. No full page reload.

### Hints for the fix

- Remove the `window.location.href` line; keep `clearAuth()` and reject the promise.
- Confirm `ProtectedRoute` still redirects to `/login` when `status === 'failed'`.
- Add a test that asserts `window.location.assign`/`href` is not called on refresh failure and the auth store is cleared.

### Acceptance

- [ ] No full page reloads on 401/refresh failure.
- [ ] User lands on `/login` via SPA navigation, preserving `from` location in route state.
- [ ] Unit test covers the refresh-failure path.

---

## Issue 4 — `useProactiveRefresh` swallows unhandled promise rejections

**Labels:** `bug`, `area:auth`, `priority:low`

### Summary

The proactive refresh timer calls `silentRefresh()` and ignores its return value. When the refresh rejects, an "Unhandled Promise Rejection" is logged in the console.

### Root cause

`src/features/auth/hooks/useProactiveRefresh.ts`:

```ts
setTimeout(() => {
  silentRefresh();
}, delay);
```

No `.catch`, no `void`. The catch-all in `silentRefresh` rejects for the caller.

### Expected

Rejections are handled quietly; the normal `ProtectedRoute` flow takes over on the next request.

### Hints for the fix

- `silentRefresh().catch(() => {});` (or wrap with `void`).
- Add a test that rejects and asserts no unhandled rejection is raised.

### Acceptance

- [ ] No unhandled rejection warning on proactive refresh failure.
- [ ] Regression test added.

---

## Issue 5 — `ProtectedRoute` has an unreachable fallback that can render with no token

**Labels:** `bug`, `area:auth`, `priority:low`

### Summary

`ProtectedRoute` ends with `return <Outlet />;` after all other branches. In the rare state (no `accessToken`, not logging out, `status === 'idle'`), it would render protected content unauthenticated.

### Root cause

`src/routes/protected-route.tsx` initializes `status = accessToken ? 'idle' : 'refreshing'`. If `accessToken` is cleared while `status` is still `'idle'` (e.g., race during logout completion), the final `return <Outlet />` leaks through.

### Expected

When there is no access token, the route either shows the loader (refreshing) or redirects to `/login`. Never renders protected content.

### Hints for the fix

- Remove the trailing `return <Outlet />` or replace with an explicit `<Navigate to="/login" replace />` fallback.
- Add a test that starts with no token, `status='idle'`, and asserts a redirect (not `<Outlet />`).

### Acceptance

- [ ] Protected content never renders without an access token.
- [ ] Test added for the fallback path.

---

## Issue 6 — Dead `refreshToken` export in `api/auth.ts`

**Labels:** `chore`, `area:auth`, `priority:trivial`

### Summary

`src/api/auth.ts` exports `refreshToken()` that nothing imports. It duplicates the logic in `silentRefresh` and invites accidental misuse (it does not update the auth store).

### Hints for the fix

- Delete `refreshToken` from `src/api/auth.ts`.
- Verify no imports remain (`grep refreshToken src`).

### Acceptance

- [ ] `refreshToken` removed; build, lint, tests pass.

---

## Issue 7 — `useLanguageSwitch` can wipe first/last name when cache is cold

**Labels:** `bug`, `area:profile`, `priority:medium`

### Summary

Switching languages before the profile query has loaded sends empty strings for `firstName` and `lastName` to `PUT /users/me`, overwriting the user's real name on the server.

### Reproduction

1. Sign in.
2. Before the profile query resolves (slow network), change the language from the locale switcher.
3. Observe `firstName` and `lastName` become empty strings on the backend.

### Root cause

`src/features/profile/hooks/useLanguageSwitch.ts`:

```ts
firstName: cached?.firstName ?? '',
lastName:  cached?.lastName  ?? '',
```

### Expected

If profile data is not yet available, either (a) do not fire the request and just change `i18next` locally until the profile loads, or (b) guard the mutation behind `Boolean(cached)`.

### Hints for the fix

- Guard: `if (!cached) throw new Error(...)` or return early; in the caller, disable the selector until profile is loaded.
- Preferred: require `cached` and no-op the server update when missing; still switch i18next so UX feels responsive. Invalidate profile on reconnect.
- Add a test that calls the mutation without a cached profile and asserts no PUT is issued (or it is issued with the full cached fields).

### Acceptance

- [ ] No PUT with empty `firstName`/`lastName`.
- [ ] UI language still updates client-side even when profile hasn't loaded.
- [ ] Regression test added.

---

## Issue 8 — `CreateNotebookDialog` does not close on success; defaults don't hydrate when user loads late

**Labels:** `bug`, `area:notebooks`, `priority:low`

### Summary

1. After successful creation the dialog is not explicitly closed; it relies on navigation to `/app/notebooks/:id` to unmount it. If navigation fails (e.g., slow route transition), the dialog remains visible over the empty dashboard.
2. `defaultInstrumentId` and `defaultPageSize` defaults are captured once when `useCurrentUser` hasn't loaded, so opening the dialog before profile resolves leaves both empty even though the user has defaults.

### Root cause

`src/features/notebooks/components/CreateNotebookDialog.tsx` passes no `onSuccess` to `useCreateNotebook`, and the form's `defaultValues` are only applied on first mount.

### Expected

- On successful create, the dialog closes (`onOpenChange(false)`) and navigation runs.
- When `user` loads after the dialog has opened, empty fields are populated with the user's defaults (without overwriting fields the user has already edited).

### Hints for the fix

- Pass an `onSuccess` handler to `createMutation.mutate(...)` that calls `onOpenChange(false)`.
- In an effect, when `user` becomes available, use `form.resetField('instrumentId', { defaultValue: user.defaultInstrumentId ?? '' })` only if the current value is empty. Same for `pageSize`.
- Add tests for both behaviors.

### Acceptance

- [ ] Dialog closes on successful create.
- [ ] Defaults populate when profile resolves after dialog opens.
- [ ] Regression tests added.

---

## Issue 9 — `IndexPage` hardcodes the footer page number

**Labels:** `bug`, `area:notebook-shell`, `priority:low`

### Summary

`IndexPage` prints `notebooks.shell.index.pageNumber` with `number: 1` literally. The value should come from the page-sequence hook so that if the index's position ever changes it stays consistent.

### Root cause

`src/features/notebooks/components/IndexPage.tsx`:

```tsx
<div className="mt-4 text-right text-xs opacity-50">
  {t('notebooks.shell.index.pageNumber', { number: 1 })}
</div>
```

### Hints for the fix

- Use `usePageNavigation(notebookId).globalPageNumber` (or compute from the sequence) instead of the hardcoded `1`.
- Add a test that IndexPage renders the sequence-derived number.

### Acceptance

- [ ] Footer number is derived, not hardcoded.
- [ ] Regression test added.

---

## Issue 10 — `NotebookCard` keyboard activation fires twice when the dropdown is used

**Labels:** `bug`, `area:notebooks`, `a11y`, `priority:low`

### Summary

Pressing `Enter` or `Space` while focus is on the `…` dropdown trigger inside a notebook card both opens the menu and navigates into the notebook, because the card wrapper has `role="link"` with a global keydown handler.

### Root cause

`src/features/notebooks/components/NotebookCard.tsx` handles `onKeyDown` on the card wrapper and activates navigation on `Enter`/`Space` without checking the event target. The dropdown trigger's `onClick` stops click propagation but keydown bubbles.

### Hints for the fix

- In the card's `onKeyDown`, ignore the event when `e.target !== e.currentTarget`.
- Or wrap the card interactive area in an `<a>`/`<Link>` and remove the manual key handler.
- Add a test that dispatches `Enter` on the dropdown trigger and asserts navigation is not called.

### Acceptance

- [ ] Pressing Enter/Space on the dropdown trigger only opens the menu.
- [ ] Pressing Enter/Space on the card itself still navigates.
- [ ] Regression test added.

---

## Issue 11 — Arrow-key navigation hijacks keys inside dialogs

**Labels:** `bug`, `area:notebook-shell`, `a11y`, `priority:low`

### Summary

`useKeyboardNavigation` listens globally for `ArrowLeft`/`ArrowRight`. When an `AlertDialog` or `Dialog` is open (e.g., Delete Page confirmation), pressing the arrow keys to move focus between buttons also changes the page behind the dialog.

### Root cause

`src/features/notebooks/hooks/useKeyboardNavigation.ts` only suppresses on `input`, `textarea`, and `contenteditable`.

### Hints for the fix

- Also bail when `document.querySelector('[role="dialog"], [role="alertdialog"]')` exists (use `:is(...)` and `matches` via `document.body`).
- Or check `event.defaultPrevented` and also ignore if the active element is inside an element with `aria-modal="true"`.
- Add a test that renders an open `AlertDialog` and asserts `ArrowRight` does not call `navigate`.

### Acceptance

- [ ] Arrow keys don't navigate pages while a modal is open.
- [ ] Regression test added.

---

## Issue 12 — Global query retry retries non-retriable client errors

**Labels:** `bug`, `area:infra`, `priority:low`

### Summary

`queryClient.defaultOptions.queries.retry` retries 3× for any non-401 status. 403/404/422 requests therefore fire four total times and produce cascading error toasts.

### Root cause

`src/lib/query-client.ts`:

```ts
retry: (failureCount, error) => {
  if (axiosError?.response?.status === 401) return false;
  return failureCount < 3;
}
```

### Hints for the fix

- Only retry on network errors (no `response`) or 5xx responses. Do not retry 4xx.
- Add a unit test for the retry predicate covering 403, 404, 422, 500, and network errors.

### Acceptance

- [ ] 4xx responses are not retried.
- [ ] 5xx and network errors still retry up to 3 times.
- [ ] Regression test added.

---

## Issue 13 — `NotebookLayout` resets zoom/sidebar on every mount, and CSS `zoom` is not cross-browser

**Labels:** `bug`, `area:notebook-shell`, `priority:low`

### Summary

1. The effect in `NotebookLayout` resets `zoom` to `1.0` and closes the sidebar every time the layout mounts — including the first mount when visiting a notebook directly. This fights with any persisted zoom (if persisted later).
2. The canvas uses the non-standard CSS `zoom` property. Modern Firefox supports it, but `transform: scale(...)` is more predictable and respects stacking/overflow correctly.

### Root cause

`src/routes/notebook-layout.tsx`:

```tsx
useEffect(() => {
  setZoom(1.0);
  setSidebarOpen(false);
}, [notebookId, setZoom, setSidebarOpen]);
```

```tsx
<div className="w-full" style={{ zoom }}>
```

### Hints for the fix

- Use a ref to remember the previous `notebookId` and only reset when it actually changes (skip initial mount).
- Replace `style={{ zoom }}` with `style={{ transform: \`scale(${zoom})\`, transformOrigin: 'top center' }}` and compensate for layout (`width: \`${100 / zoom}%\``) if needed.
- Visual test: open a notebook, zoom in, switch notebooks — zoom resets; revisit same notebook within the session — zoom preserved.

### Acceptance

- [ ] Zoom only resets when the notebook actually changes.
- [ ] Canvas renders identically or better in Chromium, Firefox, and WebKit.
- [ ] Regression test for the reset condition.

---

## Issue 14 — `StyleEditorDrawer` close-reset may reset against stale styles

**Labels:** `bug`, `area:styling`, `priority:low`

### Summary

When the drawer is closed quickly after opening (before the styles query resolves), `closeResetRef.current()` runs against whichever `styles` were captured in the most recent render — which can be `undefined` at that point, causing the `StyleEditorForm` reset callback to be a no-op or throw.

### Root cause

`src/features/styling/components/StyleEditorDrawer.tsx` registers the close-reset via a ref, and `StyleEditorForm` reads `styles` from closure. If the form never mounted (still loading), the ref still points at the default `() => {}` and nothing resets — not a crash today, but the flow is fragile and easy to break.

### Hints for the fix

- Gate `closeResetRef.current()` behind `styles !== undefined`.
- In `StyleEditorForm` re-register the close-reset whenever `styles` change (already done) and assert it's been registered at least once before calling.
- Add a test that opens and immediately closes the drawer while the styles query is pending, and asserts no error is thrown.

### Acceptance

- [ ] No console errors when closing the drawer while loading.
- [ ] Regression test added.

---

## Issue 15 — `UserMenu` avatar lacks an alt text

**Labels:** `bug`, `a11y`, `priority:trivial`

### Summary

`UserMenu` renders `<AvatarImage src={avatarUrl} alt="" />`, so screen readers get nothing. The menu is already labeled via the surrounding button's `aria-label`, but an empty `alt` when there's a displayName in scope is a missed a11y affordance.

### Hints for the fix

- Set `alt={projection.displayName}` (falling back to the translation key already used by the button).
- Add a test that queries by accessible name.

### Acceptance

- [ ] `AvatarImage` has a meaningful alt when a display name is known.
- [ ] Regression test added.

---

## Suggested labels to create

- `area:auth`
- `area:notebooks`
- `area:notebook-shell`
- `area:styling`
- `area:profile`
- `area:infra`
- `a11y`
- `priority:critical`, `priority:medium`, `priority:low`, `priority:trivial`

## Order of execution recommended to the agent

1. Issue 1 (critical, unblocks notebook shell usability)
2. Issues 3, 5, 4, 7 (auth correctness)
3. Issues 2, 8, 9, 10, 11 (UX correctness)
4. Issues 12, 13, 14 (polish)
5. Issues 6, 15 (cleanup/a11y)

