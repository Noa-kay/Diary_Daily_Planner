import { HDate, gematriya, HebrewCalendar } from '@hebcal/core';

export interface HebrewDateInfo {
  hebrewDayLetter: string; // e.g. "כ׳"
  hebrewMonthName: string; // e.g. "תשרי"
  hebrewYearLetter: string; // e.g. "תשפ״ז"
  fullHebrewDateStr: string; // e.g. "כ׳ בתשרי תשפ״ז"
  shortHebrewDateStr: string; // e.g. "כ׳ תשרי"
  holidayName?: string; // e.g. "סוכות"
  isRoshChodesh?: boolean;
}

export const HEBREW_MONTH_NAMES: Record<number, string> = {
  1: 'ניסן',
  2: 'אייר',
  3: 'סיוון',
  4: 'תמוז',
  5: 'אב',
  6: 'אלול',
  7: 'תשרי',
  8: 'חשוון',
  9: 'כסלו',
  10: 'טבת',
  11: 'שבט',
  12: 'אדר',
  13: 'אדר ב׳',
};

// Standard Jewish calendar year begins in Tishrei (7) and ends in Elul (6)
export const HEBREW_MONTH_ORDER: number[] = [7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4, 5, 6];

export interface HebrewMonthYearKey {
  hebrewYear: number;
  hebrewYearLetter: string;
  hebrewMonth: number;
  hebrewMonthName: string;
  key: string; // e.g. "5787-7"
}

export function getHebrewMonthAndYear(date: Date): HebrewMonthYearKey {
  try {
    const hd = new HDate(date);
    const hebrewYear = hd.getFullYear();
    const hebrewMonth = hd.getMonth();
    const hebrewMonthName = HEBREW_MONTH_NAMES[hebrewMonth] || 'תשרי';
    const hebrewYearLetter = gematriya(hebrewYear);
    return {
      hebrewYear,
      hebrewYearLetter,
      hebrewMonth,
      hebrewMonthName,
      key: `${hebrewYear}-${hebrewMonth}`,
    };
  } catch (err) {
    console.error('Error in getHebrewMonthAndYear:', err);
    return {
      hebrewYear: 5787,
      hebrewYearLetter: 'תשפ״ז',
      hebrewMonth: 7,
      hebrewMonthName: 'תשרי',
      key: '5787-7',
    };
  }
}

export function getHebrewYearLetter(year: number): string {
  try {
    return gematriya(year);
  } catch {
    return String(year);
  }
}

export function getHebrewDateInfo(date: Date): HebrewDateInfo {
  try {
    const hd = new HDate(date);
    const dayLetter = gematriya(hd.getDate());
    const monthNum = hd.getMonth();
    const monthName = HEBREW_MONTH_NAMES[monthNum] || 'תשרי';
    const yearLetter = gematriya(hd.getFullYear());

    // Check for holiday or special day
    const events = HebrewCalendar.getHolidaysOnDate(hd);
    let holidayName: string | undefined = undefined;

    if (events && events.length > 0) {
      holidayName = events[0].render('he');
    }

    const isRoshChodesh = hd.getDate() === 1 || hd.getDate() === 30;

    return {
      hebrewDayLetter: dayLetter,
      hebrewMonthName: monthName,
      hebrewYearLetter: yearLetter,
      fullHebrewDateStr: `${dayLetter} ב${monthName} ${yearLetter}`,
      shortHebrewDateStr: `${dayLetter} ${monthName}`,
      holidayName,
      isRoshChodesh,
    };
  } catch (err) {
    console.error('Error calculating Hebrew date:', err);
    return {
      hebrewDayLetter: '',
      hebrewMonthName: '',
      hebrewYearLetter: '',
      fullHebrewDateStr: '',
      shortHebrewDateStr: '',
    };
  }
}

