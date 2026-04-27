import { EditPlan, EditPlanPlatform } from "./types";
import { validateEditPlan } from "./validate";

function assertValid(plan: EditPlan): EditPlan {
  const validation = validateEditPlan(plan);
  if (!validation.valid) {
    throw new Error(`Invalid iterated edit plan:\n${validation.errors.join("\n")}`);
  }
  return plan;
}

export function replaceSourceAsset(
  plan: EditPlan,
  fromAssetId: string,
  toAssetId: string,
): EditPlan {
  if (!fromAssetId.trim() || !toAssetId.trim()) {
    throw new Error("fromAssetId and toAssetId must be non-empty");
  }
  if (!plan.sourceAssetIds.includes(fromAssetId)) {
    throw new Error(`source asset not found in plan: ${fromAssetId}`);
  }
  return assertValid({
    ...plan,
    sourceAssetIds: plan.sourceAssetIds.map((assetId) =>
      assetId === fromAssetId ? toAssetId : assetId,
    ),
  });
}

export function retimeEditPlan(
  plan: EditPlan,
  targetDurationSeconds: number,
): EditPlan {
  return assertValid({
    ...plan,
    targetDurationSeconds,
  });
}

export function switchEditPlanPlatform(
  plan: EditPlan,
  platform: EditPlanPlatform,
): EditPlan {
  return assertValid({
    ...plan,
    platform,
  });
}
