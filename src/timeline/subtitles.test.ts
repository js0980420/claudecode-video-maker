import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseSrtToTrack,
  parseVttToTrack,
  subtitleTrackToTimelineClips,
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

  const clips = subtitleTrackToTimelineClips(track, 30);
  assert.equal(clips[0].from, 30);
  assert.equal(clips[0].durationInFrames, 30);
});
