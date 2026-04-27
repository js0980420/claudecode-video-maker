# Claude Videos

> For Traditional Chinese, see [README.zh-TW.md](./README.zh-TW.md).

A [Remotion](https://www.remotion.dev/) marketing-video template designed to be driven entirely by **Claude Code** — every piece of content (script, scenes, voiceover, BGM, thumbnails) lives in a single typed config file. Decoupled modules, any number of scenes.

---

## Quick start

```bash
git clone <this-repo>
cd <this-repo>
npm install   # postinstall copies src/content.example.ts → src/content.ts
npm run dev   # open Remotion Studio at http://localhost:3000
```

That's it — the demo video plays out of the box (5 scenes, no audio).

---

## Customize with Claude Code — example prompts for generating a video

The whole video is one file: **`src/content.ts`** (gitignored, your private copy).

You don't edit React components — you describe the video in plain English and Claude Code rewrites `content.ts` for you. Here are prompts that actually work:

**Start from scratch**

> "Open `src/content.ts` and make a 30-second video about [my SaaS product] with 5 scenes. Use `#00BFA5` as the primary color and keep the tone energetic."

> "Rewrite `src/content.ts` into a 20-second teaser for a mobile app. Scene 1 hook, scenes 2–3 the two main features, scene 4 social proof, scene 5 a 'download now' CTA."

**Edit what's already there**

> "In `src/content.ts`, keep the structure but replace every scene's text with content about [my product]. Don't change scene types or durations."

> "Change `brand.primaryColor` to `#FF6B35`, rename `meta.videoName` to `product-launch-v2`, and shorten every scene to 3 seconds."

**Add or remove scenes**

> "Add a new scene after scene-02 that uses the `terminal` visual type and shows three npm commands installing my tool."

> "Remove scene-04 and replace scene-05 with a `phoneCTA` scene linking to `@myhandle`."

**Use your own assets**

> "Put `input/images/logo.png` in the top-right corner of scene-01 and use `input/audio/bgm.mp3` as the background music."

**Enable voiceover and thumbnails**

> "Turn on AI voiceover in Traditional Chinese (set `voiceover.promptPrefix` to force the language), then generate a YouTube thumbnail, an Instagram square, and a Reel 9:16 — all with the same tagline."

> 💡 `meta.videoName` is the filename stem — change it and the rendered `mp4` / `png` files are named accordingly, so old versions are never overwritten.

---

## What's modular

Every module can be turned off independently in `content.ts`:

| Module           | How to disable                          | What happens                              |
|------------------|-----------------------------------------|-------------------------------------------|
| **AI voiceover** | `voiceover.enabled = false`             | Falls back to `scene.durationSeconds`     |
| **BGM**          | `bgm.enabled = false`                   | No background music track                 |
| **Thumbnails**   | Omit `thumbnails.yt` / `ig` / `reel`    | That format isn't registered              |
| **Scenes**       | Add / remove items in `scenes: [...]`   | Composition length recalculates           |

Want a new visual template? Add a variant to `SceneVisual` in `src/types.ts` and a case in `src/scenes/SceneRenderer.tsx`.

---

## Input assets (`input/`) vs render assets (`public/`)

Drop raw material into the matching `input/` subfolder. Claude Code can inspect these files while preparing a video, but Remotion renders most runtime assets from `public/` via `staticFile()`. Treat `input/` as a private staging area and `public/` as the render-ready asset area.

The folder structure is tracked by git, but **file contents are gitignored** so your assets never leak.

```
input/
  images/   # PNG / JPG / SVG / WebP …
  videos/   # MP4 / MOV / WebM …
  audio/    # MP3 / WAV / AAC …
```

Example chats with Claude Code:

> "Put `input/images/logo.png` in the top-right corner of scene 1."
>
> "Use `input/audio/bgm.mp3` as the background music."

For the current templates, move or copy final render assets into `public/` before rendering:

```
public/
  music/       # BGM files, e.g. music/bgm.mp3
  voiceover/   # generated WAVs and durations.json
  screenshots/ # tutorial screenshots and steps.json
```

> 💡 **BGM rule**: the background music track lives at `public/music/bgm.mp3` so Remotion can read it via `staticFile()` during bundling. Use `input/audio/` for raw material — move the final track into `public/music/` before rendering.

---

## AI voiceover (optional)

Uses Google Gemini's `gemini-2.5-flash-preview-tts`. Free tier: 10 requests/minute.

```bash
cp .env.example .env            # fill in GOOGLE_API_KEY
# In src/content.ts set voiceover.enabled = true
npm run voiceover               # generate public/voiceover/<scene-id>.wav for every scene
npm run voiceover -- scene-03   # re-generate a single scene
```

Voice options: `Puck` (energetic), `Kore`, `Aoede`, `Charon`, `Leda`. For non-English content set `voiceover.promptPrefix` (e.g. `"Speak in Traditional Chinese: "`) to stop the model from guessing the wrong language.

---

## Background music (optional)

Drop a CC-licensed track at `public/music/bgm.mp3` (file is gitignored). Then in `content.ts`:

```ts
bgm: {
  enabled: true,
  file: "music/bgm.mp3",
  volume: 0.55,
  attribution: "Music: <Title> by <Author> (CC BY 4.0)",
},
```

Free sources: [Kevin MacLeod / incompetech.com](https://incompetech.com/), [YouTube Audio Library](https://studio.youtube.com/), [Pixabay Music](https://pixabay.com/music/).

**Credit the artist in your video description if the license requires it.**

---

## Render

One command outputs the video plus three thumbnail formats, all named after `meta.videoName` with a purpose suffix, dropped directly into `output/`:

```bash
npm run render
```

Output layout:

```
output/
  <videoName>.mp4        # main video
  <videoName>-yt.png     # YouTube 16:9
  <videoName>-ig.png     # Instagram 1:1
  <videoName>-reel.png   # Reel 9:16
```

> 💡 Changing `meta.videoName` effectively starts a new version — old files are never overwritten.

### Other render commands

```bash
npm run render:test    # render the minimal test video defined in src/content-test.ts
npm run render:studio  # call remotion render directly with your own flags
```

Render a single thumbnail:

```bash
npx remotion still ThumbnailYT output/preview-yt.png
```

---

## Project layout

```
src/
  content.example.ts     # tracked default (safe to publish)
  content.ts             # your private copy (gitignored, created by postinstall)
  content-test.ts        # minimal video for quick verification
  types.ts               # VideoContent / SceneVisual types
  Root.tsx               # registers main video + test video + thumbnails
  Composition.tsx        # iterates over content.scenes
  scenes/
    SceneRenderer.tsx    # dispatches by visual.type
    SceneLayout.tsx      # fade in/out, brand corner, scene counter
    templates/           # one file per visual type
      IconPair.tsx
      CrossedItems.tsx
      Terminal.tsx
      PhoneCTA.tsx
      CenterText.tsx
  thumbnails/            # YT 16:9, IG 1:1, Reel 9:16
  icons.tsx              # built-in SVG icons
  utils/parseHighlights.tsx  # `[bracket]` primary-color highlight parser
scripts/
  generate-voiceover.ts  # reads content.ts → calls Gemini TTS
  render-organized.mjs   # backend for `npm run render`: video + 3 thumbnails into output/
  init-content.mjs       # postinstall: copy example → content.ts
input/                   # your source assets (contents gitignored)
  images/  videos/  audio/
output/                  # render output (contents gitignored, folder itself kept)
                         # <videoName>.mp4 / <videoName>-yt.png / -ig.png / -reel.png
public/
  voiceover/             # generated WAVs (gitignored)
  music/                 # your BGM files (gitignored)
```

> 📁 Both `input/` and `output/` are "**structure tracked, contents ignored**" — cloning gives you empty folders, but your assets and renders never reach git.

---

## License

MIT for the framework code. **Your `content.ts` is yours** — gitignored by default.

---

## About Remotion

Remotion is normally installed by running:

```bash
npx create-video@latest
```

This repo is a pre-packaged Remotion project — `npm install` already includes Remotion as a dependency, so you don't need to run `create-video` again.
