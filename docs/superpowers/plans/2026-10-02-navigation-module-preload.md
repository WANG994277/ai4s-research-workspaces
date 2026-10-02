# Navigation Module Preload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preload visible navigation modules before their first visit so module switching reuses an existing import request instead of starting a second lazy-load wait after navigation.

**Architecture:** Move the dynamic import functions into a focused module registry that caches one Promise per module family. `BaselinePage` and the navigation shell share this registry; the shell schedules visible-module preloads during idle time and promotes a target immediately on pointer hover or keyboard focus.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Node test runner through `tsx`.

---

### Task 1: Module preload registry

**Files:**
- Create: `src/components/v1/module-loaders.ts`
- Create: `src/components/v1/module-loaders.test.ts`
- Modify: `src/components/v1/entry.tsx`

- [ ] **Step 1: Write the failing registry test**

Test an injectable `createModulePreloader` helper with a fake loader map. Assert that two requests for the same module invoke its loader once and return the same Promise; aliases such as `skills`, `models`, and `tools` share the catalog loader; unknown IDs resolve without throwing.

- [ ] **Step 2: Verify the test fails**

Run: `pnpm exec tsx --test src/components/v1/module-loaders.test.ts`

Expected: FAIL because `./module-loaders` does not exist.

- [ ] **Step 3: Implement the registry and reuse it in dynamic components**

Create typed loader functions for workspace, assistant, knowledge, datasets, catalog, assets, lab, spaces, management, and integrations. Cache the Promise returned for each loader key. Export `preloadBaselineModule`, `preloadBaselineModules`, and the loader functions consumed by `next/dynamic`. Preserve the existing loading fallback and rendered component mapping.

- [ ] **Step 4: Verify the focused test passes**

Run: `pnpm exec tsx --test src/components/v1/module-loaders.test.ts`

Expected: PASS.

### Task 2: Navigation idle and intent preloading

**Files:**
- Create: `src/components/v1/navigation-preload.ts`
- Create: `src/components/v1/navigation-preload.test.ts`
- Modify: `src/components/v1/shell.tsx`

- [ ] **Step 1: Write failing navigation target tests**

Test a pure `preloadableNavigationModuleIds` function. Assert it removes the active module, child-only entries, unsupported modules, and duplicates while retaining the visible supported parent modules.

- [ ] **Step 2: Verify the test fails**

Run: `pnpm exec tsx --test src/components/v1/navigation-preload.test.ts`

Expected: FAIL because `./navigation-preload` does not exist.

- [ ] **Step 3: Implement target selection and shell scheduling**

Add the pure selector. In `BaselineShell`, schedule the selected IDs with `requestIdleCallback({ timeout: 1500 })`, falling back to a 200 ms timeout, and cancel pending work on cleanup. Add `onPointerEnter` and `onFocus` to parent and child navigation links so intent immediately calls `preloadBaselineModule` for the relevant module ID.

- [ ] **Step 4: Verify navigation tests pass**

Run: `pnpm exec tsx --test src/components/v1/navigation-preload.test.ts src/components/v1/module-loaders.test.ts`

Expected: PASS.

### Task 3: Full verification

**Files:**
- Modify only if verification exposes an issue in the files above.

- [ ] **Step 1: Run all v1 unit tests**

Run: `pnpm exec tsx --test src/components/v1/*.test.ts`

Expected: all tests PASS.

- [ ] **Step 2: Run static checks**

Run: `pnpm run ts-check`

Run: `pnpm run lint:build`

Expected: both commands exit 0. If an unrelated pre-existing failure occurs, record it separately and run focused checks for the changed files.

- [ ] **Step 3: Inspect the final diff**

Run: `git diff --check` and `git diff -- src/components/v1/entry.tsx src/components/v1/module-loaders.ts src/components/v1/module-loaders.test.ts src/components/v1/navigation-preload.ts src/components/v1/navigation-preload.test.ts src/components/v1/shell.tsx`

Expected: no whitespace errors and only the planned performance changes.

- [ ] **Step 4: Commit the implementation**

Stage only the plan and implementation files, then commit with `perf: preload navigation modules`.
