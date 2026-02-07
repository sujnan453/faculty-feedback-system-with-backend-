/**
 * Firestore Database Storage Management System
 * Replaces localStorage with Firestore for Faculty Feedback System
 */

import {
    db,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where
} from './firebase-config.js';

/**
 * Cache Manager for localStorage
 * Reduces Firestore reads by caching data locally
 */
const CacheManager = {
    CACHE_PREFIX: 'ffs_cache_',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds

    /**
     * Set cache with timestamp
     */
    set(key, data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Cache set failed:', error);
        }
    },

    /**
     * Get cache if not expired
     */
    get(key) {
        try {
            const cached = localStorage.getItem(this.CACHE_PREFIX + key);
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;

            // Check if cache is still valid
            if (age < this.CACHE_DURATION) {
                console.log(`📦 Cache hit for: ${key} (age: ${Math.round(age / 1000)}s)`);
                return cacheData.data;
            } else {
                // Cache expired, remove it
                this.remove(key);
                return null;
            }
        } catch (error) {
            console.warn('Cache get failed:', error);
            return null;
        }
    },

    /**
     * Remove specific cache
     */
    remove(key) {
        try {
            localStorage.removeItem(this.CACHE_PREFIX + key);
        } catch (error) {
            console.warn('Cache remove failed:', error);
        }
    },

    /**
     * Clear all caches
     */
    clearAll() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.CACHE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            console.log('🗑️ All caches cleared');
        } catch (error) {
            console.warn('Cache clear failed:', error);
        }
    },

    /**
     * Invalidate related caches when data changes
     */
    invalidate(collection) {
        this.remove(collection);
        console.log(`🔄 Cache invalidated for: ${collection}`);
    }
};

