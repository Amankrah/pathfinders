/**
 * Utility functions for handling and formatting dates
 */

/**
 * Format a date string in a user-friendly way
 * @param dateString Date string to format
 * @param options Optional formatting options
 * @returns Formatted date string or fallback message
 */
export function formatDate(dateString: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) {
    return 'Date not available';
  }
  
  try {
    // Try different formats if ISO parsing fails
    let date: Date | null = null;
    
    // Try direct parsing first (works for ISO dates)
    date = new Date(dateString);
    
    // If that fails, try other common formats
    if (isNaN(date.getTime())) {
      // Try to parse a numeric timestamp (milliseconds since Unix epoch)
      const timestamp = parseInt(dateString);
      if (!isNaN(timestamp)) {
        date = new Date(timestamp);
      }
      
      // Try parsing Django formatted ISO strings (e.g. 2025-05-21T14:38:47.195526-05:00)
      if (!date || isNaN(date.getTime())) {
        // Use regex to extract date parts from Django-style datetime string
        const djangoDateMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        if (djangoDateMatch) {
          // If we have a match, construct a date from the components
          const [_, year, month, day, hour, minute, second] = djangoDateMatch;
          date = new Date(
            parseInt(year),
            parseInt(month) - 1, // Month is 0-based in JS Date
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second)
          );
        }
      }
    }
    
    // If we still don't have a valid date, return fallback
    if (!date || isNaN(date.getTime())) {
      console.warn(`Invalid date encountered: ${dateString}`);
      return 'Date not available';
    }
    
    // Format the date with provided options or defaults
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return date.toLocaleDateString(undefined, options || defaultOptions);
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return 'Date not available';
  }
}

/**
 * Format a date string to include both date and time
 * @param dateString Date string to format
 * @returns Formatted date and time string or fallback message
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Date not available';
  }
  
  return formatDate(dateString, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if a date string is valid
 * @param dateString Date string to validate
 * @returns True if valid, false otherwise
 */
export function isValidDate(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
} 