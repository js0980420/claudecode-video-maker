import {
  EditPlan,
  EditPlanPlatform,
  EditPlanStylePreset,
} from "./types";

export type EditPlanValidationResult = {
  valid: boolean;
  errors: string[];
};

const platforms = new Set<EditPlanPlatform>([
  "youtube",
  "reel",
  "shorts",
  "square",
  "landscape",
]);

const stylePresets = new Set<EditPlanStylePreset>([
  "documentary",
  "tutorial",
  "product",
  "social",
  "cinematic",
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function push(errors: string[], path: string, message: string) {
  errors.push(`${path}: ${message}`);
}

export function validateEditPlan(plan: EditPlan): EditPlanValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(plan.objective)) {
    push(errors, "objective", "must be a non-empty string");
  }
  if (
    typeof plan.targetDurationSeconds !== "number" ||
    !Number.isFinite(plan.targetDurationSeconds) ||
    plan.targetDurationSeconds <= 0
  ) {
    push(errors, "targetDurationSeconds", "must be a positive number");
  }
  if (!platforms.has(plan.platform)) {
    push(errors, "platform", "must be youtube, reel, shorts, square, or landscape");
  }
  if (!Array.isArray(plan.sourceAssetIds) || plan.sourceAssetIds.length === 0) {
    push(errors, "sourceAssetIds", "must be a non-empty array");
  } else {
    const ids = new Set<string>();
    plan.sourceAssetIds.forEach((assetId, index) => {
      if (!isNonEmptyString(assetId)) {
        push(errors, `sourceAssetIds[${index}]`, "must be a non-empty string");
      } else if (ids.has(assetId)) {
        push(errors, `sourceAssetIds[${index}]`, `duplicate asset id: ${assetId}`);
      } else {
        ids.add(assetId);
      }
    });
  }

  if (plan.narration.type === "script") {
    if (!isNonEmptyString(plan.narration.text)) {
      push(errors, "narration.text", "must be a non-empty string");
    }
  } else if (plan.narration.type === "segments") {
    if (!Array.isArray(plan.narration.segments) || plan.narration.segments.length === 0) {
      push(errors, "narration.segments", "must be a non-empty array");
    } else {
      const segmentIds = new Set<string>();
      plan.narration.segments.forEach((segment, index) => {
        if (!isNonEmptyString(segment.id)) {
          push(errors, `narration.segments[${index}].id`, "must be a non-empty string");
        } else if (segmentIds.has(segment.id)) {
          push(
            errors,
            `narration.segments[${index}].id`,
            `duplicate segment id: ${segment.id}`,
          );
        } else {
          segmentIds.add(segment.id);
        }
        if (!isNonEmptyString(segment.text)) {
          push(errors, `narration.segments[${index}].text`, "must be a non-empty string");
        }
      });
    }
  } else if (plan.narration.type !== "none") {
    push(errors, "narration.type", "must be none, script, or segments");
  }

  if (plan.stylePreset !== undefined && !stylePresets.has(plan.stylePreset)) {
    push(
      errors,
      "stylePreset",
      "must be documentary, tutorial, product, social, or cinematic",
    );
  }
  if (plan.title !== undefined && !isNonEmptyString(plan.title)) {
    push(errors, "title", "must be non-empty when provided");
  }
  if (plan.notes !== undefined && !isNonEmptyString(plan.notes)) {
    push(errors, "notes", "must be non-empty when provided");
  }

  return { valid: errors.length === 0, errors };
}
