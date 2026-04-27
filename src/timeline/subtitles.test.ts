import { test } from "node:test";
import assert from "node:assert/strict";
import {
  captionsToSentenceTrack,
  exportSubtitleTrackTranscript,
  formatTranscriptTimestamp,
  parseSrtToTrack,
  parseVttToTrack,
  subtitleTrackToJsonTranscript,
  subtitleTrackToPlainTranscript,
  subtitleTrackToTimestampedTranscript,
  subtitleTrackToTimelineClips,
  subtitleTrackToTimelineTrack,
} from "./subtitles";

test("parseSrtToTrack parses cues into the shared subtitle model", () => {
  const track = parseSrtToTrack(
    [
      "1",
      "00:00:01,000 --> 00:00:02,500",
      "Hello world",
      "",
      "2",
      "00:00:03,000 --> 00:00:04,000",
      "Next line",
    ].join("\n"),
    { id: "main", language: "en" },
  );

  assert.equal(track.id, "main");
  assert.equal(track.language, "en");
  assert.equal(track.cues.length, 2);
  assert.equal(track.cues[0].text, "Hello world");
  assert.equal(track.cues[0].startMs, 1000);
  assert.equal(track.cues[0].endMs, 2500);
});

test("captionsToSentenceTrack groups fragments until sentence punctuation", () => {
  const track = captionsToSentenceTrack([
    { text: "Hello", startMs: 0, endMs: 200, timestampMs: null, confidence: null },
    { text: "world.", startMs: 200, endMs: 500, timestampMs: null, confidence: null },
    { text: "Next", startMs: 700, endMs: 900, timestampMs: null, confidence: null },
  ]);

  assert.equal(track.cues.length, 2);
  assert.equal(track.cues[0].text, "Hello world.");
  assert.equal(track.cues[0].startMs, 0);
  assert.equal(track.cues[0].endMs, 500);
  assert.equal(track.cues[1].text, "Next");
});

test("parseVttToTrack parses basic WebVTT cues", () => {
  const track = parseVttToTrack(
    [
      "WEBVTT",
      "",
      "intro",
      "00:00:01.000 --> 00:00:02.000",
      "Hello VTT",
    ].join("\n"),
  );

  assert.equal(track.cues.length, 1);
  assert.equal(track.cues[0].text, "Hello VTT");
  assert.equal(track.cues[0].startMs, 1000);
  assert.equal(track.cues[0].endMs, 2000);
});

test("subtitleTrackToTimelineClips converts milliseconds to frames", () => {
  const track = parseVttToTrack(
    ["WEBVTT", "", "00:00:01.000 --> 00:00:02.000", "Caption"].join("\n"),
  );

  const clips = subtitleTrackToTimelineClips(track, 30, "sentence");
  assert.equal(clips[0].from, 30);
  assert.equal(clips[0].durationInFrames, 30);
  assert.equal(clips[0].style, "sentence");
});

test("subtitleTrackToTimelineClips preserves platform style presets", () => {
  const track = parseVttToTrack(
    ["WEBVTT", "", "00:00:00.000 --> 00:00:01.000", "Preset"].join("\n"),
  );

  const clips = subtitleTrackToTimelineClips(track, 30, "reel");
  assert.equal(clips[0].style, "reel");
});

test("subtitleTrackToTimelineTrack creates an enabled burn-in track", () => {
  const track = parseVttToTrack(
    ["WEBVTT", "", "00:00:00.000 --> 00:00:01.000", "Burn in"].join("\n"),
    { id: "captions" },
  );

  const timelineTrack = subtitleTrackToTimelineTrack(track, 30, {
    style: "youtube",
    trackId: "youtube-captions",
  });
  assert.equal(timelineTrack?.id, "youtube-captions");
  assert.equal(timelineTrack?.kind, "subtitle");
  assert.equal(timelineTrack?.clips[0].type, "subtitleCue");
  assert.equal(timelineTrack?.clips[0].style, "youtube");
});

test("subtitleTrackToTimelineTrack returns null when burn-in is disabled", () => {
  const track = parseVttToTrack(
    ["WEBVTT", "", "00:00:00.000 --> 00:00:01.000", "Sidecar only"].join("\n"),
  );

  assert.equal(subtitleTrackToTimelineTrack(track, 30, { enabled: false }), null);
});

test("transcript helpers export plain and timestamped text", () => {
  const track = parseSrtToTrack(
    [
      "1",
      "00:00:01,250 --> 00:00:02,500",
      "Hello",
      "world",
      "",
      "2",
      "00:00:03,000 --> 00:00:04,000",
      "Next line",
    ].join("\n"),
  );

  assert.equal(formatTranscriptTimestamp(1250), "00:00:01.250");
  assert.equal(subtitleTrackToPlainTranscript(track), "Hello world\nNext line");
  assert.equal(
    subtitleTrackToTimestampedTranscript(track),
    [
      "[00:00:01.250 --> 00:00:02.500] Hello world",
      "[00:00:03.000 --> 00:00:04.000] Next line",
    ].join("\n"),
  );
});

test("transcript helpers export json entries", () => {
  const track = parseVttToTrack(
    ["WEBVTT", "", "00:00:00.000 --> 00:00:01.000", "JSON line"].join("\n"),
  );

  assert.deepEqual(JSON.parse(subtitleTrackToJsonTranscript(track)), [
    {
      id: "cue-0001",
      startMs: 0,
      endMs: 1000,
      text: "JSON line",
    },
  ]);
  assert.equal(exportSubtitleTrackTranscript(track, "json"), subtitleTrackToJsonTranscript(track));
});
