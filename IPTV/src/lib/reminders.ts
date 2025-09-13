// src/lib/reminders.ts
export function requestNotificationPermission() {
    if (!("Notification" in window)) return Promise.resolve(false);
    return Notification.requestPermission().then((p) => p === "granted");
  }
  
  /** Schedule a local reminder using setTimeout (works while page is open) */
  export function scheduleLocalReminder(evStartISO: string, title: string, minutesBefore = 2) {
    const t = new Date(evStartISO).getTime() - minutesBefore * 60000;
    const delay = t - Date.now();
    if (delay <= 0) {
      // immediate
      new Notification(title, { body: "Starting soon" });
      return null;
    }
    const id = window.setTimeout(() => {
      new Notification(title, { body: "Starting now" });
    }, delay);
    return id;
  }
  
  /** Cancel scheduled (setTimeout) reminder */
  export function cancelReminder(timeoutId: number | null) {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
  