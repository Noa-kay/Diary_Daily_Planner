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
