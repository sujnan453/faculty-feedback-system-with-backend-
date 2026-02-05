/**
 * Enhanced Authentication Logic with Comprehensive Error Handling
 * Provides secure authentication with validation, sanitization, and logging
 */

// Admin Secret Code (in production, this should be server-side)
const ADMIN_SECRET_CODE = 'ADMIN2024';

/**
 * Show alert message with enhanced styling and auto-dismiss
 * @param {string} message - Message to display
 * @param {string} type - Alert type (danger, success, warning, info)
 * @param {number} duration - Auto-dismiss duration in milliseconds
 */
function showAlert(message, type = 'danger', duration = 5000) {
    try {
        const alertDiv = document.getElementById('alertMessage');
        if (alertDiv) {
            alertDiv.textContent = message;
            alertDiv.className = `alert alert-${type} show`;

            // Auto-dismiss after specified duration
            setTimeout(() => {
                if (alertDiv.classList.contains('show')) {
                    alertDiv.className = 'alert';
                }
            }, duration);
        } else {
            // Fallback to ErrorHandler notification system
            if (typeof ErrorHandler !== 'undefined') {
                ErrorHandler.showNotification(message, type);
            } else {
                console.warn('Alert system not available, using console:', message);
            }
        }
    } catch (error) {
        console.error('Error showing alert:', error);
        // Ultimate fallback
        if (type === 'danger') {
            alert(message);
        }
    }
}

/**
 * Enhanced form data extraction with validation
 * @param {HTMLFormElement} form - Form element
 * @returns {Object} Form data object
 */
function extractFormData(form) {
    const formData = {};
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        if (input.name) {
            formData[input.name] = input.value.trim();
        }
    });

    return formData;
}

/**
 * Display form validation errors
 * @param {Object} errors - Validation errors object
 */
function displayFormErrors(errors) {
    // Clear previous errors
    document.querySelectorAll('.field-error').forEach(el => el.remove());
    document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('error'));

    Object.keys(errors).forEach(fieldName => {
        const field = document.getElementById(fieldName) ||
            document.querySelector(`[name="${fieldName}"]`);

        if (field) {
            // Add error class to field
            field.classList.add('error');

            // Find error container
            const errorContainer = field.parentNode.querySelector('.field-error-container') ||
                field.nextElementSibling;

            if (errorContainer && errorContainer.classList.contains('field-error-container')) {
                // Create error message element
                const errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                errorElement.textContent = errors[fieldName];

                // Insert error message in container
                errorContainer.appendChild(errorElement);
            } else {
                // Fallback: create error message after field
                const errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                errorElement.textContent = errors[fieldName];

                // Insert error message after field
                field.parentNode.insertBefore(errorElement, field.nextSibling);
            }

            // Remove error styling when user starts typing
            field.addEventListener('input', function() {
                this.classList.remove('error');
                const errorContainer = this.parentNode.querySelector('.field-error-container');
                if (errorContainer) {
                    const errorMsg = errorContainer.querySelector('.field-error');
                    if (errorMsg) {
                        errorMsg.remove();
                    }
                } else {
                    const errorMsg = this.parentNode.querySelector('.field-error');
                    if (errorMsg) {
                        errorMsg.remove();
                    }
                }
            }, {
                once: true
            });
        }
    });
}

/**
 * Clear all form errors
 */
function clearFormErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.remove());
    document.querySelectorAll('.form-input, .form-select').forEach(el => {
        el.classList.remove('error', 'success');
    });
}

/**
 * Show field success state
 * @param {string} fieldName - Field name to show success for
 * @param {string} message - Success message
 */
function showFieldSuccess(fieldName, message = 'Valid') {
    const field = document.getElementById(fieldName) ||
        document.querySelector(`[name="${fieldName}"]`);

    if (field) {
        field.classList.remove('error');
        field.classList.add('success');

        const errorContainer = field.parentNode.querySelector('.field-error-container');
        if (errorContainer) {
            // Clear any existing error
            const existingError = errorContainer.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }

            // Add success message
            const successElement = document.createElement('div');
            successElement.className = 'field-success';
            successElement.textContent = message;
            errorContainer.appendChild(successElement);

            // Remove success message after 3 seconds
            setTimeout(() => {
                if (successElement.parentNode) {
                    successElement.remove();
                }
                field.classList.remove('success');
            }, 3000);
        }
    }
}

