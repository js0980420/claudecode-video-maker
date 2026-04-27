import { test } from "node:test";
import assert from "node:assert/strict";
import { duckingMultiplierAtFrame } from "./audioDucking";

const config = {
  enabled: true,
  volumeMultiplier: 0.25,
  attackFrames: 10,
  releaseFrames: 20,
};

test("duckingMultiplierAtFrame returns 1 when disabled or outside ranges", () => {
  assert.equal(duckingMultiplierAtFrame(50, [{ from: 100, to: 200 }]), 1);
  assert.equal(
    duckingMultiplierAtFrame(50, [{ from: 100, to: 200 }], config),
    1,
  );
});

test("duckingMultiplierAtFrame ducks during the active range", () => {
  assert.equal(
    duckingMultiplierAtFrame(150, [{ from: 100, to: 200 }], config),
    0.25,
  );
});

test("duckingMultiplierAtFrame interpolates attack and release", () => {
  assert.equal(
    duckingMultiplierAtFrame(95, [{ from: 100, to: 200 }], config),
    0.625,
  );
  assert.equal(
    duckingMultiplierAtFrame(210, [{ from: 100, to: 200 }], config),
    0.625,
  );
});
