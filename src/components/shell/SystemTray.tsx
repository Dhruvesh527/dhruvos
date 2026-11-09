"use client";

import { BatteryCharging, BatteryFull, BatteryLow, BatteryMedium, Volume2, Wifi } from "lucide-react";
import { useBattery, useNow } from "@/components/os/hooks";

function BatteryIcon({ level, charging }: { level: number; charging: boolean }) {
  if (charging) return <BatteryCharging size={18} />;
  if (level < 25) return <BatteryLow size={18} />;
  if (level < 70) return <BatteryMedium size={18} />;
  return <BatteryFull size={18} />;
}

type Props = { quickOpen: boolean; notificationsOpen: boolean; unread: number; onQuick: () => void; onNotifications: () => void };

export default function SystemTray({ quickOpen, notificationsOpen, unread, onQuick, onNotifications }: Props) {
  const now = useNow();
  const battery = useBattery();
  const time = now ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now) : "";
  const date = now ? new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "2-digit", year: "numeric" }).format(now) : "";
  return (
    <div className="tb-tray">
      <button className={"tb-tray-btn tb-status" + (quickOpen ? " active" : "")} data-flyout-toggle="quick"
        aria-label="Quick settings" aria-expanded={quickOpen} onClick={onQuick}
        title={battery ? `Battery ${battery.level}%${battery.charging ? ", charging" : ""}` : "Quick settings"}>
        <Wifi size={16} /><Volume2 size={16} />
        {battery ? <BatteryIcon level={battery.level} charging={battery.charging} /> : <BatteryFull size={18} />}
      </button>
      <button className={"tb-tray-btn tb-clock" + (notificationsOpen ? " active" : "") + (unread > 0 ? " has-badge" : "")} data-flyout-toggle="notifications"
        aria-expanded={notificationsOpen} onClick={onNotifications}>
        <span className="tb-time">{time}</span>
        <span className="tb-date">{date}</span>
        {unread > 0 && <span className="tb-badge" aria-hidden="true">{unread}</span>}
        <span className="sr-only">, notifications and calendar{unread ? `, ${unread} new` : ""}</span>
      </button>
    </div>
  );
}
