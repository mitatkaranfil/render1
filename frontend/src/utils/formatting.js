/**
 * Format a number with specified decimal places and optional group separator
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {boolean} useGrouping - Whether to use thousands separator (default: true)
 * @returns {string} Formatted number
 */
export const formatNumber = (number, decimals = 2, useGrouping = true) => {
  if (number === null || number === undefined) return '-';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: useGrouping
  }).format(number);
};

/**
 * Format duration in seconds to a readable string (HH:MM:SS or MM:SS)
 * @param {number} seconds - Duration in seconds
 * @param {boolean} showHours - Whether to always show hours (default: true)
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds, showHours = true) => {
  if (!seconds && seconds !== 0) return '-';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  // Format each component with leading zeros
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(secs).padStart(2, '0');
  
  // Return formatted duration
  if (showHours || hours > 0) {
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  } else {
    return `${formattedMinutes}:${formattedSeconds}`;
  }
};

/**
 * Format a date to a readable string
 * @param {string|Date} date - The date to format
 * @param {boolean} includeTime - Whether to include the time (default: false)
 * @returns {string} Formatted date
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

/**
 * Format a timestamp to relative time (e.g., "2 hours ago")
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Relative time
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '-';
  
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  
  const seconds = Math.floor((now - date) / 1000);
  
  // Time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  // Format based on interval
  if (seconds < 60) {
    return 'just now';
  }
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  
  return formatDate(date, true);
}; 