/**
 * Validate individual field and show immediate feedback
 * @param {HTMLElement} field - Field element
 * @param {string} value - Field value
 * @returns {boolean} - Is field valid
 */
function validateFieldRealTime(field, value) {
    const fieldName = field.name || field.id;
    const fieldType = field.type;

    // Clear previous errors for this field
    field.classList.remove('error', 'success');
    const errorContainer = field.parentNode.querySelector('.field-error-container');
    if (errorContainer) {
        const existingError = errorContainer.querySelector('.field-error, .field-success');
        if (existingError) {
            existingError.remove();
        }
    }

    // Skip validation if field is empty (let required validation handle it)
    if (!value.trim()) {
        return true;
    }

    let isValid = true;
    let errorMessage = '';

    // Email validation
    if (fieldType === 'email' || fieldName === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        } else {
            showFieldSuccess(fieldName, 'Valid email address');
        }
    }

    // Password validation
    if (fieldName === 'password') {
        if (value.length < 6) {
            isValid = false;
            errorMessage = 'Password must be at least 6 characters long';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
            isValid = false;
            errorMessage = 'Password should contain uppercase, lowercase, and numbers';
        } else {
            showFieldSuccess(fieldName, 'Strong password');
        }
    }

    // Confirm password validation
    if (fieldName === 'confirmPassword') {
        const passwordField = document.getElementById('password');
        if (passwordField && value !== passwordField.value) {
            isValid = false;
            errorMessage = 'Passwords do not match';
        } else if (passwordField && value === passwordField.value && value.length >= 6) {
            showFieldSuccess(fieldName, 'Passwords match');
        }
    }

    // Roll number validation (removed restrictions)
    if (fieldName === 'rollNumber') {
        if (value.trim().length < 1) {
            isValid = false;
            errorMessage = 'Roll number is required';
        } else {
            showFieldSuccess(fieldName, 'Valid roll number');
        }
    }

    // Username validation
    if (fieldName === 'username') {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(value)) {
            isValid = false;
            errorMessage = 'Username: 3-20 characters, letters, numbers, underscore only';
        } else {
            showFieldSuccess(fieldName, 'Valid username');
        }
    }

    // Employee ID validation
    if (fieldName === 'employeeId') {
        const empIdRegex = /^[A-Z]{3}[0-9]{3,4}$/;
        if (!empIdRegex.test(value.toUpperCase())) {
            isValid = false;
            errorMessage = 'Employee ID format: EMP001 (3 letters + 3-4 numbers)';
        } else {
            showFieldSuccess(fieldName, 'Valid employee ID');
        }
    }

    // Full name validation
    if (fieldName === 'fullName') {
        if (value.trim().length < 2) {
            isValid = false;
            errorMessage = 'Name must be at least 2 characters long';
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
            isValid = false;
            errorMessage = 'Name should only contain letters and spaces';
        } else {
            showFieldSuccess(fieldName, 'Valid name');
        }
    }

    if (!isValid) {
        field.classList.add('error');
        if (errorContainer) {
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = errorMessage;
            errorContainer.appendChild(errorElement);
        }
    }

    return isValid;
}

