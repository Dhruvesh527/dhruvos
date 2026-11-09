export type LockStage = "lock" | "signin" | "welcome" | "leaving" | "done";
export type LockEvent = "unlock" | "signIn" | "back" | "welcomed" | "left";
export const LOCK_TIMING: { unlock: number; welcome: number; leave: number };
export const SWIPE_UNLOCK_DISTANCE: number;
export function isUnlockKey(key: string): boolean;
export function lockReducer(stage: LockStage, event: LockEvent): LockStage;
