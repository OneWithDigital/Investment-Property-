import type { ReminderEvent } from "@/lib/calc/balanceTransfer";

function toIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n/g, "\\n")
    .replace(/[\r\n]/g, "\\n");
}

function icsTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(
    now.getUTCHours()
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
}

export function buildIcsCalendar(
  events: ReminderEvent[],
  calendarName = "Balance Transfer Reminders"
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MyFinancial.help//Balance Transfer Planner//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ];

  const stamp = icsTimestamp();
  events.forEach((event, i) => {
    const dateValue = toIcsDate(event.date);
    lines.push(
      "BEGIN:VEVENT",
      `UID:balance-transfer-reminder-${i}-${dateValue}@myfinancial.help`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dateValue}`,
      `DTEND;VALUE=DATE:${dateValue}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      `DESCRIPTION:${escapeIcsText(event.detail)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder",
      "TRIGGER:-P0D",
      "END:VALARM",
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(event: ReminderEvent): string {
  const dateValue = toIcsDate(event.date);
  const d = new Date(`${event.date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  const endValue = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${dateValue}/${endValue}`,
    details: event.detail,
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}
