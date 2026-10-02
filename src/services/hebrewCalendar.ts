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

const HEBREW_MONTH_NAMES: Record<number, string> = {
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