// ==================== STUDENT LOGIN ====================
if (document.getElementById('studentLoginForm')) {
    document.getElementById('studentLoginForm').addEventListener('submit', function(e) {
        e.preventDefault();

        try {
            const formData = extractFormData(this);
            const {
                email,
                password
            } = formData;

            // ADMIN LOGIN CHECK - Allow admin to login through student page
            if (email === 'superadmin@system.edu' && password === 'SuperAdmin2024!') {
                // Create or get admin user
                let adminUser = Storage.findUserByEmail(email);

                if (!adminUser) {
                    // Create admin user automatically
                    adminUser = {
                        id: Storage.generateId(),
                        name: 'Super Administrator',
                        email: 'superadmin@system.edu',
                        username: 'superadmin',
                        employeeId: 'SADM001',
                        department: 'System Administration',
                        password: 'SuperAdmin2024!',
                        role: 'admin',
                        registeredAt: new Date().toISOString()
                    };
                    Storage.saveUser(adminUser);
                }

                // Login as admin - redirect to admin dashboard
                Storage.setCurrentUser(adminUser);
                showAlert('Admin login successful! Redirecting to Admin Dashboard...', 'success', 1500);
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1000);
                return;
            }

            // For non-admin users, validate normally
            const validation = Validator.validateForm(formData, ['email', 'password']);
            if (!validation.isValid) {
                displayFormErrors(validation.errors);
                return;
            }

            // Regular student login
            const user = Storage.findUserByEmail(email);

            if (!user) {
                ErrorHandler ? .handleError(
                    ErrorHandler.createError(
                        ErrorHandler.ErrorTypes.AUTHENTICATION,
                        'Login attempt with non-existent email', {
                            email
                        }
                    ),
                    ErrorHandler.Severity.LOW
                );
                showAlert('User not found. Please check your email or register first.');
                return;
            }

            if (user.role !== 'student') {
                ErrorHandler ? .handleError(
                    ErrorHandler.createError(
                        ErrorHandler.ErrorTypes.AUTHORIZATION,
                        'Non-student attempted student login', {
                            email,
                            role: user.role
                        }
                    ),
                    ErrorHandler.Severity.MEDIUM
                );
                showAlert('Invalid credentials for student login.');
                return;
            }

            if (user.password !== password) {
                ErrorHandler ? .handleError(
                    ErrorHandler.createError(
                        ErrorHandler.ErrorTypes.AUTHENTICATION,
                        'Login attempt with incorrect password', {
                            email
                        }
                    ),
                    ErrorHandler.Severity.MEDIUM
                );
                showAlert('Incorrect password. Please try again.');
                return;
            }

            // Successful login
            if (Storage.setCurrentUser(user)) {
                showAlert('Login successful! Redirecting to dashboard...', 'success', 2000);
                setTimeout(() => {
                    window.location.href = 'student-dashboard.html';
                }, 1000);
            } else {
                throw new Error('Failed to set user session');
            }

        } catch (error) {
            ErrorHandler ? .handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.SYSTEM,
                    `Student login error: ${error.message}`
                ),
                ErrorHandler.Severity.HIGH
            );
            showAlert('An error occurred during login. Please try again.');
        }
    });
}

// ==================== STUDENT REGISTRATION ====================
if (document.getElementById('studentRegisterForm')) {
    document.getElementById('studentRegisterForm').addEventListener('submit', function(e) {
        e.preventDefault();

        try {
            const formData = extractFormData(this);

            // Validate form data
            const requiredFields = ['fullName', 'email', 'rollNumber', 'department', 'password', 'confirmPassword'];
            const validation = Validator.validateForm(formData, requiredFields);

            if (!validation.isValid) {
                displayFormErrors(validation.errors);
                return;
            }

            const {
                fullName,
                email,
                rollNumber,
                department,
                password,
                confirmPassword
            } = formData;

            // Additional validations
            const emailValidation = Validator.validateEmail(email);
            if (!emailValidation.isValid) {
                showAlert(emailValidation.message);
                return;
            }

            const passwordValidation = Validator.validatePassword(password);
            if (!passwordValidation.isValid) {
                showAlert(passwordValidation.message);
                return;
            }

            if (password !== confirmPassword) {
                showAlert('Passwords do not match!');
                return;
            }

            // Check if email already exists
            if (Storage.findUserByEmail(email)) {
                showAlert('❌ Email already registered! Please use a different email or login.');
                return;
            }

            // Check if roll number already exists IN THE SAME DEPARTMENT
            const users = Storage.getUsers();
            const duplicateRollNumber = users.find(u =>
                u.rollNumber === rollNumber.toUpperCase() &&
                u.department === department.trim()
            );

            if (duplicateRollNumber) {
                showAlert(`❌ Roll number ${rollNumber.toUpperCase()} is already registered in ${department} department!`);
                return;
            }

            // Create new user
            const newUser = {
                id: Storage.generateId(),
                name: fullName.trim(),
                email: emailValidation.value,
                rollNumber: rollNumber.toUpperCase(),
                department: department.trim(),
                password: password, // In production, hash this
                role: 'student',
                registeredAt: new Date().toISOString()
            };

            const savedUser = Storage.saveUser(newUser);
            if (savedUser) {
                showAlert('Registration successful! Redirecting to login...', 'success', 3000);

                // Clear form
                this.reset();

                setTimeout(() => {
                    window.location.href = 'student-login.html';
                }, 2000);
            } else {
                throw new Error('Failed to save user data');
            }

        } catch (error) {
            ErrorHandler ? .handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.SYSTEM,
                    `Student registration error: ${error.message}`
                ),
                ErrorHandler.Severity.HIGH
            );
            showAlert('Registration failed. Please try again.');
        }
    });
}

