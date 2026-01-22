/**
 * Formatting utility functions
 */

/**
 * Format timestamp to readable date string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string (e.g., "2024-01-22")
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format timestamp to readable date and time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date-time string (e.g., "2024-01-22 14:30")
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Format timestamp to relative time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string (e.g., "2 days ago", "just now")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (days < 7) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (weeks < 4) {
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (months < 12) {
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

/**
 * Format score as fraction and percentage
 * @param correct - Number of correct answers
 * @param total - Total number of questions
 * @returns Formatted score string (e.g., "4/5 (80%)")
 */
export function formatScore(correct: number, total: number): string {
  if (total === 0) {
    return '0/0 (0%)';
  }

  const percentage = Math.round((correct / total) * 100);
  return `${correct}/${total} (${percentage}%)`;
}

/**
 * Format percentage
 * @param value - Value between 0 and 1
 * @returns Formatted percentage (e.g., "75%")
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * Format duration in milliseconds to readable string
 * @param ms - Duration in milliseconds
 * @returns Formatted duration (e.g., "2m 30s", "45s")
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format number with thousands separator
 * @param num - Number to format
 * @returns Formatted number (e.g., "1,234")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format file size in bytes to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);

  return `${value.toFixed(1)} ${sizes[i]}`;
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of string
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalize(text: string): string {
  if (!text || text.length === 0) {
    return text;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Format grade level to display string
 * @param grade - Grade level number (3-9)
 * @returns Display string (e.g., "Grade 5")
 */
export function formatGradeLevel(grade: number): string {
  return `Grade ${grade}`;
}