// Check if two dates fall on the same Hebrew day of month and Hebrew month
export function isSameHebrewDayAndMonth(dateA: Date, dateB: Date): boolean {
  try {
    const hdA = new HDate(dateA);
    const hdB = new HDate(dateB);
    if (hdA.getDate() !== hdB.getDate()) return false;

    const mA = hdA.getMonth();
    const mB = hdB.getMonth();
    if (mA === mB) return true;

    // Handle Adar in leap vs non-leap years
    const isAdarA = mA === 12 || mA === 13;
    const isAdarB = mB === 12 || mB === 13;
    if (isAdarA && isAdarB) {
      if (!hdA.isLeapYear() || !hdB.isLeapYear()) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('Error in isSameHebrewDayAndMonth:', err);
    return false;
  }
}

export const HEBREW_DAYS_OF_WEEK_FULL = [
  'יום ראשון',
  'יום שני',
  'יום שלישי',
  'יום רביעי',
  'יום חמישי',
  'יום שישי',
  'שבת קודש',
];

export const HEBREW_DAYS_OF_WEEK_SHORT = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export interface HebrewCalendarCell {
  date: Date;
  dateKey: string; // YYYY-MM-DD (underlying Gregorian date key)
  hebrewDay: number;
  hebrewDayLetter: string; // e.g. "א׳", "כ״ד"
  hebrewMonth: number;
  hebrewMonthName: string; // e.g. "תשרי"
  hebrewYear: number;
  hebrewYearLetter: string; // e.g. "תשפ״ז"
  isCurrentHebrewMonth: boolean;
  holidayName?: string;
  isRoshChodesh?: boolean;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
}

// Convert a JS Date to "YYYY-MM-DD"
function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get next Hebrew month ({ year, month })
export function getNextHebrewMonth(year: number, month: number): { year: number; month: number } {
  try {
    const hd = new HDate(1, month, year);
    const nextHd = hd.add(1, 'month');
    return {
      year: nextHd.getFullYear(),
      month: nextHd.getMonth(),
    };
  } catch (err) {
    console.error('Error in getNextHebrewMonth:', err);
    return { year, month: month === 12 ? 1 : month + 1 };
  }
}

// Get previous Hebrew month ({ year, month })
export function getPrevHebrewMonth(year: number, month: number): { year: number; month: number } {
  try {
    const hd = new HDate(1, month, year);
    const prevHd = hd.subtract(1, 'month');
    return {
      year: prevHd.getFullYear(),
      month: prevHd.getMonth(),
    };
  } catch (err) {
    console.error('Error in getPrevHebrewMonth:', err);
    return { year, month: month === 1 ? 12 : month - 1 };
  }
}

// Format Hebrew month & year title, e.g. "חשוון תשפ״ז"
export function formatHebrewMonthTitle(year: number, month: number): string {
  const monthName = HEBREW_MONTH_NAMES[month] || '';
  const yearLetter = getHebrewYearLetter(year);
  return `${monthName} ${yearLetter}`;
}

// Build a complete monthly calendar grid for a given Hebrew year and Hebrew month
export function generateHebrewMonthCalendar(
  hebrewYear: number,
  hebrewMonth: number
): HebrewCalendarCell[] {
  try {
    const firstDay = new HDate(1, hebrewMonth, hebrewYear);
    const numDays = firstDay.daysInMonth();
    const startDayOfWeek = firstDay.getDay(); // 0 is Sunday

    const cells: HebrewCalendarCell[] = [];

    const createCellFromHDate = (hd: HDate, isCurrent: boolean): HebrewCalendarCell => {
      const gregDate = hd.greg();
      const events = HebrewCalendar.getHolidaysOnDate(hd);
      let holidayName: string | undefined = undefined;
      if (events && events.length > 0) {
        holidayName = events[0].render('he');
      }

      return {
        date: gregDate,
        dateKey: toDateKey(gregDate),
        hebrewDay: hd.getDate(),
        hebrewDayLetter: gematriya(hd.getDate()),
        hebrewMonth: hd.getMonth(),
        hebrewMonthName: HEBREW_MONTH_NAMES[hd.getMonth()] || '',
        hebrewYear: hd.getFullYear(),
        hebrewYearLetter: gematriya(hd.getFullYear()),
        isCurrentHebrewMonth: isCurrent,
        holidayName,
        isRoshChodesh: hd.getDate() === 1 || hd.getDate() === 30,
        dayOfWeek: hd.getDay(),
      };
    };

    // 1. Leading days from previous Hebrew month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevHd = firstDay.subtract(i + 1, 'd');
      cells.push(createCellFromHDate(prevHd, false));
    }

    // 2. All days in the current Hebrew month
    for (let day = 1; day <= numDays; day++) {
      const curHd = new HDate(day, hebrewMonth, hebrewYear);
      cells.push(createCellFromHDate(curHd, true));
    }

    // 3. Trailing days to finish the week row
    const lastDay = new HDate(numDays, hebrewMonth, hebrewYear);
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextHd = lastDay.add(d, 'd');
        cells.push(createCellFromHDate(nextHd, false));
      }
    }

    return cells;
  } catch (err) {
    console.error('Error generating Hebrew month calendar:', err);
    return [];
  }
}
