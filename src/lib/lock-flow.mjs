// Lock screen → sign-in → welcome → desktop.
// A tiny state machine, kept pure so it is easy to test.

/** How long each animated step takes, in milliseconds. */
export const LOCK_TIMING = { unlock: 480, welcome: 1300, leave: 380 };

/** Keys that should NOT unlock the lock screen (so keyboard users can still Tab to "Skip intro"). */
const IGNORED_KEYS = new Set(["Tab", "Shift", "Control", "Alt", "Meta", "CapsLock"]);

export function isUnlockKey(key) {
  return !IGNORED_KEYS.has(key);
}

/** A swipe up of at least this many pixels unlocks, like on a touch screen. */
export const SWIPE_UNLOCK_DISTANCE = 40;

export function lockReducer(stage, event) {
  switch (event) {
    case "unlock":
      return stage === "lock" ? "signin" : stage;
    case "signIn":
      return stage === "signin" ? "welcome" : stage;
    case "back":
      return stage === "signin" ? "lock" : stage;
    case "welcomed":
      return stage === "welcome" ? "leaving" : stage;
    case "left":
      return stage === "leaving" ? "done" : stage;
    default:
      return stage;
  }
}
