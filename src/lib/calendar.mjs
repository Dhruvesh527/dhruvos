// Month grid for the Notification Centre calendar: always 6 weeks (42 days), weeks start on Monday.

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function monthGrid(year, month, today = new Date()) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const days = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(year, month, 1 - offset + i);
    days.push({ date, day: date.getDate(), inMonth: date.getMonth() === month, isToday: sameDay(date, today) });
  }
  return days;
}

export function shiftMonth({ year, month }, delta) {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}
