import "server-only";

import type { ActiveEvent } from "./event";

export function isRegistrationCtaClosed(event: ActiveEvent, nowMs: number): boolean {
  const opensRaw = event.registration_opens_at?.trim();
  if (opensRaw) {
    const opens = new Date(opensRaw);
    if (!Number.isNaN(opens.getTime()) && nowMs < opens.getTime()) {
      return true;
    }
  }
  const reg = event.registration_closes_at?.trim();
  if (reg) {
    const closes = new Date(reg);
    if (!Number.isNaN(closes.getTime())) return nowMs > closes.getTime();
  }
  const at = new Date(event.event_date);
  if (Number.isNaN(at.getTime())) return false;
  return nowMs > at.getTime();
}
