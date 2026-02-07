/**
 * Enhanced LocalStorage Management System with Security
 * Provides robust data management with error handling, validation, logging, and security
 * 
 * @class Storage
 * @description Centralized storage management for Faculty Feedback System
 */

const Storage = {
    /**
     * Storage keys enumeration for consistency
     */
    KEYS: {
        USERS: 'users',
        CURRENT_USER: 'currentUser',
        SURVEYS: 'surveys',
        FEEDBACKS: 'feedbacks',
        DEPARTMENTS: 'departments',
        QUESTIONS: 'questions'
    },

    /**
     * Security: Sanitize HTML input to prevent XSS attacks
     * @param {string} input - Input string to sanitize
     * @returns {string} Sanitized string
     */
    _sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    },

    /**
     * Security: Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    _isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Security: Check for potential SQL injection patterns (even though we're using localStorage)
     * @param {string} input - Input to check
     * @returns {boolean} Is safe input
     */
    _isSafeInput(input) {
        if (typeof input !== 'string') return true;

        const dangerousPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
            /(--|\/\*|\*\/|;)/g,
            /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi
        ];

        return !dangerousPatterns.some(pattern => pattern.test(input));
    },

    /**
     * Enhanced safe get with security validation
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Parsed data or default value
     */
    _safeGet(key, defaultValue = null) {
        try {
            // Validate key
            if (!key || typeof key !== 'string' || !this._isSafeInput(key)) {
                console.warn('Invalid storage key provided');
                return defaultValue;
            }

            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;

            const parsed = JSON.parse(item);

            // Basic validation of parsed data
            if (parsed && typeof parsed === 'object') {
                return this._sanitizeStorageData(parsed);
            }

            return parsed;
        } catch (error) {
            ErrorHandler ? .handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.STORAGE,
                    `Failed to retrieve data for key: ${key}`, {
                        key,
                        error: error.message
                    }
                ),
                ErrorHandler.Severity.MEDIUM
            );
            return defaultValue;
        }
    },

    /**
     * Security: Sanitize storage data recursively
     * @param {*} data - Data to sanitize
     * @returns {*} Sanitized data
     */
    _sanitizeStorageData(data) {
        if (typeof data === 'string') {
            return this._sanitizeInput(data);
        } else if (Array.isArray(data)) {
            return data.map(item => this._sanitizeStorageData(item));
        } else if (data && typeof data === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[this._sanitizeInput(key)] = this._sanitizeStorageData(value);
            }
            return sanitized;
        }
        return data;
    },

    /**
     * Enhanced safe set with security validation and size limits
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    _safeSet(key, value) {
        try {
            // Validate key
            if (!key || typeof key !== 'string' || !this._isSafeInput(key)) {
                console.warn('Invalid storage key provided');
                return false;
            }

            // Sanitize value
            const sanitizedValue = this._sanitizeStorageData(value);
            const serialized = JSON.stringify(sanitizedValue);

            // Check size limit (5MB for localStorage)
            if (serialized.length > 5 * 1024 * 1024) {
                console.warn('Data too large for localStorage');
                return false;
            }

            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded. Attempting cleanup...');
                this._cleanupOldData();
                // Try again after cleanup
                try {
                    localStorage.setItem(key, JSON.stringify(this._sanitizeStorageData(value)));
                    return true;
                } catch (retryError) {
                    console.error('Storage still full after cleanup');
                    return false;
                }
            }

            ErrorHandler ? .handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.STORAGE,
                    `Failed to save data for key: ${key}`, {
                        key,
                        error: error.message,
                        dataSize: JSON.stringify(value).length
                    }
                ),
                ErrorHandler.Severity.HIGH
            );
            return false;
        }
    },

    /**
     * Security: Clean up old data to free storage space
     */
    _cleanupOldData() {
        try {
            // Remove old session data
            const currentUser = this._safeGet(this.KEYS.CURRENT_USER);
            if (currentUser && currentUser.lastActivity) {
                const lastActivity = new Date(currentUser.lastActivity);
                const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

                // Remove session if inactive for more than 30 days
                if (daysSinceActivity > 30) {
                    localStorage.removeItem(this.KEYS.CURRENT_USER);
                    sessionStorage.removeItem(this.KEYS.CURRENT_USER);
                }
            }
        } catch (error) {
            console.warn('Error during cleanup:', error);
        }
    },

    /**
     * Generate unique ID with better entropy
     * @returns {string} Unique identifier
     */
    generateId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const counter = (this._idCounter = (this._idCounter || 0) + 1);
        return `${timestamp}_${random}_${counter}`;
    },

    // ==================== USER MANAGEMENT ====================

    /**
     * Get all users from storage
     * @returns {Array} Array of user objects
     */
    getUsers() {
        return this._safeGet(this.KEYS.USERS, []);
    },

    /**
     * Save a new user with enhanced validation and security
     * @param {Object} user - User object to save
     * @returns {Object|null} Saved user or null if failed
     */
    saveUser(user) {
        try {
            // Validate user object
            if (!user || typeof user !== 'object') {
                throw new Error('Invalid user object');
            }

            // Required fields validation
            const requiredFields = ['name', 'email', 'role'];
            for (const field of requiredFields) {
                if (!user[field]) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }

            // Security validations
            if (!this._isValidEmail(user.email)) {
                throw new Error('Invalid email format');
            }

            if (!this._isSafeInput(user.name) || !this._isSafeInput(user.email)) {
                throw new Error('Invalid characters detected in user data');
            }

            // Sanitize user data
            const sanitizedUser = {
                ...user,
                id: user.id || this.generateId(),
                name: this._sanitizeInput(user.name),
                email: user.email.toLowerCase().trim(),
                registeredAt: user.registeredAt || new Date().toISOString()
            };

            // Additional field sanitization
            if (user.rollNumber) {
                sanitizedUser.rollNumber = this._sanitizeInput(user.rollNumber.toUpperCase());
            }
            if (user.department) {
                sanitizedUser.department = this._sanitizeInput(user.department);
            }
            if (user.username) {
                sanitizedUser.username = this._sanitizeInput(user.username.toLowerCase());
            }

            const users = this.getUsers();

            // Check for duplicate email
            if (users.some(u => u.email === sanitizedUser.email && u.id !== sanitizedUser.id)) {
                throw new Error('Email already exists');
            }

            // Check for duplicate username (if provided)
            if (sanitizedUser.username && users.some(u => u.username === sanitizedUser.username && u.id !== sanitizedUser.id)) {
                throw new Error('Username already exists');
            }

            users.push(sanitizedUser);

            if (this._safeSet(this.KEYS.USERS, users)) {
                console.log(`✅ User saved: ${sanitizedUser.email}`);
                return sanitizedUser;
            }

            return null;
        } catch (error) {
            ErrorHandler ? .handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.STORAGE,
                    `Failed to save user: ${error.message}`, {
                        user: user ? .email || 'unknown'
                    }
                ),
                ErrorHandler.Severity.HIGH
            );
            return null;
        }
    },

    /**
     * Find user by email with error handling
     * @param {string} email - Email to search for
     * @returns {Object|null} User object or null if not found
     */
    findUserByEmail(email) {
        try {
            if (!email || typeof email !== 'string') {
                return null;
            }

            const users = this.getUsers();
            return users.find(user => user.email === email.toLowerCase().trim()) || null;
        } catch (error) {
            ErrorHandler ? .handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.STORAGE,
                    `Failed to find user by email: ${error.message}`, {
                        email
                    }
                ),
                ErrorHandler.Severity.MEDIUM
            );
            return null;
        }
    },

    /**
     * Find user by username with error handling
     * @param {string} username - Username to search for
     * @returns {Object|null} User object or null if not found
     */
    findUserByUsername(username) {
        try {
            if (!username || typeof username !== 'string') {
                return null;
            }

            const users = this.getUsers();
            return users.find(user => user.username === username.toLowerCase().trim()) || null;
        } catch (error) {
            ErrorHandler ? .handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.STORAGE,
                    `Failed to find user by username: ${error.message}`, {
                        username
                    }
                ),
                ErrorHandler.Severity.MEDIUM
            );
            return null;
        }
    },

    /**
     * Find user by ID with error handling
     * @param {string} id - User ID to search for
     * @returns {Object|null} User object or null if not found
     */
    findUserById(id) {
        try {
            if (!id) {
                return null;
            }

            const users = this.getUsers();
            return users.find(user => user.id === id) || null;
        } catch (error) {
            ErrorHandler ? .handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.STORAGE,
                    `Failed to find user by ID: ${error.message}`, {
                        id
                    }
                ),
                ErrorHandler.Severity.MEDIUM
            );
            return null;
        }
    },

    // ==================== SESSION MANAGEMENT ====================

    /**
     * Set current user session with remember me option
     * @param {Object} user - User object to set as current
     * @param {boolean} rememberMe - Whether to persist session
     * @returns {boolean} Success status
     */
    setCurrentUser(user, rememberMe = false) {
        try {
            if (!user || !user.id) {
                throw new Error('Invalid user object for session');
            }

            const sessionData = {
                ...user,
                sessionStart: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                rememberMe: rememberMe
            };

            if (rememberMe) {
                // Store in localStorage for persistent session
                return this._safeSet(this.KEYS.CURRENT_USER, sessionData);
            } else {
                // Store in sessionStorage for session-only
                try {
                    sessionStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(sessionData));
                    // Also clear any existing localStorage session
                    localStorage.removeItem(this.KEYS.CURRENT_USER);
                    return true;
                } catch (error) {
                    // Fallback to localStorage if sessionStorage fails
                    return this._safeSet(this.KEYS.CURRENT_USER, sessionData);
                }
            }
        } catch (error) {
            ErrorHandler ? .handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.AUTHENTICATION,
                    `Failed to set current user: ${error.message}`, {
                        userId: user ? .id,
                        rememberMe
                    }
                ),
                ErrorHandler.Severity.HIGH
            );
            return false;
        }
    },

    /**
     * Get current user session from both localStorage and sessionStorage
     * @returns {Object|null} Current user or null if not logged in
     */
    getCurrentUser() {
        try {
            // First check localStorage (persistent session)
            let user = this._safeGet(this.KEYS.CURRENT_USER);

            // If not found in localStorage, check sessionStorage
            if (!user) {
                try {
                    const sessionData = sessionStorage.getItem(this.KEYS.CURRENT_USER);
                    if (sessionData) {
                        user = JSON.parse(sessionData);
                    }
                } catch (error) {
                    // Ignore sessionStorage errors
                }
            }

            if (user) {
                // Update last activity
                user.lastActivity = new Date().toISOString();

                // Update the appropriate storage
                if (user.rememberMe) {
                    this._safeSet(this.KEYS.CURRENT_USER, user);
                } else {
                    try {
                        sessionStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(user));
                    } catch (error) {
                        // Fallback to localStorage
                        this._safeSet(this.KEYS.CURRENT_USER, user);
                    }
                }
            }

            return user;
        } catch (error) {
            ErrorHandler ? .handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.AUTHENTICATION,
                    `Failed to get current user: ${error.message}`
                ),
                ErrorHandler.Severity.MEDIUM
            );
            return null;
        }
    },

    /**
     * Logout current user from both storage types
     * @returns {boolean} Success status
     */
    logout() {
        try {
            localStorage.removeItem(this.KEYS.CURRENT_USER);
            sessionStorage.removeItem(this.KEYS.CURRENT_USER);
            console.log('✅ User logged out successfully');
            return true;
        } catch (error) {
            ErrorHandler ? .handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.AUTHENTICATION,
                    `Failed to logout: ${error.message}`
                ),
                ErrorHandler.Severity.MEDIUM
            );
            return false;
        }
    },

    /**
     * Check if user is logged in
     * @returns {boolean} Login status
     */
    isLoggedIn() {
        const user = this.getCurrentUser();
        return user !== null && user.id;
    },

    // Surveys
    getSurveys() {
        return JSON.parse(localStorage.getItem('surveys')) || [];
    },

    saveSurvey(survey) {
        const surveys = this.getSurveys();
        surveys.push(survey);
        localStorage.setItem('surveys', JSON.stringify(surveys));
        return survey;
    },

    getSurveyById(id) {
        const surveys = this.getSurveys();
        return surveys.find(survey => survey.id === id);
    },

    getSurveysBySemesterAndYear(semester, year) {
        const surveys = this.getSurveys();
        return surveys.filter(survey =>
            survey.semester === semester &&
            survey.year === year &&
            survey.isActive
        );
    },

    getSurveysByDepartment(department) {
        const surveys = this.getSurveys();
        if (!department) {
            return [];
        }

        const deptNormalized = department.trim().toLowerCase();
        return surveys.filter(survey =>
            survey.department &&
            survey.department.trim().toLowerCase() === deptNormalized &&
            survey.isActive !== false
        );
    },

    updateSurvey(surveyId, updatedSurvey) {
        const surveys = this.getSurveys();
        const index = surveys.findIndex(s => s.id === surveyId);
        if (index !== -1) {
            surveys[index] = {
                ...surveys[index],
                ...updatedSurvey
            };
            localStorage.setItem('surveys', JSON.stringify(surveys));
            return surveys[index];
        }
        return null;
    },

    deleteSurvey(surveyId) {
        const surveys = this.getSurveys();
        const filtered = surveys.filter(s => s.id !== surveyId);
        localStorage.setItem('surveys', JSON.stringify(filtered));
        return true;
    },

    // Feedbacks
    getFeedbacks() {
        return JSON.parse(localStorage.getItem('feedbacks')) || [];
    },

    saveFeedback(feedback) {
        const feedbacks = this.getFeedbacks();
        feedbacks.push(feedback);
        localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
        return feedback;
    },

    getFeedbacksByStudentId(studentId) {
        const feedbacks = this.getFeedbacks();
        return feedbacks.filter(feedback => feedback.studentId === studentId);
    },

    getFeedbacksBySurveyId(surveyId) {
        const feedbacks = this.getFeedbacks();
        return feedbacks.filter(feedback => feedback.surveyId === surveyId);
    },

    getFeedbacksByFilter(filters) {
        let feedbacks = this.getFeedbacks();

        if (filters.semester) {
            feedbacks = feedbacks.filter(f => f.semester === filters.semester);
        }
        if (filters.year) {
            feedbacks = feedbacks.filter(f => f.year === filters.year);
        }
        if (filters.department) {
            feedbacks = feedbacks.filter(f => f.department === filters.department);
        }

        return feedbacks;
    },

    // Check if student has submitted feedback for a survey
    hasSubmittedFeedback(studentId, surveyId) {
        const feedbacks = this.getFeedbacks();
        return feedbacks.some(f => f.studentId === studentId && f.surveyId === surveyId);
    },

    // Departments and Faculties
    getDepartments() {
        return JSON.parse(localStorage.getItem('departments')) || [];
    },

    saveDepartment(department) {
        const departments = this.getDepartments();

        // FIXED: Prevent duplicate departments - check by ID first, then by name
        const existingIndex = departments.findIndex(d => d.id === department.id);

        if (existingIndex !== -1) {
            // Update existing department by ID
            departments[existingIndex] = department;
            console.log(`✅ Updated existing department: ${department.name} (ID: ${department.id})`);
        } else {
            // Check if department with same name exists (case-insensitive)
            const duplicateIndex = departments.findIndex(d =>
                d.name.toLowerCase().trim() === department.name.toLowerCase().trim()
            );

            if (duplicateIndex !== -1) {
                // Department with same name exists - DO NOT create duplicate
                console.warn(`⚠️ Department "${department.name}" already exists. Skipping duplicate creation.`);
                console.warn(`Existing ID: ${departments[duplicateIndex].id}, Attempted ID: ${department.id}`);
                // Return the existing department instead
                return departments[duplicateIndex];
            } else {
                // Add as new department (no duplicate found)
                departments.push(department);
                console.log(`✅ Created new department: ${department.name} (ID: ${department.id})`);
            }
        }

        localStorage.setItem('departments', JSON.stringify(departments));
        return department;
    },

    getDepartmentById(deptId) {
        const departments = this.getDepartments();
        return departments.find(d => d.id === deptId);
    },

    getDepartmentByName(name) {
        const departments = this.getDepartments();
        return departments.find(d => d.name === name);
    },

    addFacultyToDepartment(deptId, faculty) {
        const department = this.getDepartmentById(deptId);
        if (department) {
            if (!department.faculties) {
                department.faculties = [];
            }
            // Check if faculty already exists
            const exists = department.faculties.find(f => f.id === faculty.id);
            if (!exists) {
                department.faculties.push(faculty);
                this.saveDepartment(department);
            }
            return faculty;
        }
        return null;
    },

    removeFacultyFromDepartment(deptId, facultyId) {
        const department = this.getDepartmentById(deptId);
        if (department && department.faculties) {
            department.faculties = department.faculties.filter(f => f.id !== facultyId);
            this.saveDepartment(department);
            return true;
        }
        return false;
    },

    getFacultiesByDepartment(deptId) {
        const department = this.getDepartmentById(deptId);
        return (department && department.faculties) ? department.faculties : [];
    },

    deleteDepartment(deptId) {
        const departments = this.getDepartments();
        const filtered = departments.filter(d => d.id !== deptId);
        localStorage.setItem('departments', JSON.stringify(filtered));
        return true;
    },

    // Questions Management
    getQuestions() {
        return JSON.parse(localStorage.getItem('questions')) || [];
    },

    saveQuestion(question) {
        const questions = this.getQuestions();
        questions.push(question);
        localStorage.setItem('questions', JSON.stringify(questions));
        return question;
    },

    getQuestionById(id) {
        const questions = this.getQuestions();
        return questions.find(q => q.id === id);
    },

    deleteQuestion(questionId) {
        const questions = this.getQuestions();
        const filtered = questions.filter(q => q.id !== questionId);
        localStorage.setItem('questions', JSON.stringify(filtered));
        return true;
    },

    // Clear feedbacks for a specific student
    clearStudentFeedbacks(studentId) {
        const feedbacks = this.getFeedbacks();
        const filtered = feedbacks.filter(f => f.studentId !== studentId);
        localStorage.setItem('feedbacks', JSON.stringify(filtered));
    },

    // Generate unique ID
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    },

    // Reset - Clear students, surveys, feedbacks (keep admin, departments, faculties, questions)
    resetStudentData() {
        // Preserve admin session before clearing
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        
        // Clear all users except admin
        const users = this.getUsers();
        const adminUsers = users.filter(u => u.role === 'admin');
        localStorage.setItem('users', JSON.stringify(adminUsers));

        // Clear surveys
        localStorage.setItem('surveys', JSON.stringify([]));

        // Clear feedbacks
        localStorage.setItem('feedbacks', JSON.stringify([]));

        // Restore admin session if it was an admin
        if (currentUser && currentUser.role === 'admin') {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        console.log('✅ Reset complete! Students, surveys, and feedbacks cleared. Admin session preserved.');
        console.log('✅ Departments, faculties, and questions preserved.');
        return true;
    },

    /**
     * Reset system data but preserve student accounts.
     * Clears surveys and feedbacks only (keeps all users including students, admins, departments, faculties, and questions).
     * @returns {boolean} Success status
     */
    resetPreserveStudents() {
        try {
            // Clear surveys
            localStorage.setItem(this.KEYS.SURVEYS, JSON.stringify([]));

            // Clear feedbacks
            localStorage.setItem(this.KEYS.FEEDBACKS, JSON.stringify([]));

            // Do not remove users or current session to preserve student accounts
            console.log('✅ Reset complete! Surveys and feedbacks cleared. Student accounts preserved.');
            return true;
        } catch (error) {
            ErrorHandler ? .handleError(
                ErrorHandler.createError(
                    ErrorHandler.ErrorTypes.STORAGE,
                    `Failed to reset data while preserving students: ${error.message}`, {
                        error: error.message
                    }
                ),
                ErrorHandler.Severity.HIGH
            );
            return false;
        }
    }
};

// No automatic admin initialization - all admin accounts removed by user request

// REMOVED: Auto-initialization of default departments
// Departments should be created manually by admin through "Manage Faculties" page
// This prevents dummy departments from being created automatically