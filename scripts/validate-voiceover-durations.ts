import shortDurationsJson from "../public/voiceover/durations.json";
import { content } from "../src/content";
import { TUTORIAL_DURATIONS, TUTORIAL_STEPS_JSON } from "../src/tutorial/content";
import { parseTutorialData } from "../src/tutorial/steps-data";

const errors: string[] = [];
const warnings: string[] = [];

function fail(path: string, message: string) {
  errors.push(`${path}: ${message}`);
}

function warn(path: string, message: string) {
  warnings.push(`${path}: ${message}`);
}

function isPositiveDuration(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function validateDurationMap(
  label: string,
  durations: Record<string, unknown>,
) {
  for (const [key, value] of Object.entries(durations)) {
    if (!isPositiveDuration(value)) {
      fail(`${label}.${key}`, "must be a positive finite number of seconds");
    }
  }
}

function requireDuration(
  durations: Record<string, unknown>,
  key: string,
  path: string,
) {
  if (!isPositiveDuration(durations[key])) {
    fail(path, `missing positive duration for "${key}"`);
  }
}

function warnUnusedDurations(
  label: string,
  durations: Record<string, unknown>,
  usedKeys: Set<string>,
) {
  const unused = Object.keys(durations).filter((key) => !usedKeys.has(key));
  if (unused.length > 0) {
    warn(label, `contains unused duration keys: ${unused.join(", ")}`);
  }
}

const shortDurations = shortDurationsJson as Record<string, unknown>;
validateDurationMap("VOICEOVER_DURATIONS", shortDurations);

if (content.voiceover.enabled) {
  const usedShortKeys = new Set<string>();
  for (const scene of content.scenes) {
    if (!scene.voiceover) continue;
    usedShortKeys.add(scene.id);
    requireDuration(
      shortDurations,
      scene.id,
      `VOICEOVER_DURATIONS.${scene.id}`,
    );
  }
  warnUnusedDurations("VOICEOVER_DURATIONS", shortDurations, usedShortKeys);
}

try {
  const tutorialData = parseTutorialData(TUTORIAL_STEPS_JSON);
  const tutorialDurations = TUTORIAL_DURATIONS as Record<string, unknown>;
  const usedTutorialKeys = new Set<string>();

  validateDurationMap("TUTORIAL_DURATIONS", tutorialDurations);

  if (tutorialData.intro?.voiceover) {
    usedTutorialKeys.add("intro");
    requireDuration(tutorialDurations, "intro", "TUTORIAL_DURATIONS.intro");
  }

  for (const step of tutorialData.steps) {
    step.voiceovers?.forEach((voiceover, index) => {
      if (!voiceover) return;
      const key = `${step.id}-p${index + 1}`;
      usedTutorialKeys.add(key);
      requireDuration(
        tutorialDurations,
        key,
        `TUTORIAL_DURATIONS.${key}`,
      );
    });
  }

  if (tutorialData.outro?.voiceover) {
    usedTutorialKeys.add("outro");
    requireDuration(tutorialDurations, "outro", "TUTORIAL_DURATIONS.outro");
  }

  warnUnusedDurations("TUTORIAL_DURATIONS", tutorialDurations, usedTutorialKeys);
} catch (error) {
  fail("TUTORIAL_STEPS_JSON", (error as Error).message);
}

if (warnings.length > 0) {
  console.warn("Voiceover duration validation warnings:");
  warnings.forEach((message) => console.warn(`- ${message}`));
}

if (errors.length > 0) {
  console.error("Voiceover duration validation failed:");
  errors.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Voiceover duration validation passed.");
