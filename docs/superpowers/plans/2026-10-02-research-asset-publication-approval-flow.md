# Research Asset Publication Approval Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Show the asset applicant and the correct one- or two-stage approval chain in the publication modal before submission.

**Architecture:** Add a pure domain function that derives approval nodes from the asset's owning project and selected visibility. Render those nodes in the existing confirmation step so the UI stays declarative and the approval rules remain directly testable.

**Tech Stack:** TypeScript, React 19, Next.js 16, CSS, Node test runner with tsx, Playwright CLI

---

### Task 1: Derive the approval chain from the owning project

**Files:**
- Modify: `src/components/v1/research-space-domain.test.ts`
- Modify: `src/components/v1/research-space-domain.ts`

- [x] **Step 1: Write failing domain tests**

Add tests that call `researchAssetPublicationApprovalFlow(state, asset, visibility)` and assert:

```ts
assert.deepEqual(
  researchAssetPublicationApprovalFlow(state, sharedAsset, "项目空间"),
  [
    { kind: "applicant", userId: sharedAsset.ownerId, name: userName(sharedAsset.ownerId), role: "申请人", status: "发起" },
    { kind: "approver", name: "王敏", role: "项目负责人", status: "待审批" },
  ],
);
```

For `集团资源中心`, assert the same first two nodes followed by `{ kind: "approver", name: "平台管理员", role: "平台管理员", status: "待审批" }`. Change the asset's `spaceId` and `projectId` in the fixture so the expected project owner differs from the currently viewed project.

- [x] **Step 2: Run the tests and verify RED**

Run: `node --import tsx --test src/components/v1/research-space-domain.test.ts`

Expected: FAIL because `researchAssetPublicationApprovalFlow` is not exported.

- [x] **Step 3: Implement the minimal domain function**

Export a typed approval-node model and a function that resolves the asset's owning space, then its project, and returns the applicant plus project owner. Append the platform administrator node only for `集团资源中心`. Use explicit fallback labels when data is missing.

- [x] **Step 4: Run the domain tests and verify GREEN**

Run: `node --import tsx --test src/components/v1/research-space-domain.test.ts`

Expected: all tests pass.

### Task 2: Render the approval flow in the publication modal

**Files:**
- Modify: `src/components/v1/research-space-list.tsx`
- Modify: `src/components/v1/v1.css`

- [x] **Step 1: Connect the derived flow to the confirmation step**

Import `researchAssetPublicationApprovalFlow`, derive the nodes from `publishAsset`, `state`, and `publishDraft.visibility`, and render an ordered `.rs-publish-approval-flow` between the confirmation copy and asset details. Each node shows its sequence number, name, role, and status.

- [x] **Step 2: Add scoped responsive styles**

Style the approval list as connected horizontal nodes on desktop, with applicant visually distinct from pending approvers. At narrow widths, allow wrapping or switch to a vertical layout without overflowing the modal.

- [x] **Step 3: Run static and domain verification**

Run:

```powershell
node --import tsx --test src/components/v1/research-space-domain.test.ts
pnpm run ts-check
pnpm run lint:build
```

Expected: all commands exit 0.

- [x] **Step 4: Verify both approval chains in the browser**

Open a publishable asset, advance to “确认提交”, and verify the project-space chain contains two nodes. Return to step 1, select “集团资源中心”, advance again, and verify the chain contains three nodes in the required order. Capture a screenshot under `output/playwright/`.

- [x] **Step 5: Commit the focused implementation**

```powershell
git add -- src/components/v1/research-space-domain.test.ts src/components/v1/research-space-domain.ts src/components/v1/research-space-list.tsx src/components/v1/v1.css docs/superpowers/plans/2026-10-02-research-asset-publication-approval-flow.md
git commit -m "feat: show asset publication approval flow"
```
