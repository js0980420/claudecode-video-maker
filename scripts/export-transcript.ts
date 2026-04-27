import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname } from "node:path";
import {
  exportSubtitleTrackTranscript,
  parseSubtitleTextToTrack,
  TranscriptExportFormat,
} from "../src/timeline/subtitles";

type Args = {
  input?: string;
  out?: string;
  format: TranscriptExportFormat;
  type?: "srt" | "vtt";
};

function usage(): never {
  console.error(
    [
      "Usage:",
      "  npm run transcript:export -- --input captions.srt --out transcript.txt",
      "  npm run transcript:export -- --input captions.vtt --format json --out transcript.json",
      "",
      "Options:",
      "  --input <path>      SRT or VTT subtitle file",
      "  --out <path>        Output transcript file",
      "  --format <format>   text, timestamped, or json (default: text)",
      "  --type <type>       srt or vtt; inferred from file extension when omitted",
    ].join("\n"),
  );
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const args: Args = { format: "text" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--input" && next) {
      args.input = next;
      i++;
    } else if (arg === "--out" && next) {
      args.out = next;
      i++;
    } else if (arg === "--format" && next) {
      if (next !== "text" && next !== "timestamped" && next !== "json") {
        usage();
      }
      args.format = next;
      i++;
    } else if (arg === "--type" && next) {
      if (next !== "srt" && next !== "vtt") usage();
      args.type = next;
      i++;
    } else {
      usage();
    }
  }
  return args;
}

function inferType(input: string): "srt" | "vtt" {
  const ext = extname(input).toLowerCase();
  if (ext === ".srt") return "srt";
  if (ext === ".vtt") return "vtt";
  usage();
}

const args = parseArgs(process.argv.slice(2));
if (!args.input || !args.out) usage();

const input = readFileSync(args.input, "utf-8");
const track = parseSubtitleTextToTrack(input, args.type ?? inferType(args.input));
const transcript = exportSubtitleTrackTranscript(track, args.format);

mkdirSync(dirname(args.out), { recursive: true });
writeFileSync(args.out, `${transcript}\n`);
console.log(`Wrote transcript: ${args.out}`);
