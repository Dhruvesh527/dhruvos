export type CalendarDay = { date: Date; day: number; inMonth: boolean; isToday: boolean };
export function sameDay(a: Date, b: Date): boolean;
export function monthGrid(year: number, month: number, today?: Date): CalendarDay[];
export function shiftMonth(value: { year: number; month: number }, delta: number): { year: number; month: number };
