import assert from "node:assert/strict";
import {test} from "node:test";
import {
  createSeedChallengePositions,
  createSeedWordVerifiers,
  verifySeedWord,
} from "../src/modules/auth/auth.crypto.js";

const phrase = "hole behind arrange attitude person group merit swim custom announce loop mammal";
const pepper = "test-only-seed-pepper";

test("seed challenge returns four stable unique positions", () => {
  const first = createSeedChallengePositions("stable-test-token", 12);
  const second = createSeedChallengePositions("stable-test-token", 12);

  assert.deepEqual(first, second);
  assert.equal(first.length, 4);
  assert.equal(new Set(first).size, 4);
  assert.ok(first.every((position) => position >= 1 && position <= 12));
});

test("word verifier accepts only the word from the requested position", () => {
  const verifiers = createSeedWordVerifiers(phrase, pepper);

  assert.equal(verifiers.length, 12);
  assert.equal(verifySeedWord("behind", verifiers[1] ?? "", pepper), true);
  assert.equal(verifySeedWord("group", verifiers[1] ?? "", pepper), false);
});
