/**
 * Comprehensive Error Handling System
 * Provides centralized error management, logging, and user feedback
 */

class ErrorHandler {
    /**
     * Error types enumeration
     */
    static ErrorTypes = {
        VALIDATION: 'validation',
        AUTHENTICATION: 'authentication',
        AUTHORIZATION: 'authorization',
        STORAGE: 'storage',
        NETWORK: 'network',
        SYSTEM: 'system',
        USER_INPUT: 'user_input'
    };

    /**
     * Error severity levels
     */
    static Severity = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    };

    /**
     * Initialize error handler with global error listeners
     */
    static init() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError({
                type: this.ErrorTypes.SYSTEM,
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            }, this.Severity.HIGH);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: this.ErrorTypes.SYSTEM,
                message: 'Unhandled Promise Rejection',
                reason: event.reason
            }, this.Severity.HIGH);
        });

        console.log('✅ Error Handler initialized');
    }

    /**
     * Main error handling method
     * @param {Object} error - Error object or details
     * @param {string} severity - Error severity level
     * @param {Object} context - Additional context information
     */
    static handleError(error, severity = this.Severity.MEDIUM, context = {}) {
        try {
            const errorInfo = this.processError(error, severity, context);
            
            // Log error
            this.logError(errorInfo);
            
            // Show user-friendly message
            this.showUserMessage(errorInfo);
            
            // Report to monitoring service (if available)
            this.reportError(errorInfo);
            
        } catch (handlingError) {
            console.error('Error in error handler:', handlingError);
            this.fallbackErrorDisplay('An unexpected error occurred. Please refresh the page.');
        }
    }

    /**
     * Process and normalize error information
     * @param {Object} error - Raw error
     * @param {string} severity - Error severity
     * @param {Object} context - Additional context
     * @returns {Object} Processed error information
     */
    static processError(error, severity, context) {
        const timestamp = new Date().toISOString();
        const userAgent = navigator.userAgent;
        const url = window.location.href;
        
        let processedError = {
            id: this.generateErrorId(),
            timestamp,
            severity,
            url,
            userAgent,
            context,
            type: error.type || this.ErrorTypes.SYSTEM,
            message: error.message || 'Unknown error occurred',
            stack: error.stack || error.error?.stack,
            originalError: error
        };

        // Add user information if available
        try {
            const currentUser = Storage?.getCurrentUser();
            if (currentUser) {
                processedError.userId = currentUser.id;
                processedError.userRole = currentUser.role;
            }
        } catch (e) {
            // Ignore if Storage is not available
        }

        return processedError;
    }

    /**
     * Generate unique error ID
     * @returns {string} Unique error identifier
     */
    static generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Log error to console and local storage
     * @param {Object} errorInfo - Processed error information
     */
    static logError(errorInfo) {
        // Console logging with appropriate level
        switch (errorInfo.severity) {
            case this.Severity.CRITICAL:
                console.error('🚨 CRITICAL ERROR:', errorInfo);
                break;
            case this.Severity.HIGH:
                console.error('❌ HIGH SEVERITY ERROR:', errorInfo);
                break;
            case this.Severity.MEDIUM:
                console.warn('⚠️ MEDIUM SEVERITY ERROR:', errorInfo);
                break;
            case this.Severity.LOW:
                console.info('ℹ️ LOW SEVERITY ERROR:', errorInfo);
                break;
            default:
                console.log('📝 ERROR:', errorInfo);
        }

        // Store in localStorage for debugging (keep last 50 errors)
        try {
            const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
            errorLog.unshift(errorInfo);
            
            // Keep only last 50 errors
            if (errorLog.length > 50) {
                errorLog.splice(50);
            }
            
            localStorage.setItem('errorLog', JSON.stringify(errorLog));
        } catch (e) {
            console.warn('Could not save error to localStorage:', e);
        }
    }

    /**
     * Show user-friendly error message
     * @param {Object} errorInfo - Processed error information
     */
    static showUserMessage(errorInfo) {
        const userMessage = this.getUserFriendlyMessage(errorInfo);
        const messageType = this.getMessageType(errorInfo.severity);
        
        // Try to use existing alert system
        if (typeof showAlert === 'function') {
            showAlert(userMessage, messageType);
        } else {
            // Fallback to custom notification
            this.showNotification(userMessage, messageType);
        }
    }

    /**
     * Get user-friendly error message
     * @param {Object} errorInfo - Error information
     * @returns {string} User-friendly message
     */
    static getUserFriendlyMessage(errorInfo) {
        const messages = {
            [this.ErrorTypes.VALIDATION]: 'Please check your input and try again.',
            [this.ErrorTypes.AUTHENTICATION]: 'Please check your login credentials.',
            [this.ErrorTypes.AUTHORIZATION]: 'You do not have permission to perform this action.',
            [this.ErrorTypes.STORAGE]: 'There was a problem saving your data. Please try again.',
            [this.ErrorTypes.NETWORK]: 'Network connection problem. Please check your internet connection.',
            [this.ErrorTypes.SYSTEM]: 'An unexpected error occurred. Please refresh the page.',
            [this.ErrorTypes.USER_INPUT]: 'Please check your input and try again.'
        };

        let baseMessage = messages[errorInfo.type] || messages[this.ErrorTypes.SYSTEM];
        
        // Add error ID for critical errors
        if (errorInfo.severity === this.Severity.CRITICAL) {
            baseMessage += ` (Error ID: ${errorInfo.id})`;
        }
        
        return baseMessage;
    }

    /**
     * Get message type for alert system
     * @param {string} severity - Error severity
     * @returns {string} Message type
     */
    static getMessageType(severity) {
        switch (severity) {
            case this.Severity.CRITICAL:
            case this.Severity.HIGH:
                return 'danger';
            case this.Severity.MEDIUM:
                return 'warning';
            case this.Severity.LOW:
                return 'info';
            default:
                return 'danger';
        }
    }

    /**
     * Show custom notification
     * @param {string} message - Message to display
     * @param {string} type - Message type
     */
    static showNotification(message, type = 'danger') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `error-notification error-${type}`;
        notification.innerHTML = `
            <div class="error-content">
                <span class="error-icon">${this.getErrorIcon(type)}</span>
                <span class="error-message">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles if not already present
        this.addNotificationStyles();
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Get error icon for notification
     * @param {string} type - Message type
     * @returns {string} Icon
     */
    static getErrorIcon(type) {
        const icons = {
            danger: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            success: '✅'
        };
        return icons[type] || icons.danger;
    }

    /**
     * Add notification styles to page
     */
    static addNotificationStyles() {
        if (document.getElementById('error-notification-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'error-notification-styles';
        styles.textContent = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 400px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
            }
            
            .error-danger { border-left: 4px solid #e74a3b; }
            .error-warning { border-left: 4px solid #f39c12; }
            .error-info { border-left: 4px solid #3498db; }
            .error-success { border-left: 4px solid #1cc88a; }
            
            .error-content {
                display: flex;
                align-items: center;
                padding: 15px;
                gap: 10px;
            }
            
            .error-icon {
                font-size: 1.2rem;
                flex-shrink: 0;
            }
            
            .error-message {
                flex: 1;
                font-size: 0.9rem;
                line-height: 1.4;
            }
            
            .error-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .error-close:hover {
                color: #666;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Report error to external monitoring service
     * @param {Object} errorInfo - Error information
     */
    static reportError(errorInfo) {
        // In a real application, you would send this to a service like Sentry, LogRocket, etc.
        // For now, we'll just log it
        if (errorInfo.severity === this.Severity.CRITICAL || errorInfo.severity === this.Severity.HIGH) {
            console.log('📊 Error would be reported to monitoring service:', {
                id: errorInfo.id,
                type: errorInfo.type,
                message: errorInfo.message,
                severity: errorInfo.severity,
                timestamp: errorInfo.timestamp
            });
        }
    }

    /**
     * Fallback error display for when everything else fails
     * @param {string} message - Error message
     */
    static fallbackErrorDisplay(message) {
        alert(message);
    }

    /**
     * Get error log from localStorage
     * @returns {Array} Array of logged errors
     */
    static getErrorLog() {
        try {
            return JSON.parse(localStorage.getItem('errorLog') || '[]');
        } catch (e) {
            return [];
        }
    }

    /**
     * Clear error log
     */
    static clearErrorLog() {
        try {
            localStorage.removeItem('errorLog');
            console.log('✅ Error log cleared');
        } catch (e) {
            console.warn('Could not clear error log:', e);
        }
    }

    /**
     * Create error with specific type and context
     * @param {string} type - Error type
     * @param {string} message - Error message
     * @param {Object} context - Additional context
     * @returns {Object} Error object
     */
    static createError(type, message, context = {}) {
        return {
            type,
            message,
            context,
            timestamp: new Date().toISOString()
        };
    }
}

// Initialize error handler when script loads
if (typeof window !== 'undefined') {
    ErrorHandler.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
} else {
    window.ErrorHandler = ErrorHandler;
}