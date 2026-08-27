import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const CRM_TIMEZONE = 'America/Toronto';

// All CRM timestamps display in Toronto local time regardless of the
// viewer's browser/OS timezone -- the underlying UTC value is untouched.
export function toCrmTz(date: string | Date) {
    return dayjs(date).tz(CRM_TIMEZONE);
}