const Storage = {
    /**
     * Collection names enumeration for consistency
     */
    COLLECTIONS: {
        USERS: 'users',
        SURVEYS: 'surveys',
        FEEDBACKS: 'feedbacks',
        DEPARTMENTS: 'departments',
        QUESTIONS: 'questions',
        SESSIONS: 'sessions'
    },

    /**
     * Security: Sanitize HTML input to prevent XSS attacks
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
     */
    _isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Security: Check for potential SQL injection patterns
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
     * Security: Sanitize storage data recursively
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
     * Generate unique ID with better entropy
     */
    generateId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const counter = (this._idCounter = (this._idCounter || 0) + 1);
        return `${timestamp}_${random}_${counter}`;
    },

    // ==================== USER MANAGEMENT ====================

    /**
     * Get all users from Firestore (with caching)
     */
    async getUsers() {
        try {
            // Check cache first
            const cached = CacheManager.get(this.COLLECTIONS.USERS);
            if (cached) return cached;

            // Fetch from Firestore
            const usersCol = collection(db, this.COLLECTIONS.USERS);
            const snapshot = await getDocs(usersCol);

            const users = [];
            snapshot.forEach(doc => {
                users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Cache the result
            CacheManager.set(this.COLLECTIONS.USERS, users);

            return users;
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    },

    /**
     * Save a new user with enhanced validation and security
     */
    async saveUser(user) {
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

            // Check for duplicate email
            const users = await this.getUsers();
            if (users.some(u => u.email === sanitizedUser.email && u.id !== sanitizedUser.id)) {
                throw new Error('Email already exists');
            }

            // Check for duplicate username (if provided)
            if (sanitizedUser.username && users.some(u => u.username === sanitizedUser.username && u.id !== sanitizedUser.id)) {
                throw new Error('Username already exists');
            }

            // Save to Firestore
            const userRef = doc(db, this.COLLECTIONS.USERS, sanitizedUser.id);
            await setDoc(userRef, sanitizedUser);

            // Invalidate cache
            CacheManager.invalidate(this.COLLECTIONS.USERS);

            console.log(`✅ User saved: ${sanitizedUser.email}`);
            return sanitizedUser;
        } catch (error) {
            console.error('Failed to save user:', error.message);
            return null;
        }
    },

    /**
     * Find user by email
     */
    async findUserByEmail(email) {
        try {
            if (!email || typeof email !== 'string') {
                return null;
            }

            const users = await this.getUsers();
            return users.find(user => user.email === email.toLowerCase().trim()) || null;
        } catch (error) {
            console.error('Failed to find user by email:', error);
            return null;
        }
    },

    /**
     * Find user by username
     */
    async findUserByUsername(username) {
        try {
            if (!username || typeof username !== 'string') {
                return null;
            }

            const users = await this.getUsers();
            return users.find(user => user.username === username.toLowerCase().trim()) || null;
        } catch (error) {
            console.error('Failed to find user by username:', error);
            return null;
        }
    },

    /**
     * Find user by ID
     */
    async findUserById(id) {
        try {
            if (!id) {
                return null;
            }

            const userRef = doc(db, this.COLLECTIONS.USERS, id);
            const snapshot = await getDoc(userRef);

            if (snapshot.exists()) {
                return {
                    id: snapshot.id,
                    ...snapshot.data()
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to find user by ID:', error);
            return null;
        }
    },

    /**
     * Update user password
     */
    async updateUserPassword(userId, newPassword) {
        try {
            if (!userId || !newPassword) {
                throw new Error('User ID and new password are required');
            }

            if (newPassword.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            const userRef = doc(db, this.COLLECTIONS.USERS, userId);
            await updateDoc(userRef, {
                password: newPassword,
                passwordUpdatedAt: new Date().toISOString()
            });

            // Invalidate cache
            CacheManager.invalidate(this.COLLECTIONS.USERS);

            console.log(`✅ Password updated for user: ${userId}`);
            return true;
        } catch (error) {
            console.error('Failed to update password:', error);
            return false;
        }
    },

    // ==================== SESSION MANAGEMENT ====================

    /**
     * Set current user session
     */
    async setCurrentUser(user, rememberMe = false) {
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

            // Store in sessionStorage for quick access
            sessionStorage.setItem('currentUser', JSON.stringify(sessionData));

            // Also store in Firestore for persistence
            if (rememberMe) {
                const sessionRef = doc(db, this.COLLECTIONS.SESSIONS, user.id);
                await setDoc(sessionRef, sessionData);
            }

            return true;
        } catch (error) {
            console.error('Failed to set current user:', error);
            return false;
        }
    },

    /**
     * Get current user session (synchronous for compatibility)
     */
    getCurrentUser() {
        try {
            // Check sessionStorage
            const sessionData = sessionStorage.getItem('currentUser');
            if (sessionData) {
                const user = JSON.parse(sessionData);

                // Update last activity
                user.lastActivity = new Date().toISOString();
                sessionStorage.setItem('currentUser', JSON.stringify(user));

                return user;
            }

            return null;
        } catch (error) {
            console.error('Failed to get current user:', error);
            return null;
        }
    },

    /**
     * Logout current user
     */
    async logout() {
        try {
            const user = this.getCurrentUser();

            // Remove from sessionStorage
            sessionStorage.removeItem('currentUser');

            // Remove from Firestore if exists
            if (user && user.id) {
                const sessionRef = doc(db, this.COLLECTIONS.SESSIONS, user.id);
                await deleteDoc(sessionRef);
            }

            console.log('✅ User logged out successfully');
            return true;
        } catch (error) {
            console.error('Failed to logout:', error);
            return false;
        }
    },

    /**
     * Check if user is logged in (synchronous for compatibility)
     */
    isLoggedIn() {
        const user = this.getCurrentUser();
        return user !== null && user.id;
    },

    // ==================== SURVEYS ====================

    async getSurveys() {
        try {
            // Check cache first
            const cached = CacheManager.get(this.COLLECTIONS.SURVEYS);
            if (cached) return cached;

            // Fetch from Firestore
            const surveysCol = collection(db, this.COLLECTIONS.SURVEYS);
            const snapshot = await getDocs(surveysCol);

            const surveys = [];
            snapshot.forEach(doc => {
                surveys.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Cache the result
            CacheManager.set(this.COLLECTIONS.SURVEYS, surveys);

            return surveys;
        } catch (error) {
            console.error('Error getting surveys:', error);
            return [];
        }
    },

    async saveSurvey(survey) {
        try {
            const surveyId = survey.id || this.generateId();
            survey.id = surveyId;

            const surveyRef = doc(db, this.COLLECTIONS.SURVEYS, surveyId);
            await setDoc(surveyRef, survey);

            // Invalidate cache
            CacheManager.invalidate(this.COLLECTIONS.SURVEYS);

            return survey;
        } catch (error) {
            console.error('Error saving survey:', error);
            return null;
        }
    },

    async getSurveyById(id) {
        try {
            const surveyRef = doc(db, this.COLLECTIONS.SURVEYS, id);
            const snapshot = await getDoc(surveyRef);

            if (snapshot.exists()) {
                return {
                    id: snapshot.id,
                    ...snapshot.data()
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting survey by ID:', error);
            return null;
        }
    },

    async getSurveysByDepartment(department) {
        try {
            const surveys = await this.getSurveys();
            if (!department) {
                console.warn('⚠️ getSurveysByDepartment called with empty department');
                return [];
            }

            // Normalize function to handle various formats
            const normalize = (str) => {
                return str.trim().toLowerCase()
                    .replace(/\s+/g, ' ') // Multiple spaces to single space
                    .replace(/[()]/g, '') // Remove parentheses
                    .replace(/\./g, '') // Remove periods
                    .replace(/_/g, ' '); // Underscores to spaces
            };

            const studentDeptNorm = normalize(department);

            console.log('🔍 getSurveysByDepartment - Searching for:', department);
            console.log('📝 Normalized student dept:', studentDeptNorm);
            console.log('📊 Total surveys to check:', surveys.length);

            // Filter surveys that match the department
            const matchedSurveys = surveys.filter(survey => {
                console.log(`  Checking survey: ${survey.id}, dept: "${survey.department}", active: ${survey.isActive}`);

                if (!survey.department) {
                    console.log(`    ❌ No department set`);
                    return false;
                }
                if (survey.isActive === false) {
                    console.log(`    ❌ Survey is inactive`);
                    return false;
                }

                const surveyDeptNorm = normalize(survey.department);
                console.log(`    📝 Normalized survey dept: "${surveyDeptNorm}"`);

                // Direct normalized match
                if (surveyDeptNorm === studentDeptNorm) {
                    console.log(`    ✅ MATCH: Direct normalized match`);
                    return true;
                }

                // Flexible matching - remove ALL special chars and spaces
                const clean1 = studentDeptNorm.replace(/[^a-z0-9]/g, '');
                const clean2 = surveyDeptNorm.replace(/[^a-z0-9]/g, '');
                console.log(`    🧹 Cleaned: student="${clean1}", survey="${clean2}"`);

                // Direct match after cleaning
                if (clean1 === clean2) {
                    console.log(`    ✅ MATCH: Cleaned match`);
                    return true;
                }

                // Substring matching for abbreviations
                if (clean1.length >= 4 && clean2.length >= 4) {
                    if (clean1.includes(clean2) || clean2.includes(clean1)) {
                        console.log(`    ✅ MATCH: Substring match`);
                        return true;
                    }
                }

                console.log(`    ❌ No match`);
                return false;
            });

            console.log(`✅ Found ${matchedSurveys.length} surveys for: "${department}"`);
            if (matchedSurveys.length === 0) {
                console.log('❌ No matches. Available departments:', surveys.map(s => s.department));
            }
            return matchedSurveys;
        } catch (error) {
            console.error('Error getting surveys by department:', error);
            return [];
        }
    },

    async updateSurvey(surveyId, updatedSurvey) {
        try {
            const surveyRef = doc(db, this.COLLECTIONS.SURVEYS, surveyId);
            await updateDoc(surveyRef, updatedSurvey);

            // Invalidate cache
            CacheManager.invalidate(this.COLLECTIONS.SURVEYS);

            const snapshot = await getDoc(surveyRef);
            return {
                id: snapshot.id,
                ...snapshot.data()
            };
        } catch (error) {
            console.error('Error updating survey:', error);
            return null;
        }
    },

    async deleteSurvey(surveyId) {
        try {
            const surveyRef = doc(db, this.COLLECTIONS.SURVEYS, surveyId);
            await deleteDoc(surveyRef);

            // Invalidate cache
            CacheManager.invalidate(this.COLLECTIONS.SURVEYS);

            return true;
        } catch (error) {
            console.error('Error deleting survey:', error);
            return false;
        }
    },

    // ==================== FEEDBACKS ====================

    async getFeedbacks() {
        try {
            // CRITICAL FIX: Always fetch fresh data from Firestore, ignore cache
            console.log('📊 Fetching feedbacks from Firestore (bypassing cache)...');

            // Fetch from Firestore
            const feedbacksCol = collection(db, this.COLLECTIONS.FEEDBACKS);
            const snapshot = await getDocs(feedbacksCol);

            const feedbacks = [];
            snapshot.forEach(doc => {
                feedbacks.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Update cache with fresh data
            CacheManager.set(this.COLLECTIONS.FEEDBACKS, feedbacks);

            console.log(`✅ Loaded ${feedbacks.length} feedbacks from Firestore`);
            return feedbacks;
        } catch (error) {
            console.error('Error getting feedbacks:', error);
            return [];
        }
    },

    async saveFeedback(feedback) {
        try {
            console.log('💾 saveFeedback called for student:', feedback.studentId, 'survey:', feedback.surveyId);

            // CRITICAL FIX: Check if feedback already exists for this student+survey
            CacheManager.invalidate(this.COLLECTIONS.FEEDBACKS);
            const existingFeedbacks = await this.getFeedbacks();

            // Check for duplicate submission
            const duplicate = existingFeedbacks.find(f =>
                f.studentId === feedback.studentId && f.surveyId === feedback.surveyId
            );

            if (duplicate) {
                console.error(`❌ BLOCKED: Feedback already exists!`);
                console.error(`❌ Student: ${feedback.studentId}, Survey: ${feedback.surveyId}`);
                console.error(`❌ Existing ID: ${duplicate.id}, Attempted ID: ${feedback.id || 'NEW'}`);
                console.error(`❌ Returning existing feedback to prevent duplicate`);
                // Return existing feedback - DO NOT CREATE NEW
                return duplicate;
            }

            const feedbackId = feedback.id || this.generateId();
            feedback.id = feedbackId;

            console.log(`✅ Creating NEW feedback: ${feedbackId}`);
            const feedbackRef = doc(db, this.COLLECTIONS.FEEDBACKS, feedbackId);
            await setDoc(feedbackRef, feedback);

            // Invalidate cache
            CacheManager.invalidate(this.COLLECTIONS.FEEDBACKS);

            return feedback;
        } catch (error) {
            console.error('❌ Error in saveFeedback:', error);
            return null;
        }
    },

    async getFeedbacksByStudentId(studentId) {
        try {
            const feedbacks = await this.getFeedbacks();
            return feedbacks.filter(feedback => feedback.studentId === studentId);
        } catch (error) {
            console.error('Error getting feedbacks by student ID:', error);
            return [];
        }
    },

    async getFeedbacksBySurveyId(surveyId) {
        try {
            const feedbacks = await this.getFeedbacks();
            return feedbacks.filter(feedback => feedback.surveyId === surveyId);
        } catch (error) {
            console.error('Error getting feedbacks by survey ID:', error);
            return [];
        }
    },

    async getFeedbacksByFilter(filters) {
        try {
            let feedbacks = await this.getFeedbacks();

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
        } catch (error) {
            console.error('Error getting feedbacks by filter:', error);
            return [];
        }
    },

    async hasSubmittedFeedback(studentId, surveyId) {
        try {
            const feedbacks = await this.getFeedbacks();
            return feedbacks.some(f => f.studentId === studentId && f.surveyId === surveyId);
        } catch (error) {
            console.error('Error checking submitted feedback:', error);
            return false;
        }
    },

    // ==================== DEPARTMENTS ====================

    async getDepartments() {
        try {
            // CRITICAL FIX: Always fetch fresh data from Firestore, ignore cache
            // Cache was causing stale data and duplicate creation
            console.log('📊 Fetching departments from Firestore (bypassing cache)...');

            // Fetch from Firestore
            const deptsCol = collection(db, this.COLLECTIONS.DEPARTMENTS);
            const snapshot = await getDocs(deptsCol);

            const departments = [];
            snapshot.forEach(doc => {
                departments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Update cache with fresh data
            CacheManager.set(this.COLLECTIONS.DEPARTMENTS, departments);

            console.log(`✅ Loaded ${departments.length} departments from Firestore`);
            return departments;
        } catch (error) {
            console.error('Error getting departments:', error);
            return [];
        }
    },

    async saveDepartment(department) {
        try {
            // CRITICAL FIX: Always check for duplicates FIRST, even if ID exists
            const existingDepartments = await this.getDepartments();

            // If department has an ID, verify it exists in database
            if (department.id) {
                const existsById = existingDepartments.find(d => d.id === department.id);
                if (existsById) {
                    // Update existing department
                    const deptRef = doc(db, this.COLLECTIONS.DEPARTMENTS, department.id);
                    await setDoc(deptRef, department);
                    CacheManager.invalidate(this.COLLECTIONS.DEPARTMENTS);
                    console.log(`✅ Updated department: ${department.name} (ID: ${department.id})`);
                    return department;
                }
            }

            // Check if department with same name already exists (case-insensitive)
            const duplicate = existingDepartments.find(d =>
                d.name.toLowerCase().trim() === department.name.toLowerCase().trim()
            );

            if (duplicate) {
                console.error(`❌ BLOCKED: Department "${department.name}" already exists with ID: ${duplicate.id}`);
                console.error(`❌ BLOCKED: Attempted to create duplicate with ID: ${department.id || 'NEW'}`);
                console.error(`❌ BLOCKED: Returning existing department to prevent duplicate`);
                // Return existing department - DO NOT CREATE NEW
                return duplicate;
            }

            // Only create new if no duplicate found
            const deptId = department.id || this.generateId();
            department.id = deptId;

            const deptRef = doc(db, this.COLLECTIONS.DEPARTMENTS, deptId);
            await setDoc(deptRef, department);

            // Invalidate cache
            CacheManager.invalidate(this.COLLECTIONS.DEPARTMENTS);

            console.log(`✅ Created NEW department: ${department.name} (ID: ${deptId})`);
            return department;
        } catch (error) {
            console.error('Error saving department:', error);
            return null;
        }
    },

    async getDepartmentById(deptId) {
        try {
            const deptRef = doc(db, this.COLLECTIONS.DEPARTMENTS, deptId);
            const snapshot = await getDoc(deptRef);

            if (snapshot.exists()) {
                return {
                    id: snapshot.id,
                    ...snapshot.data()
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting department by ID:', error);
            return null;
        }
    },

    async getDepartmentByName(name) {
        try {
            const departments = await this.getDepartments();
            return departments.find(d => d.name === name) || null;
        } catch (error) {
            console.error('Error getting department by name:', error);
            return null;
        }
    },

    async deleteDepartment(deptId) {
        try {
            const deptRef = doc(db, this.COLLECTIONS.DEPARTMENTS, deptId);
            await deleteDoc(deptRef);

            // Invalidate cache
            CacheManager.invalidate(this.COLLECTIONS.DEPARTMENTS);

            return true;
        } catch (error) {
            console.error('Error deleting department:', error);
            return false;
        }
    },

    async addFacultyToDepartment(deptId, faculty) {
        try {
            const department = await this.getDepartmentById(deptId);
            if (department) {
                if (!department.faculties) {
                    department.faculties = [];
                }

                const exists = department.faculties.find(f => f.id === faculty.id);
                if (!exists) {
                    department.faculties.push(faculty);
                    await this.saveDepartment(department);
                }
                return faculty;
            }
            return null;
        } catch (error) {
            console.error('Error adding faculty to department:', error);
            return null;
        }
    },

    async removeFacultyFromDepartment(deptId, facultyId) {
        try {
            const department = await this.getDepartmentById(deptId);
            if (department && department.faculties) {
                department.faculties = department.faculties.filter(f => f.id !== facultyId);
                await this.saveDepartment(department);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error removing faculty from department:', error);
            return false;
        }
    },

    async getFacultiesByDepartment(deptId) {
        try {
            const department = await this.getDepartmentById(deptId);
            return (department && department.faculties) ? department.faculties : [];
        } catch (error) {
            console.error('Error getting faculties by department:', error);
            return [];
        }
    },

    // ==================== QUESTIONS ====================

    async getQuestions() {
        try {
            // CRITICAL FIX: Always fetch fresh data from Firestore, ignore cache
            // Cache was causing stale data and duplicate creation
            console.log('📊 Fetching questions from Firestore (bypassing cache)...');

            // Fetch from Firestore
            const questionsCol = collection(db, this.COLLECTIONS.QUESTIONS);
            const snapshot = await getDocs(questionsCol);

            const questions = [];
            snapshot.forEach(doc => {
                questions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Update cache with fresh data
            CacheManager.set(this.COLLECTIONS.QUESTIONS, questions);

            console.log(`✅ Loaded ${questions.length} questions from Firestore`);
            return questions;
        } catch (error) {
            console.error('Error getting questions:', error);
            return [];
        }
    },

    async saveQuestion(question) {
        try {
            console.log('💾 saveQuestion called with:', {
                id: question.id,
                text: question.text ? question.text.substring(0, 50) + '...' : 'N/A'
            });

            // CRITICAL FIX: Always get FRESH data, bypass cache
            CacheManager.invalidate(this.COLLECTIONS.QUESTIONS);
            const existingQuestions = await this.getQuestions();

            console.log(`📊 Current database has ${existingQuestions.length} questions`);

            // If question has an ID, verify it exists in database
            if (question.id) {
                const existsById = existingQuestions.find(q => q.id === question.id);
                if (existsById) {
                    // Update existing question
                    console.log(`✅ Updating existing question: ${question.id}`);
                    const questionRef = doc(db, this.COLLECTIONS.QUESTIONS, question.id);
                    await setDoc(questionRef, question);
                    CacheManager.invalidate(this.COLLECTIONS.QUESTIONS);
                    return question;
                }

                // ID provided but doesn't exist - check if text exists
                console.warn(`⚠️ Question ID ${question.id} not found in database`);
            }

            // Check if question with same text already exists (case-insensitive)
            const duplicate = existingQuestions.find(q =>
                q.text.toLowerCase().trim() === question.text.toLowerCase().trim()
            );

            if (duplicate) {
                console.error(`❌ BLOCKED: Question already exists!`);
                console.error(`❌ Text: "${question.text}"`);
                console.error(`❌ Existing ID: ${duplicate.id}, Attempted ID: ${question.id || 'NEW'}`);
                console.error(`❌ Returning existing question to prevent duplicate`);
                // Return existing question - DO NOT CREATE NEW
                return duplicate;
            }

            // Only create new if no duplicate found
            const questionId = question.id || this.generateId();
            question.id = questionId;

            console.log(`✅ Creating NEW question: ${questionId}`);
            const questionRef = doc(db, this.COLLECTIONS.QUESTIONS, questionId);
            await setDoc(questionRef, question);

            // Invalidate cache
            CacheManager.invalidate(this.COLLECTIONS.QUESTIONS);

            return question;
        } catch (error) {
            console.error('❌ Error in saveQuestion:', error);
            return null;
        }
    },

    async getQuestionById(id) {
        try {
            const questionRef = doc(db, this.COLLECTIONS.QUESTIONS, id);
            const snapshot = await getDoc(questionRef);

            if (snapshot.exists()) {
                return {
                    id: snapshot.id,
                    ...snapshot.data()
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting question by ID:', error);
            return null;
        }
    },

    async deleteQuestion(questionId) {
        try {
            const questionRef = doc(db, this.COLLECTIONS.QUESTIONS, questionId);
            await deleteDoc(questionRef);

            // Invalidate cache
            CacheManager.invalidate(this.COLLECTIONS.QUESTIONS);

            return true;
        } catch (error) {
            console.error('Error deleting question:', error);
            return false;
        }
    },

    // ==================== RESET FUNCTIONS ====================

    async resetStudentData() {
        try {
            // Clear all users except admin
            const users = await this.getUsers();
            const adminUsers = users.filter(u => u.role === 'admin');

            // Delete all non-admin users
            for (const user of users) {
                if (user.role !== 'admin') {
                    const userRef = doc(db, this.COLLECTIONS.USERS, user.id);
                    await deleteDoc(userRef);
                }
            }

            // Clear surveys
            const surveys = await this.getSurveys();
            for (const survey of surveys) {
                const surveyRef = doc(db, this.COLLECTIONS.SURVEYS, survey.id);
                await deleteDoc(surveyRef);
            }

            // Clear feedbacks
            const feedbacks = await this.getFeedbacks();
            for (const feedback of feedbacks) {
                const feedbackRef = doc(db, this.COLLECTIONS.FEEDBACKS, feedback.id);
                await deleteDoc(feedbackRef);
            }

            // Preserve admin session - don't clear currentUser if it's an admin
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
            
            // Clear all caches
            CacheManager.clearAll();

            // Restore admin session if it was an admin
            if (currentUser && currentUser.role === 'admin') {
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            }

            console.log('✅ Reset complete! Students, surveys, and feedbacks cleared. Admin session preserved.');
            return true;
        } catch (error) {
            console.error('Error resetting student data:', error);
            return false;
        }
    },

    async resetPreserveStudents() {
        try {
            // Clear surveys
            const surveys = await this.getSurveys();
            for (const survey of surveys) {
                const surveyRef = doc(db, this.COLLECTIONS.SURVEYS, survey.id);
                await deleteDoc(surveyRef);
            }

            // Clear feedbacks
            const feedbacks = await this.getFeedbacks();
            for (const feedback of feedbacks) {
                const feedbackRef = doc(db, this.COLLECTIONS.FEEDBACKS, feedback.id);
                await deleteDoc(feedbackRef);
            }

            // Clear relevant caches
            CacheManager.invalidate(this.COLLECTIONS.SURVEYS);
            CacheManager.invalidate(this.COLLECTIONS.FEEDBACKS);

            console.log('✅ Reset complete! Surveys and feedbacks cleared. Student accounts preserved.');
            return true;
        } catch (error) {
            console.error('Error resetting data:', error);
            return false;
        }
    },

    /**
     * Manual cache refresh - useful for forcing data reload
     */
    refreshCache() {
        CacheManager.clearAll();
        console.log('🔄 Cache manually refreshed');
    }
};

// Initialize default departments if not exists
(async () => {
    const departments = await Storage.getDepartments();
    if (departments.length === 0) {
        const defaultDepartments = [{
                id: Storage.generateId(),
                name: 'BCA',
                fullName: 'Bachelor of Computer Applications',
                faculties: []
            },
            {
                id: Storage.generateId(),
                name: 'BCOM Vocational',
                fullName: 'Bachelor of Commerce - Vocational',
                faculties: []
            },
            {
                id: Storage.generateId(),
                name: 'BCOM General',
                fullName: 'Bachelor of Commerce - General',
                faculties: []
            },
            {
                id: Storage.generateId(),
                name: 'BSC',
                fullName: 'Bachelor of Science',
                faculties: []
            },
            {
                id: Storage.generateId(),
                name: 'BA',
                fullName: 'Bachelor of Arts',
                faculties: []
            }
        ];

        for (const dept of defaultDepartments) {
            const deptRef = doc(db, Storage.COLLECTIONS.DEPARTMENTS, dept.id);
            await setDoc(deptRef, dept);
        }
        console.log('✅ Default departments initialized');
    }
})();

// Initialize default questions if not exists
(async () => {
    const questions = await Storage.getQuestions();
    if (questions.length === 0) {
        console.log('?? Initializing default 10 faculty feedback questions...');

        const defaultQuestions = [{
                id: Storage.generateId(),
                text: 'Regularity in conducting classes',
                type: 'rating',
                category: 'Professionalism',
                allowComments: true,
                createdAt: new Date().toISOString()
            },
            {
                id: Storage.generateId(),
                text: 'Punctuality',
                type: 'rating',
                category: 'Professionalism',
                allowComments: true,
                createdAt: new Date().toISOString()
            },
            {
                id: Storage.generateId(),
                text: 'Preparation for the class',
                type: 'rating',
                category: 'Teaching Preparation',
                allowComments: true,
                createdAt: new Date().toISOString()
            },
            {
                id: Storage.generateId(),
                text: 'Completion of the syllabus on time',
                type: 'rating',
                category: 'Syllabus Management',
                allowComments: true,
                createdAt: new Date().toISOString()
            },
            {
                id: Storage.generateId(),
                text: 'Competency to handle the subject',
                type: 'rating',
                category: 'Subject Knowledge',
                allowComments: true,
                createdAt: new Date().toISOString()
            },
            {
                id: Storage.generateId(),
                text: 'Presentation skills (Voice, Clarity, Language)',
                type: 'rating',
                category: 'Communication Skills',
                allowComments: true,
                createdAt: new Date().toISOString()
            },
            {
                id: Storage.generateId(),
                text: 'Methodology used to impart the knowledge',
                type: 'rating',
                category: 'Teaching Methods',
                allowComments: true,
                createdAt: new Date().toISOString()
            },
            {
                id: Storage.generateId(),
                text: 'Interaction with the students',
                type: 'rating',
                category: 'Student Engagement',
                allowComments: true,
                createdAt: new Date().toISOString()
            },
            {
                id: Storage.generateId(),
                text: 'Accessibility to the students outside the classroom',
                type: 'rating',
                category: 'Student Support',
                allowComments: true,
                createdAt: new Date().toISOString()
            },
            {
                id: Storage.generateId(),
                text: 'Role as mentor',
                type: 'rating',
                category: 'Mentorship',
                allowComments: true,
                createdAt: new Date().toISOString()
            }
        ];

        for (const question of defaultQuestions) {
            await Storage.saveQuestion(question);
        }
        console.log('? Default 10 questions initialized and saved to Firestore');
    } else {
        console.log('?? Questions already exist (' + questions.length + ' found), skipping initialization');
    }
})();

// Export for global use
window.Storage = Storage;
export default Storage;