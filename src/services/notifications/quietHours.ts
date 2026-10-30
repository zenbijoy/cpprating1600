/**
 * Timezone and Quiet Hours Helper for CLIMB 1600.
 * Accurately calculates local time in any IANA time zone (e.g. 'America/New_York', 'Asia/Kolkata', 'UTC')
 * and determines whether quiet hours are currently in effect.
 */

export interface QuietHoursConfig {
  enabled: boolean;
  start: string; // HH:mm format e.g. "22:00"
  end: string;   // HH:mm format e.g. "08:00"
  timezone: string; // IANA timezone string e.g. "Asia/Kolkata" or "UTC"
}

export function parseMinutesFromMidnight(timeStr: string): number {
  const parts = timeStr.split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  return h * 60 + m;
}

/**
 * Returns current hours and minutes (0..23, 0..59) in the specified time zone.
 */
export function getLocalTimeInTimezone(date: Date, timezone: string): { hours: number; minutes: number; dayOfWeek: number; dateString: string } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const parts = formatter.formatToParts(date);
    let hours = 0;
    let minutes = 0;
    let year = '1970';
    let month = '01';
    let day = '01';

    for (const part of parts) {
      if (part.type === 'hour') hours = parseInt(part.value, 10);
      if (part.type === 'minute') minutes = parseInt(part.value, 10);
      if (part.type === 'year') year = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'day') day = part.value;
    }

    // Adjust 24:00 to 0:00 if returned by some formatters
    if (hours === 24) hours = 0;

    return {
      hours,
      minutes,
      dayOfWeek: date.getDay(),
      dateString: `${year}-${month}-${day}`,
    };
  } catch (err) {
    // Fallback to UTC if timezone is invalid
    return {
      hours: date.getUTCHours(),
      minutes: date.getUTCMinutes(),
      dayOfWeek: date.getUTCDay(),
      dateString: date.toISOString().split('T')[0],
    };
  }
}

/**
 * Checks whether the given date/time falls within the user's quiet hours window.
 */
export function isInQuietHours(date: Date, config: QuietHoursConfig): boolean {
  if (!config.enabled) return false;

  const startMin = parseMinutesFromMidnight(config.start);
  const endMin = parseMinutesFromMidnight(config.end);

  if (startMin === endMin) return false;

  const { hours, minutes } = getLocalTimeInTimezone(date, config.timezone);
  const currentMin = hours * 60 + minutes;

  if (startMin > endMin) {
    // Overnight window (e.g. 22:00 to 08:00)
    return currentMin >= startMin || currentMin < endMin;
  } else {
    // Daytime window (e.g. 13:00 to 15:00)
    return currentMin >= startMin && currentMin < endMin;
  }
}

/**
 * Calculates the next UTC Date when quiet hours will end.
 */
export function getNextQuietHoursEnd(currentDate: Date, config: QuietHoursConfig): Date {
  if (!isInQuietHours(currentDate, config)) return currentDate;

  const endParts = config.end.split(':');
  const targetHour = parseInt(endParts[0] || '8', 10);
  const targetMinute = parseInt(endParts[1] || '0', 10);

  // Search forward in 15-minute increments up to 24 hours until quiet hours is false
  let candidate = new Date(currentDate.getTime() + 15 * 60 * 1000);
  for (let i = 0; i < 96; i++) {
    if (!isInQuietHours(candidate, config)) {
      return candidate;
    }
    candidate = new Date(candidate.getTime() + 15 * 60 * 1000);
  }

  // Fallback: 8 hours later
  return new Date(currentDate.getTime() + 8 * 60 * 60 * 1000);
}
