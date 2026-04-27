export type EditPlanPlatform =
  | "youtube"
  | "reel"
  | "shorts"
  | "square"
  | "landscape";

export type EditPlanStylePreset =
  | "documentary"
  | "tutorial"
  | "product"
  | "social"
  | "cinematic";

export type EditPlanNarration =
  | { type: "none" }
  | { type: "script"; text: string }
  | { type: "segments"; segments: { id: string; text: string }[] };

export type EditPlan = {
  objective: string;
  targetDurationSeconds: number;
  platform: EditPlanPlatform;
  sourceAssetIds: string[];
  narration: EditPlanNarration;
  stylePreset?: EditPlanStylePreset;
  title?: string;
  notes?: string;
};