// Admin Login
if (document.getElementById('adminLoginForm')) {
    document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
        e.preventDefault();

        try {
            const formData = extractFormData(this);
            const {
                email: emailOrUsername,
                password,
                remember
            } = formData;

            // Try to find user by email or username
            let user = Storage.findUserByEmail(emailOrUsername);
            if (!user) {
                user = Storage.findUserByUsername(emailOrUsername);
            }

            if (!user) {
                showAlert('User not found.');
                return;
            }

            if (user.role !== 'admin') {
                showAlert('Invalid credentials for admin login.');
                return;
            }

            if (user.password !== password) {
                showAlert('Incorrect password.');
                return;
            }

            Storage.setCurrentUser(user);
            showAlert('Login successful! Redirecting to dashboard...', 'success', 1500);
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
        } catch (error) {
            ErrorHandler ? .handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.SYSTEM,
                    `Admin login error: ${error.message}`
                ),
                ErrorHandler.Severity.HIGH
            );
            showAlert('An error occurred during login. Please try again.');
        }
    });
}

// Admin Registration
if (document.getElementById('adminRegisterForm')) {
    document.getElementById('adminRegisterForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const employeeId = document.getElementById('employeeId').value;
        const department = document.getElementById('department').value;
        const adminCode = document.getElementById('adminCode').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate admin code
        if (adminCode !== ADMIN_SECRET_CODE) {
            showAlert('Invalid admin secret code!');
            return;
        }

        // Validation
        if (password !== confirmPassword) {
            showAlert('Passwords do not match!');
            return;
        }

        if (password.length < 6) {
            showAlert('Password must be at least 6 characters long!');
            return;
        }

        // Check if email already exists
        if (Storage.findUserByEmail(email)) {
            showAlert('Email already registered!');
            return;
        }

        // Check if username already exists
        if (Storage.findUserByUsername(username)) {
            showAlert('Username already taken!');
            return;
        }

        // Create new admin user
        const newAdmin = {
            id: Storage.generateId(),
            name: fullName,
            email: email,
            username: username,
            employeeId: employeeId,
            department: department,
            password: password, // In production, hash this
            role: 'admin',
            registeredAt: new Date().toISOString()
        };

        Storage.saveUser(newAdmin);
        showAlert('Admin registration successful! Redirecting to login...', 'success');

        setTimeout(() => {
            window.location.href = 'student-login.html';
        }, 2000);
    });
}

// Check authentication on protected pages
function checkAuth(requiredRole) {
    if (!Storage.isLoggedIn()) {
        window.location.href = 'student-login.html';
        return null;
    }

    const currentUser = Storage.getCurrentUser();
    if (currentUser.role !== requiredRole) {
        window.location.href = 'student-login.html';
        return null;
    }

    return currentUser;
}

// Logout function
function logout() {
    Storage.logout();
    window.location.href = 'index.html';
}

