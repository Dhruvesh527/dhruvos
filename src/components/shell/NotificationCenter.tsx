"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, type LucideIcon } from "lucide-react";
import { monthGrid, shiftMonth } from "@/lib/calendar.mjs";
import type { AppId } from "@/components/apps/registry";
import { useDismiss, usePresence } from "@/components/os/hooks";

export type OsNotification = {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
  action: { label: string; app: AppId; resource?: string };
};

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/** One notification card (used in the centre and as the pop-up toast). */
export function NotificationCard({ item, onAction, onDismiss }: { item: OsNotification; onAction: () => void; onDismiss: () => void }) {
  const Icon = item.icon;
  return (
    <article className="nc-card">
      <header><span className="nc-app"><Icon size={14} /> DhruvOS</span><button aria-label={"Dismiss: " + item.title} onClick={onDismiss}><X size={14} /></button></header>
      <strong>{item.title}</strong>
      <p>{item.body}</p>
      <button className="nc-action" onClick={onAction}>{item.action.label}</button>
    </article>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  notifications: OsNotification[];
  onAction: (item: OsNotification) => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
};

export default function NotificationCenter({ open, onClose, notifications, onAction, onDismiss, onClearAll }: Props) {
  const { mounted, closing } = usePresence(open);
  const ref = useRef<HTMLDivElement>(null);
  const [month, setMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  useDismiss(ref, open, onClose, '[data-flyout-toggle="notifications"]');
  if (!mounted) return null;

  const today = new Date();
  const days = monthGrid(month.year, month.month, today);
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(month.year, month.month, 1));
  return (
    <div ref={ref} className={"flyout notification-center" + (closing ? " closing" : "")} role="dialog" aria-label="Notifications and calendar">
      <section className="nc-panel nc-list" aria-label="Notifications">
        <header className="nc-heading">
          <h2>Notifications</h2>
          {notifications.length > 0 && <button onClick={onClearAll}>Clear all</button>}
        </header>
        {notifications.length ? (
          notifications.map(item => <NotificationCard key={item.id} item={item} onAction={() => onAction(item)} onDismiss={() => onDismiss(item.id)} />)
        ) : (
          <p className="nc-empty">No new notifications</p>
        )}
      </section>
      <section className="nc-panel nc-calendar" aria-label="Calendar">
        <header className="nc-heading">
          <h2>{new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(today)}</h2>
        </header>
        <div className="cal-nav">
          <span>{monthLabel}</span>
          <div>
            <button aria-label="Previous month" onClick={() => setMonth(m => shiftMonth(m, -1))}><ChevronLeft size={16} /></button>
            <button aria-label="Next month" onClick={() => setMonth(m => shiftMonth(m, 1))}><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="cal-grid" role="grid" aria-label={monthLabel}>
          {WEEKDAYS.map(day => <span key={day} className="cal-weekday" role="columnheader">{day}</span>)}
          {days.map(day => (
            <span key={day.date.toISOString()} role="gridcell" aria-current={day.isToday ? "date" : undefined}
              className={"cal-day" + (day.inMonth ? "" : " outside") + (day.isToday ? " today" : "")}>{day.day}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
