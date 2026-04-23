import { Input, ALL_FORMATS, UrlSource } from "mediabunny";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const files = [
  "public/voiceover/scene-01.wav",
  "public/voiceover/scene-02.wav",
  "public/voiceover/scene-03.wav",
  "public/voiceover/scene-04.wav",
  "public/voiceover/scene-05.wav",
  "public/music/bgm.mp3",
];

for (const f of files) {
  try {
    const url = pathToFileURL(resolve(f)).href;
    const input = new Input({
      formats: ALL_FORMATS,
      source: new UrlSource(url, { getRetryDelay: () => null }),
    });
    const duration = await input.computeDuration();
    console.log(`${f}: ${duration.toFixed(3)}s`);
  } catch (e) {
    console.log(`${f}: ❌ ${(e as Error).message}`);
  }
}
