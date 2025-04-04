/**
 * Format a number with specified decimal places
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places to display
 * @param {boolean} trimZeros - Whether to trim trailing zeros
 * @returns {string} Formatted number
 */
export const formatNumber = (value, decimals = 2, trimZeros = false) => {
  if (value === undefined || value === null) {
    return '0';
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return '0';
  }
  
  let formatted = num.toFixed(decimals);
  
  // Trim trailing zeros if needed
  if (trimZeros && formatted.includes('.')) {
    formatted = formatted.replace(/\.?0+$/, '');
  }
  
  return formatted;
};

/**
 * Format a number with thousands separators
 * @param {number} value - The number to format
 * @returns {string} Formatted number with thousand separators
 */
export const formatWithCommas = (value) => {
  if (value === undefined || value === null) {
    return '0';
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return '0';
  }
  
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Format a timestamp to a readable date/time
 * @param {string|number|Date} timestamp - Timestamp to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date/time
 */
export const formatDate = (timestamp, includeTime = false) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return date.toLocaleDateString('en-US', options);
};

/**
 * Format seconds to mm:ss format
 * @param {number} seconds - Seconds to format
 * @returns {string} Formatted time
 */
export const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) {
    return '00:00';
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}; 