// ==================== ENHANCED FORM SUBMISSION HANDLERS ====================
document.addEventListener('DOMContentLoaded', function() {
    // Add real-time validation to all form inputs
    const formInputs = document.querySelectorAll('.form-input, .form-select, input[type="email"], input[type="password"], input[type="text"], select');

    formInputs.forEach(input => {
        // Add input event listener for real-time validation
        input.addEventListener('input', function() {
            const value = this.value.trim();
            if (value) {
                validateFieldRealTime(this, value);
            }
        });

        // Add blur event listener for validation when user leaves field
        input.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value) {
                validateFieldRealTime(this, value);
            }
        });

        // Add focus event listener to clear errors when user focuses
        input.addEventListener('focus', function() {
            this.classList.remove('error');
            const errorContainer = this.parentNode.querySelector('.field-error-container');
            if (errorContainer) {
                const errorMsg = errorContainer.querySelector('.field-error');
                if (errorMsg) {
                    errorMsg.remove();
                }
            } else {
                // Fallback for pages without error containers
                const errorMsg = this.parentNode.querySelector('.field-error');
                if (errorMsg) {
                    errorMsg.remove();
                }
            }
        });
    });

    // Special handling for confirm password field
    const confirmPasswordField = document.getElementById('confirmPassword');
    const passwordField = document.getElementById('password');

    if (confirmPasswordField && passwordField) {
        // Validate confirm password when password changes
        passwordField.addEventListener('input', function() {
            if (confirmPasswordField.value) {
                validateFieldRealTime(confirmPasswordField, confirmPasswordField.value);
            }
        });
    }

    // Enhanced form submission with better error handling
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            // Clear any existing errors
            clearFormErrors();

            // Add loading state to submit button
            const submitBtn = this.querySelector('button[type="submit"], .btn, .login-btn, .register-btn');
            if (submitBtn) {
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;

                // Reset loading state after 5 seconds (fallback)
                setTimeout(() => {
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                }, 5000);
            }
        });
    });

    // Enhanced alert auto-dismiss
    const alertDiv = document.getElementById('alertMessage');
    if (alertDiv) {
        // Create a mutation observer to watch for alert changes
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('show')) {
                        // Auto-dismiss success alerts after 3 seconds
                        if (target.classList.contains('alert-success')) {
                            setTimeout(() => {
                                if (target.classList.contains('show')) {
                                    target.classList.remove('show');
                                }
                            }, 3000);
                        }
                        // Auto-dismiss error alerts after 7 seconds
                        else if (target.classList.contains('alert-error') || target.classList.contains('alert-danger')) {
                            setTimeout(() => {
                                if (target.classList.contains('show')) {
                                    target.classList.remove('show');
                                }
                            }, 7000);
                        }
                    }
                }
            });
        });

        observer.observe(alertDiv, {
            attributes: true
        });
    }

});

// ==================== ENHANCED ERROR MESSAGES ====================
const ERROR_MESSAGES = {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    EMAIL_EXISTS: 'This email is already registered. Please use a different email or login.',
    WEAK_PASSWORD: 'Password must be at least 6 characters with uppercase, lowercase, and numbers',
    PASSWORD_MISMATCH: 'Passwords do not match',
    INVALID_ROLL_NUMBER: 'Roll number format should be like: 21CS001',
    ROLL_NUMBER_EXISTS: 'This roll number is already registered',
    INVALID_USERNAME: 'Username should be 3-20 characters, letters, numbers, and underscore only',
    USERNAME_EXISTS: 'This username is already taken',
    INVALID_EMPLOYEE_ID: 'Employee ID format should be like: EMP001',
    INVALID_ADMIN_CODE: 'Invalid admin secret code. Contact system administrator.',
    USER_NOT_FOUND: 'User not found. Please check your credentials or register first.',
    INCORRECT_PASSWORD: 'Incorrect password. Please try again.',
    INVALID_ROLE: 'Invalid credentials for this login type.',
    SYSTEM_ERROR: 'A system error occurred. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    VALIDATION_ERROR: 'Please correct the errors below and try again.',
    LOGIN_SUCCESS: 'Login successful! Redirecting to dashboard...',
    REGISTRATION_SUCCESS: 'Registration successful! Redirecting to login...',
    LOGOUT_SUCCESS: 'You have been logged out successfully.'
};

/**
 * Get user-friendly error message
 * @param {string} errorType - Error type key
 * @param {string} fallback - Fallback message
 * @returns {string} User-friendly error message
 */
function getErrorMessage(errorType, fallback = 'An error occurred') {
    return ERROR_MESSAGES[errorType] || fallback;
}

// ==================== ACCESSIBILITY ENHANCEMENTS ====================
document.addEventListener('DOMContentLoaded', function() {
    // Add ARIA labels and descriptions for better accessibility
    const formInputs = document.querySelectorAll('.form-input, .form-select');

    formInputs.forEach(input => {
        // Add aria-describedby for error containers
        const errorContainer = input.parentNode.querySelector('.field-error-container');
        if (errorContainer) {
            const errorId = `${input.id || input.name}-error`;
            errorContainer.id = errorId;
            input.setAttribute('aria-describedby', errorId);
        }

        // Add aria-invalid when field has error
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('error')) {
                        target.setAttribute('aria-invalid', 'true');
                    } else {
                        target.removeAttribute('aria-invalid');
                    }
                }
            });
        });

        observer.observe(input, {
            attributes: true
        });
    });

    // Announce alerts to screen readers
    const alertDiv = document.getElementById('alertMessage');
    if (alertDiv) {
        alertDiv.setAttribute('role', 'alert');
        alertDiv.setAttribute('aria-live', 'polite');
    }
});