/**
 * Format time from 24-hour format (HH:mm) to 12-hour format with AM/PM
 * @param time - Time string in HH:mm format (e.g., "08:00", "17:30")
 * @returns Formatted time string (e.g., "8:00 AM", "5:30 PM")
 */
export function formatTime12Hour(time: string | null | undefined): string {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12; // Convert 0 to 12 for midnight
    
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format date from YYYY-MM-DD to readable format (e.g., "Nov 07, 2025")
 * @param date - Date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Nov 07, 2025")
 */
export function formatDate(date: string | null | undefined): string {
    if (!date) return '';
    
    const dateObj = new Date(date);
    const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: '2-digit' 
    };
    
    return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format date to short format (e.g., "Nov 07")
 * @param date - Date string in YYYY-MM-DD format
 * @returns Formatted short date string
 */
export function formatDateShort(date: string | null | undefined): string {
    if (!date) return '';
    
    const dateObj = new Date(date);
    const options: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        day: '2-digit' 
    };
    
    return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format date to long format (e.g., "November 07, 2025")
 * @param date - Date string in YYYY-MM-DD format
 * @returns Formatted long date string
 */
export function formatDateLong(date: string | null | undefined): string {
    if (!date) return '';
    
    const dateObj = new Date(date);
    const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: '2-digit' 
    };
    
    return dateObj.toLocaleDateString('en-US', options);
}
