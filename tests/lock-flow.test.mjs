import test from "node:test";
import assert from "node:assert/strict";
import { lockReducer, isUnlockKey } from "../src/lib/lock-flow.mjs";

const run = (events, start = "lock") => events.reduce(lockReducer, start);

test("the full path goes lock → sign-in → welcome → leaving → done", () => {
  assert.equal(run(["unlock"]), "signin");
  assert.equal(run(["unlock", "signIn"]), "welcome");
  assert.equal(run(["unlock", "signIn", "welcomed", "left"]), "done");
});

test("steps cannot be skipped out of order", () => {
  assert.equal(run(["signIn"]), "lock", "can't sign in while locked");
  assert.equal(run(["welcomed"]), "lock");
  assert.equal(run(["unlock", "left"]), "signin");
});

test("repeated clicks don't double-advance", () => {
  assert.equal(run(["unlock", "unlock", "unlock"]), "signin");
  assert.equal(run(["unlock", "signIn", "signIn", "unlock"]), "welcome");
});

test("Escape on the sign-in screen goes back to the lock screen", () => {
  assert.equal(run(["unlock", "back"]), "lock");
  assert.equal(run(["unlock", "signIn", "back"]), "welcome", "can't go back once signing in");
});

test("Tab and modifier keys don't unlock, so keyboard users can reach Skip", () => {
  for (const key of ["Tab", "Shift", "Control", "Alt", "Meta"]) assert.equal(isUnlockKey(key), false, key);
  for (const key of ["Enter", " ", "a", "ArrowUp", "Escape"]) assert.equal(isUnlockKey(key), true, key);
});
