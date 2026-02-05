/**
 * Utility Functions for Faculty Feedback System
 * Provides common helper functions used throughout the application
 * 
 * @fileoverview Collection of utility functions for data manipulation, formatting, and common operations
 * @version 1.0.0
 * @author Faculty Feedback System Team
 */

/**
 * Utility class containing static helper methods
 */
class Utils {
    /**
     * Format date to human-readable string
     * @param {string|Date} date - Date to format
     * @param {Object} options - Formatting options
     * @returns {string} Formatted date string
     * 
     * @example
     * Utils.formatDate('2024-01-21T10:30:00Z')
     * // Returns: "January 21, 2024 at 10:30 AM"
     */
    static formatDate(date, options = {}) {
        try {
            const dateObj = new Date(date);
            
            if (isNaN(dateObj.getTime())) {
                throw new Error('Invalid date');
            }
            
            const defaultOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                ...options
            };
            
            return dateObj.toLocaleDateString('en-US', defaultOptions);
        } catch (error) {
            ErrorHandler?.handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.SYSTEM,
                    `Date formatting error: ${error.message}`,
                    { date, options }
                ),
                ErrorHandler.Severity.LOW
            );
            return 'Invalid Date';
        }
    }

    /**
     * Format date to relative time (e.g., "2 hours ago")
     * @param {string|Date} date - Date to format
     * @returns {string} Relative time string
     * 
     * @example
     * Utils.formatRelativeTime('2024-01-21T08:30:00Z')
     * // Returns: "2 hours ago"
     */
    static formatRelativeTime(date) {
        try {
            const dateObj = new Date(date);
            const now = new Date();
            const diffMs = now - dateObj;
            
            if (isNaN(dateObj.getTime())) {
                throw new Error('Invalid date');
            }
            
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffSeconds < 60) return 'Just now';
            if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            
            return this.formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (error) {
            ErrorHandler?.handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.SYSTEM,
                    `Relative time formatting error: ${error.message}`,
                    { date }
                ),
                ErrorHandler.Severity.LOW
            );
            return 'Unknown time';
        }
    }

    /**
     * Debounce function to limit function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {boolean} immediate - Execute immediately on first call
     * @returns {Function} Debounced function
     * 
     * @example
     * const debouncedSearch = Utils.debounce(searchFunction, 300);
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    /**
     * Throttle function to limit function execution rate
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     * 
     * @example
     * const throttledScroll = Utils.throttle(scrollHandler, 100);
     */
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Deep clone an object
     * @param {*} obj - Object to clone
     * @returns {*} Cloned object
     * 
     * @example
     * const cloned = Utils.deepClone(originalObject);
     */
    static deepClone(obj) {
        try {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(item => this.deepClone(item));
            if (typeof obj === 'object') {
                const cloned = {};
                Object.keys(obj).forEach(key => {
                    cloned[key] = this.deepClone(obj[key]);
                });
                return cloned;
            }
        } catch (error) {
            ErrorHandler?.handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.SYSTEM,
                    `Deep clone error: ${error.message}`
                ),
                ErrorHandler.Severity.LOW
            );
            return obj;
        }
    }

    /**
     * Generate user initials from full name
     * @param {string} name - Full name
     * @returns {string} User initials (max 2 characters)
     * 
     * @example
     * Utils.getInitials('John Doe Smith')
     * // Returns: "JD"
     */
    static getInitials(name) {
        try {
            if (!name || typeof name !== 'string') return '??';
            
            const words = name.trim().split(/\s+/);
            if (words.length === 1) {
                return words[0].charAt(0).toUpperCase();
            }
            
            return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
        } catch (error) {
            return '??';
        }
    }

    /**
     * Calculate average rating from feedback responses
     * @param {Array} responses - Array of response objects
     * @param {string} questionId - Question ID to calculate average for
     * @returns {number} Average rating (0-10)
     * 
     * @example
     * Utils.calculateAverageRating(responses, 'q1')
     * // Returns: 8.2
     */
    static calculateAverageRating(responses, questionId) {
        try {
            if (!Array.isArray(responses) || responses.length === 0) return 0;
            
            const ratings = responses
                .map(response => response.responses?.[questionId])
                .filter(rating => typeof rating === 'number' && rating >= 1 && rating <= 10);
            
            if (ratings.length === 0) return 0;
            
            const sum = ratings.reduce((acc, rating) => acc + rating, 0);
            return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal
        } catch (error) {
            ErrorHandler?.handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.SYSTEM,
                    `Average rating calculation error: ${error.message}`,
                    { responsesCount: responses?.length, questionId }
                ),
                ErrorHandler.Severity.LOW
            );
            return 0;
        }
    }

    /**
     * Generate star rating display
     * @param {number} rating - Rating value (0-10)
     * @param {boolean} showNumber - Whether to show numeric value
     * @returns {string} Star rating string
     * 
     * @example
     * Utils.generateStarRating(8.2, true)
     * // Returns: "★★★★★★★★☆☆ (8.2/10)"
     */
    static generateStarRating(rating, showNumber = false) {
        try {
            const numRating = parseFloat(rating) || 0;
            // For 1-10 scale, show 10 stars
            const fullStars = Math.floor(numRating);
            const emptyStars = 10 - fullStars;
            
            let stars = '★'.repeat(fullStars);
            stars += '☆'.repeat(emptyStars);
            
            return showNumber ? `${stars} (${numRating}/10)` : stars;
        } catch (error) {
            return '☆☆☆☆☆☆☆☆☆☆';
        }
    }

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @param {string} suffix - Suffix to add (default: '...')
     * @returns {string} Truncated text
     * 
     * @example
     * Utils.truncateText('This is a long text', 10)
     * // Returns: "This is a..."
     */
    static truncateText(text, maxLength, suffix = '...') {
        try {
            if (!text || typeof text !== 'string') return '';
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength - suffix.length) + suffix;
        } catch (error) {
            return text || '';
        }
    }

    /**
     * Convert data to CSV format
     * @param {Array} data - Array of objects to convert
     * @param {Array} headers - Optional custom headers
     * @returns {string} CSV formatted string
     * 
     * @example
     * Utils.convertToCSV([{name: 'John', age: 25}])
     * // Returns: "name,age\nJohn,25"
     */
    static convertToCSV(data, headers = null) {
        try {
            if (!Array.isArray(data) || data.length === 0) return '';
            
            const csvHeaders = headers || Object.keys(data[0]);
            const csvRows = data.map(row => 
                csvHeaders.map(header => {
                    const value = row[header] || '';
                    // Escape quotes and wrap in quotes if contains comma or quote
                    const stringValue = String(value).replace(/"/g, '""');
                    return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
                        ? `"${stringValue}"`
                        : stringValue;
                }).join(',')
            );
            
            return [csvHeaders.join(','), ...csvRows].join('\n');
        } catch (error) {
            ErrorHandler?.handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.SYSTEM,
                    `CSV conversion error: ${error.message}`,
                    { dataLength: data?.length }
                ),
                ErrorHandler.Severity.MEDIUM
            );
            return '';
        }
    }

    /**
     * Download data as file
     * @param {string} content - File content
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     * 
     * @example
     * Utils.downloadFile(csvData, 'feedback-report.csv', 'text/csv');
     */
    static downloadFile(content, filename, mimeType = 'text/plain') {
        try {
            const blob = new Blob([content], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
            
            console.log(`✅ File downloaded: ${filename}`);
        } catch (error) {
            ErrorHandler?.handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.SYSTEM,
                    `File download error: ${error.message}`,
                    { filename, mimeType }
                ),
                ErrorHandler.Severity.MEDIUM
            );
        }
    }

    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Get viewport dimensions
     * @returns {Object} Viewport width and height
     */
    static getViewportSize() {
        return {
            width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        };
    }

    /**
     * Scroll to element smoothly
     * @param {string|Element} element - Element selector or element
     * @param {Object} options - Scroll options
     */
    static scrollToElement(element, options = {}) {
        try {
            const targetElement = typeof element === 'string' 
                ? document.querySelector(element) 
                : element;
                
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    ...options
                });
            }
        } catch (error) {
            ErrorHandler?.handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.SYSTEM,
                    `Scroll to element error: ${error.message}`,
                    { element: typeof element === 'string' ? element : 'Element object' }
                ),
                ErrorHandler.Severity.LOW
            );
        }
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return success;
            }
        } catch (error) {
            ErrorHandler?.handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.SYSTEM,
                    `Clipboard copy error: ${error.message}`
                ),
                ErrorHandler.Severity.LOW
            );
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}