/**
 * Firebase Authentication Logic with Firebase Auth Integration
 * Admin login uses Firebase Authentication for secure password handling
 * Student login uses database authentication (backward compatible)
 */

import Storage from './firebase-storage.js';
import {
    auth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from './firebase-config.js';

// Admin Secret Code (in production, this should be server-side)
const ADMIN_SECRET_CODE = 'ADMIN2024';

/**
 * Show alert message with enhanced styling and auto-dismiss
 */
function showAlert(message, type = 'danger', duration = 5000) {
    try {
        const alertDiv = document.getElementById('alertMessage');
        if (alertDiv) {
            alertDiv.textContent = message;
            alertDiv.className = `alert alert-${type} show`;

            setTimeout(() => {
                if (alertDiv.classList.contains('show')) {
                    alertDiv.className = 'alert';
                }
            }, duration);
        } else {
            console.warn('Alert div not found, using console:', message);
            if (type === 'danger' || type === 'error') {
                alert(message);
            }
        }
    } catch (error) {
        console.error('Error showing alert:', error);
        if (type === 'danger' || type === 'error') {
            alert(message);
        }
    }
}

/**
 * Enhanced form data extraction with validation
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

// ==================== STUDENT LOGIN ====================
if (document.getElementById('studentLoginForm')) {
    document.getElementById('studentLoginForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = this.querySelector('.login-btn');

        // Add loading state
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        try {
            console.log('🔐 Student login attempt...');
            const formData = extractFormData(this);
            const {
                email,
                password
            } = formData;

            if (!email || !password) {
                showAlert('Please enter both email and password');
                return;
            }

            // Try to find user in database first
            console.log('Looking up user:', email);
            let user = await Storage.findUserByEmail(email);

            // Check if user exists and is admin
            if (user && user.role === 'admin') {
                console.log('👑 Admin login detected');

                // Verify password
                if (user.password !== password) {
                    console.log('❌ Incorrect admin password');
                    showAlert('Incorrect password. Please try again.');
                    return;
                }

                await Storage.setCurrentUser(user, true);
                console.log('✅ Admin logged in successfully');
                showAlert('Admin login successful! Redirecting to Admin Dashboard...', 'success', 1500);
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1000);
                return;
            }

            // Regular student login
            if (!user) {
                console.log('❌ User not found');
                showAlert('User not found. Please check your email or register first.');
                return;
            }

            console.log('User found:', user.email, 'Role:', user.role);

            if (user.role !== 'student') {
                console.log('❌ Invalid role for student login');
                showAlert('Invalid credentials for student login.');
                return;
            }

            if (user.password !== password) {
                console.log('❌ Incorrect password');
                showAlert('Incorrect password. Please try again.');
                return;
            }

            // Successful login
            console.log('✅ Password correct, logging in...');
            const loginSuccess = await Storage.setCurrentUser(user, true);

            if (loginSuccess) {
                console.log('✅ Session created successfully');
                showAlert('Login successful! Redirecting to dashboard...', 'success', 2000);
                setTimeout(() => {
                    window.location.href = 'student-dashboard.html';
                }, 1000);
            } else {
                throw new Error('Failed to set user session');
            }

        } catch (error) {
            console.error('❌ Student login error:', error);
            showAlert('An error occurred during login. Please try again.');
        } finally {
            // Remove loading state
            if (submitBtn) {
                setTimeout(() => {
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                }, 500);
            }
        }
    });
}

// ==================== STUDENT REGISTRATION ====================
if (document.getElementById('studentRegisterForm')) {
    document.getElementById('studentRegisterForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = this.querySelector('.register-btn, .login-btn, button[type="submit"]');

        // Add loading state
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        try {
            console.log('📝 Student registration attempt...');
            const formData = extractFormData(this);
            const {
                fullName,
                email,
                rollNumber,
                department,
                password,
                confirmPassword
            } = formData;

            // Basic validation
            if (!fullName || !email || !rollNumber || !department || !password || !confirmPassword) {
                showAlert('Please fill in all required fields');
                return;
            }

            if (password !== confirmPassword) {
                showAlert('Passwords do not match!');
                return;
            }

            // Enhanced password validation
            if (password.length < 8) {
                showAlert('Password must be at least 8 characters long');
                return;
            }

            // Check for uppercase letter
            if (!/[A-Z]/.test(password)) {
                showAlert('Password must contain at least one uppercase letter');
                return;
            }

            // Check for lowercase letter
            if (!/[a-z]/.test(password)) {
                showAlert('Password must contain at least one lowercase letter');
                return;
            }

            // Check for number or symbol
            if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
                showAlert('Password must contain at least one number or symbol');
                return;
            }

            // Check if email already exists
            console.log('Checking if email exists:', email);
            const existingUser = await Storage.findUserByEmail(email);
            if (existingUser) {
                showAlert('❌ Email already registered! Please use a different email or login.');
                return;
            }

            // Check if roll number already exists IN THE SAME DEPARTMENT
            const users = await Storage.getUsers();
            const duplicateRollNumber = users.find(u =>
                u.rollNumber === rollNumber.toUpperCase() &&
                u.department === department.trim()
            );

            if (duplicateRollNumber) {
                showAlert(`❌ Roll number ${rollNumber.toUpperCase()} is already registered in ${department} department!`);
                return;
            }

            // FIXED: Validate that the selected department exists in the database
            const departmentExists = await Storage.getDepartmentByName(department.trim());
            if (!departmentExists) {
                showAlert('❌ Selected department does not exist. Please contact the administrator to create the department first.');
                console.error('Department validation failed:', department);
                return;
            }
            console.log('✅ Department validated:', departmentExists.name);

            // Create new user
            console.log('Creating new student user...');
            const newUser = {
                id: Storage.generateId(),
                name: fullName.trim(),
                email: email.toLowerCase().trim(),
                rollNumber: rollNumber.toUpperCase(),
                department: department.trim(),
                password: password,
                role: 'student',
                registeredAt: new Date().toISOString()
            };

            const savedUser = await Storage.saveUser(newUser);
            if (savedUser) {
                console.log('✅ Student registered successfully');
                showAlert('Registration successful! Redirecting to login...', 'success', 3000);

                this.reset();

                setTimeout(() => {
                    window.location.href = 'student-login.html';
                }, 2000);
            } else {
                throw new Error('Failed to save user data');
            }

        } catch (error) {
            console.error('❌ Student registration error:', error);
            showAlert('Registration failed. Please try again.');
        } finally {
            // Remove loading state
            if (submitBtn) {
                setTimeout(() => {
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                }, 500);
            }
        }
    });
}

// Admin Login with Firebase Authentication
if (document.getElementById('adminLoginForm')) {
    document.getElementById('adminLoginForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = this.querySelector('.login-btn, button[type="submit"]');

        // Add loading state
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        try {
            console.log('🔐 Admin login attempt with Firebase Auth...');
            const formData = extractFormData(this);
            const {
                email: emailOrUsername,
                password
            } = formData;

            if (!emailOrUsername || !password) {
                showAlert('Please enter both email and password');
                return;
            }

            // Check if input is email or username
            let email = emailOrUsername;

            // If not an email format, try to find user by username in database
            if (!emailOrUsername.includes('@')) {
                console.log('🔍 Looking up username in database...');
                const user = await Storage.findUserByUsername(emailOrUsername);
                if (user && user.role === 'admin') {
                    email = user.email;
                    console.log('✅ Found admin email from username');
                } else {
                    showAlert('Admin account not found with this username');
                    return;
                }
            }

            // Authenticate with Firebase Auth
            console.log('🔐 Authenticating with Firebase Auth...');
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            console.log('✅ Firebase Auth successful:', firebaseUser.email);

            // Get admin data from Firestore
            const adminData = await Storage.findUserByEmail(firebaseUser.email);

            if (!adminData) {
                showAlert('Admin account not found in database. Please contact administrator.');
                await signOut(auth);
                return;
            }

            if (adminData.role !== 'admin') {
                showAlert('This account does not have admin privileges.');
                await signOut(auth);
                return;
            }

            // Set session with admin data
            await Storage.setCurrentUser(adminData, true);

            console.log('✅ Admin logged in successfully');
            showAlert('Login successful! Redirecting to dashboard...', 'success', 1500);

            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);

        } catch (error) {
            console.error('❌ Admin login error:', error);

            // Handle specific Firebase Auth errors
            let errorMessage = 'An error occurred during login. Please try again.';

            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect email or password.';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'No admin account found with this email.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email format.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed login attempts. Please try again later.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection.';
            }

            showAlert(errorMessage);
        } finally {
            // Remove loading state
            if (submitBtn) {
                setTimeout(() => {
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                }, 500);
            }
        }
    });
}

// Check authentication on protected pages
async function checkAuth(requiredRole) {
    try {
        console.log('🔍 Checking authentication for role:', requiredRole);

        // Get current user from session (synchronous)
        const currentUser = Storage.getCurrentUser();

        if (!currentUser) {
            console.log('❌ No user logged in, redirecting to login...');
            window.location.href = 'student-login.html';
            return null;
        }

        console.log('✅ User found:', currentUser.email, 'Role:', currentUser.role);

        if (currentUser.role !== requiredRole) {
            console.log(`❌ User role ${currentUser.role} does not match required role ${requiredRole}`);
            window.location.href = 'student-login.html';
            return null;
        }

        console.log('✅ Authentication successful');
        return currentUser;
    } catch (error) {
        console.error('❌ Authentication check error:', error);
        window.location.href = 'student-login.html';
        return null;
    }
}

// Logout function with Firebase Auth support
async function logout() {
    try {
        console.log('👋 Logging out...');

        // Sign out from Firebase Auth if authenticated
        if (auth.currentUser) {
            await signOut(auth);
            console.log('✅ Signed out from Firebase Auth');
        }

        // Clear local session
        await Storage.logout();

        console.log('✅ User logged out');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('❌ Logout error:', error);
        window.location.href = 'index.html';
    }
}

// Make functions globally available
window.checkAuth = checkAuth;
window.logout = logout;
window.showAlert = showAlert;

console.log('✅ Firebase Auth module loaded');

export {
    checkAuth,
    logout,
    showAlert
};