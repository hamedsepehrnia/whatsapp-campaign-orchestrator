/**
 * Persian Date Utility Functions
 * Converts Gregorian dates to Persian (Jalali) dates
 */

// Persian month names
const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر',
    'مرداد', 'شهریور', 'مهر', 'آبان',
    'آذر', 'دی', 'بهمن', 'اسفند'
];

// Persian day names
const persianDays = [
    'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه',
    'چهارشنبه', 'پنج‌شنبه', 'جمعه'
];

/**
 * Convert Gregorian date to Persian (Jalali) date
 * @param {Date} gregorianDate - Gregorian date object
 * @returns {Object} Persian date object
 */
function gregorianToPersian(gregorianDate) {
    const gYear = gregorianDate.getFullYear();
    const gMonth = gregorianDate.getMonth() + 1;
    const gDay = gregorianDate.getDate();

    // Convert to Persian date
    const persianDate = gregorianToJalali(gYear, gMonth, gDay);
    
    return {
        year: persianDate.jy,
        month: persianDate.jm,
        day: persianDate.jd,
        monthName: persianMonths[persianDate.jm - 1],
        dayName: persianDays[gregorianDate.getDay()]
    };
}

/**
 * Convert Gregorian to Jalali date
 * Algorithm based on the method described in:
 * https://www.fourmilab.ch/documents/calendar/
 */
function gregorianToJalali(gYear, gMonth, gDay) {
    const gy = gYear - 1600;
    const gm = gMonth - 1;
    const gd = gDay - 1;
    
    let gDayNo = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400) - 80 + gd;
    
    for (let i = 0; i < gm; i++) {
        gDayNo += gMonthDays[i];
    }
    
    if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0))) {
        gDayNo++;
    }
    
    gDayNo = gDayNo - 79;
    let jNp = Math.floor(gDayNo / 12053);
    gDayNo = gDayNo % 12053;
    
    let jy = 979 + 33 * jNp + 4 * Math.floor(gDayNo / 1461);
    gDayNo = gDayNo % 1461;
    
    if (gDayNo >= 366) {
        jy += Math.floor((gDayNo - 1) / 365);
        gDayNo = (gDayNo - 1) % 365;
    }
    
    let jm, jd;
    if (gDayNo < 186) {
        jm = 1 + Math.floor(gDayNo / 31);
        jd = 1 + (gDayNo % 31);
    } else {
        jm = 7 + Math.floor((gDayNo - 186) / 30);
        jd = 1 + ((gDayNo - 186) % 30);
    }
    
    return {
        jy: jy,
        jm: jm,
        jd: jd
    };
}

// Gregorian month days
const gMonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Generate campaign title based on Persian date
 * Format: YYYYMMDD (e.g., 14040303 for 3 خرداد 1404)
 * @param {Date} date - Date object (defaults to current date)
 * @returns {string} Generated title
 */
function generateCampaignTitle(date = new Date()) {
    const persianDate = gregorianToPersian(date);
    
    // Format: YYYYMMDD
    const year = persianDate.year.toString();
    const month = persianDate.month.toString().padStart(2, '0');
    const day = persianDate.day.toString().padStart(2, '0');
    
    return `${year}${month}${day}`;
}

/**
 * Generate human-readable campaign title
 * Format: "کمپین ۳ خرداد ۱۴۰۴"
 * @param {Date} date - Date object (defaults to current date)
 * @returns {string} Human-readable title
 */
function generateHumanReadableTitle(date = new Date()) {
    const persianDate = gregorianToPersian(date);
    
    return `کمپین ${persianDate.day} ${persianDate.monthName} ${persianDate.year}`;
}

/**
 * Parse campaign title to get Persian date
 * @param {string} title - Campaign title (format: YYYYMMDD)
 * @returns {Object|null} Persian date object or null if invalid
 */
function parseCampaignTitle(title) {
    if (!title || title.length !== 8) {
        return null;
    }
    
    const year = parseInt(title.substring(0, 4));
    const month = parseInt(title.substring(4, 6));
    const day = parseInt(title.substring(6, 8));
    
    // Basic validation
    if (year < 1300 || year > 1500 || month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
    }
    
    return {
        year,
        month,
        day,
        monthName: persianMonths[month - 1]
    };
}

/**
 * Get current Persian date
 * @returns {Object} Current Persian date
 */
function getCurrentPersianDate() {
    return gregorianToPersian(new Date());
}

/**
 * Format Persian date for display
 * @param {Object} persianDate - Persian date object
 * @param {string} format - Format string (default: 'YYYY/MM/DD')
 * @returns {string} Formatted date string
 */
function formatPersianDate(persianDate, format = 'YYYY/MM/DD') {
    const year = persianDate.year.toString();
    const month = persianDate.month.toString().padStart(2, '0');
    const day = persianDate.day.toString().padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('MMMM', persianDate.monthName);
}

module.exports = {
    gregorianToPersian,
    generateCampaignTitle,
    generateHumanReadableTitle,
    parseCampaignTitle,
    getCurrentPersianDate,
    formatPersianDate
};
