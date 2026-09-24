export type ToolView = "科研工具" | "科研软件" | "MCP";

export function matchesToolView(view: string, toolType: string) {
  if (view === "科研软件") return toolType === "科研软件";
  if (view === "MCP") return toolType === "连接器";
  return !["科研软件", "连接器"].includes(toolType);
}
