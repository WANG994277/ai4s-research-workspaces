import test from "node:test";
import assert from "node:assert/strict";
import {
  preloadableNavigationModuleIds,
  preloadableNavigationTargets,
} from "./navigation-preload";

test("idle preload targets keep supported visible modules only", () => {
  assert.deepEqual(
    preloadableNavigationModuleIds(
      ["workspace", "assistant", "my-resources", "lab", "assistant", "research-spaces"],
      "workspace",
    ),
    ["assistant", "lab"],
  );
});

test("idle preload targets support management module families", () => {
  assert.deepEqual(
    preloadableNavigationModuleIds(
      ["research-management", "research-decision", "project-management-external", "admin"],
      "research-management",
    ),
    ["research-decision", "project-management-external", "admin"],
  );
});

test("navigation preload targets retain hrefs for route prefetching", () => {
  assert.deepEqual(
    preloadableNavigationTargets(
      [
        { id: "workspace", href: "/workspace" },
        { id: "assistant", href: "/assistant" },
        { id: "lab", href: "/lab?tab=devices" },
        { id: "research-spaces", href: "/research-spaces/current/overview" },
      ],
      "workspace",
    ),
    [
      { id: "assistant", href: "/assistant" },
      { id: "lab", href: "/lab?tab=devices" },
      { id: "research-spaces", href: "/research-spaces/current/overview" },
    ],
  );
});
