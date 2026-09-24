import { canRead, canUse } from "./domain";
import type { Asset, Knowledge, Profile, State } from "./types";

export type ResourcePickerMode = "knowledge" | "data";

export function pickerResources(
  mode: ResourcePickerMode,
  state: State,
  profile: Profile,
  spaceId: string,
): Array<Knowledge | Asset> {
  if (mode === "knowledge") {
    return state.knowledge.filter((resource) =>
      canRead(resource, profile, spaceId, state),
    );
  }

  return state.assets.filter(
    (resource) =>
      resource.type === "数据集" &&
      canUse(resource, profile, spaceId, state),
  );
}
