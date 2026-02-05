/**
 * Input Validation and Sanitization Utilities
 * Provides comprehensive validation for user inputs and data sanitization
 */

class Validator {
    /**
     * Validation rules configuration
     */
    static rules = {
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            maxLength: 255,
            minLength: 5
        },
        password: {
            minLength: 8,
            maxLength: 128,
            requireUppercase: true,
            requireLowercase: true,
            requireNumber: true,
            requireSpecial: false // Made optional for better UX
        },
        name: {
            minLength: 2,
            maxLength: 100,
            pattern: /^[a-zA-Z\s'-]+$/
        },
        rollNumber: {
            minLength: 3,
            maxLength: 20,
            pattern: /^[A-Z0-9]+$/
        },
        department: {
            minLength: 2,
            maxLength: 100
        }
    };

    /**
     * Sanitizes HTML input to prevent XSS attacks
     * @param {string} input - Raw user input
     * @returns {string} Sanitized input
     */
    static sanitizeHTML(input) {
        if (typeof input !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML.trim();
    }

    /**
     * Validates email format and constraints
     * @param {string} email - Email to validate
     * @returns {Object} Validation result
     */
    static validateEmail(email) {
        const sanitized = this.sanitizeHTML(email);
        const rule = this.rules.email;
        
        if (!sanitized) {
            return { isValid: false, message: 'Email is required' };
        }
        
        if (sanitized.length < rule.minLength) {
            return { isValid: false, message: `Email must be at least ${rule.minLength} characters` };
        }
        
        if (sanitized.length > rule.maxLength) {
            return { isValid: false, message: `Email must not exceed ${rule.maxLength} characters` };
        }
        
        if (!rule.pattern.test(sanitized)) {
            return { isValid: false, message: 'Please enter a valid email address' };
        }
        
        return { isValid: true, value: sanitized.toLowerCase() };
    }

    /**
     * Validates password strength and constraints
     * @param {string} password - Password to validate
     * @returns {Object} Validation result with strength score
     */
    static validatePassword(password) {
        const rule = this.rules.password;
        let score = 0;
        const feedback = [];
        
        if (!password) {
            return { isValid: false, message: 'Password is required', score: 0 };
        }
        
        if (password.length < rule.minLength) {
            return { 
                isValid: false, 
                message: `Password must be at least ${rule.minLength} characters long`,
                score: 0
            };
        }
        
        if (password.length > rule.maxLength) {
            return { 
                isValid: false, 
                message: `Password must not exceed ${rule.maxLength} characters`,
                score: 0
            };
        }
        
        // Check password strength
        if (/[a-z]/.test(password)) {
            score += 1;
        } else if (rule.requireLowercase) {
            feedback.push('lowercase letter');
        }
        
        if (/[A-Z]/.test(password)) {
            score += 1;
        } else if (rule.requireUppercase) {
            feedback.push('uppercase letter');
        }
        
        if (/[0-9]/.test(password)) {
            score += 1;
        } else if (rule.requireNumber) {
            feedback.push('number');
        }
        
        if (/[^a-zA-Z0-9]/.test(password)) {
            score += 1;
        } else if (rule.requireSpecial) {
            feedback.push('special character');
        }
        
        // Length bonus
        if (password.length >= 12) score += 1;
        
        const isValid = feedback.length === 0;
        const message = isValid ? 
            'Password is strong' : 
            `Password must contain: ${feedback.join(', ')}`;
        
        return { 
            isValid, 
            message, 
            score: Math.min(score, 5),
            strength: this.getPasswordStrength(score)
        };
    }

    /**
     * Gets password strength label
     * @param {number} score - Password score (0-5)
     * @returns {string} Strength label
     */
    static getPasswordStrength(score) {
        const strengths = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        return strengths[Math.min(score, 5)];
    }

    /**
     * Validates name input
     * @param {string} name - Name to validate
     * @returns {Object} Validation result
     */
    static validateName(name) {
        const sanitized = this.sanitizeHTML(name);
        const rule = this.rules.name;
        
        if (!sanitized) {
            return { isValid: false, message: 'Name is required' };
        }
        
        if (sanitized.length < rule.minLength) {
            return { isValid: false, message: `Name must be at least ${rule.minLength} characters` };
        }
        
        if (sanitized.length > rule.maxLength) {
            return { isValid: false, message: `Name must not exceed ${rule.maxLength} characters` };
        }
        
        if (!rule.pattern.test(sanitized)) {
            return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
        }
        
        return { isValid: true, value: sanitized.trim() };
    }

    /**
     * Validates roll number (no format restrictions)
     * @param {string} rollNumber - Roll number to validate
     * @returns {Object} Validation result
     */
    static validateRollNumber(rollNumber) {
        const sanitized = this.sanitizeHTML(rollNumber);
        
        if (!sanitized) {
            return { isValid: false, message: 'Roll number is required' };
        }
        
        if (sanitized.length < 1) {
            return { isValid: false, message: 'Roll number cannot be empty' };
        }
        
        if (sanitized.length > 50) {
            return { isValid: false, message: 'Roll number is too long' };
        }
        
        return { isValid: true, value: sanitized.trim() };
    }

    /**
     * Validates department name
     * @param {string} department - Department to validate
     * @returns {Object} Validation result
     */
    static validateDepartment(department) {
        const sanitized = this.sanitizeHTML(department);
        const rule = this.rules.department;
        
        if (!sanitized) {
            return { isValid: false, message: 'Department is required' };
        }
        
        if (sanitized.length < rule.minLength) {
            return { isValid: false, message: `Department must be at least ${rule.minLength} characters` };
        }
        
        if (sanitized.length > rule.maxLength) {
            return { isValid: false, message: `Department must not exceed ${rule.maxLength} characters` };
        }
        
        return { isValid: true, value: sanitized.trim() };
    }

    /**
     * Validates year input (1-3 years only)
     * @param {number|string} year - Year to validate
     * @returns {Object} Validation result
     */
    static validateYear(year) {
        const yearNum = parseInt(year);
        
        if (isNaN(yearNum)) {
            return { isValid: false, message: 'Year must be a number' };
        }
        
        if (yearNum < 1 || yearNum > 3) {
            return { isValid: false, message: 'Year must be between 1 and 3' };
        }
        
        return { isValid: true, value: yearNum };
    }

    /**
     * Validates form data comprehensively
     * @param {Object} formData - Form data to validate
     * @param {Array} requiredFields - List of required field names
     * @returns {Object} Validation result with all field errors
     */
    static validateForm(formData, requiredFields = []) {
        const errors = {};
        let isValid = true;
        
        // Check required fields
        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
                isValid = false;
            }
        });
        
        // Validate specific fields if present
        if (formData.email) {
            const emailValidation = this.validateEmail(formData.email);
            if (!emailValidation.isValid) {
                errors.email = emailValidation.message;
                isValid = false;
            }
        }
        
        if (formData.password) {
            const passwordValidation = this.validatePassword(formData.password);
            if (!passwordValidation.isValid) {
                errors.password = passwordValidation.message;
                isValid = false;
            }
        }
        
        if (formData.name || formData.fullName) {
            const nameField = formData.name || formData.fullName;
            const nameValidation = this.validateName(nameField);
            if (!nameValidation.isValid) {
                errors.name = nameValidation.message;
                isValid = false;
            }
        }
        
        if (formData.rollNumber) {
            const rollValidation = this.validateRollNumber(formData.rollNumber);
            if (!rollValidation.isValid) {
                errors.rollNumber = rollValidation.message;
                isValid = false;
            }
        }
        
        if (formData.department) {
            const deptValidation = this.validateDepartment(formData.department);
            if (!deptValidation.isValid) {
                errors.department = deptValidation.message;
                isValid = false;
            }
        }
        
        if (formData.year) {
            const yearValidation = this.validateYear(formData.year);
            if (!yearValidation.isValid) {
                errors.year = yearValidation.message;
                isValid = false;
            }
        }
        
        // Password confirmation check
        if (formData.password && formData.confirmPassword) {
            if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = 'Passwords do not match';
                isValid = false;
            }
        }
        
        return { isValid, errors };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validator;
} else {
    window.Validator = Validator;
}