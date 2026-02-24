/**
 * Enhanced Password Validation with Visual Feedback
 * Provides real-time password strength indicators and validation
 */

const PasswordValidator = {
    /**
     * Validate password against all requirements
     * @param {string} password - Password to validate
     * @returns {Object} Validation result with details
     */
    validate(password) {
        const result = {
            isValid: true,
            errors: [],
            strength: 0,
            checks: {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                numberOrSymbol: /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
            }
        };

        // Check each requirement
        if (!result.checks.length) {
            result.errors.push('Password must be at least 8 characters long');
            result.isValid = false;
        } else {
            result.strength += 25;
        }

        if (!result.checks.uppercase) {
            result.errors.push('Password must contain at least one uppercase letter');
            result.isValid = false;
        } else {
            result.strength += 25;
        }

        if (!result.checks.lowercase) {
            result.errors.push('Password must contain at least one lowercase letter');
            result.isValid = false;
        } else {
            result.strength += 25;
        }

        if (!result.checks.numberOrSymbol) {
            result.errors.push('Password must contain at least one number or symbol');
            result.isValid = false;
        } else {
            result.strength += 25;
        }

        return result;
    },

    /**
     * Get strength label based on score
     * @param {number} strength - Strength score (0-100)
     * @returns {string} Strength label
     */
    getStrengthLabel(strength) {
        if (strength === 0) return 'Very Weak';
        if (strength === 25) return 'Weak';
        if (strength === 50) return 'Fair';
        if (strength === 75) return 'Good';
        if (strength === 100) return 'Strong';
        return 'Unknown';
    },

    /**
     * Get strength color based on score
     * @param {number} strength - Strength score (0-100)
     * @returns {string} Color code
     */
    getStrengthColor(strength) {
        if (strength === 0) return '#dc2626';
        if (strength === 25) return '#f59e0b';
        if (strength === 50) return '#eab308';
        if (strength === 75) return '#84cc16';
        if (strength === 100) return '#10b981';
        return '#6b7280';
    },

    /**
     * Create password strength indicator UI
     * @param {HTMLElement} container - Container element
     * @returns {Object} UI elements
     */
    createStrengthIndicator(container) {
        const indicatorHTML = `
            <div class="password-strength-container" style="margin-top: 12px; display: none; opacity: 0; transition: opacity 0.3s ease;">
                <div class="password-strength-bar" style="height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
                    <div class="password-strength-fill" style="height: 100%; width: 0%; background: #dc2626; transition: all 0.3s ease; border-radius: 3px;"></div>
                </div>
                <div class="password-strength-label" style="font-size: 13px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">
                    Password Strength: <span class="strength-text">Very Weak</span>
                </div>
                <div class="password-requirements" style="font-size: 13px; color: #6b7280;">
                    <div class="requirement-item" data-check="length" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; transition: all 0.3s ease;">
                        <span class="requirement-icon" style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; font-size: 10px; transition: all 0.3s ease;">✗</span>
                        <span class="requirement-text">At least 8 characters</span>
                    </div>
                    <div class="requirement-item" data-check="uppercase" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; transition: all 0.3s ease;">
                        <span class="requirement-icon" style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; font-size: 10px; transition: all 0.3s ease;">✗</span>
                        <span class="requirement-text">One uppercase letter (A-Z)</span>
                    </div>
                    <div class="requirement-item" data-check="lowercase" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; transition: all 0.3s ease;">
                        <span class="requirement-icon" style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; font-size: 10px; transition: all 0.3s ease;">✗</span>
                        <span class="requirement-text">One lowercase letter (a-z)</span>
                    </div>
                    <div class="requirement-item" data-check="numberOrSymbol" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; transition: all 0.3s ease;">
                        <span class="requirement-icon" style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; font-size: 10px; transition: all 0.3s ease;">✗</span>
                        <span class="requirement-text">One number or symbol (!@#$%...)</span>
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', indicatorHTML);

        return {
            strengthBar: container.querySelector('.password-strength-fill'),
            strengthText: container.querySelector('.strength-text'),
            requirements: container.querySelectorAll('.requirement-item'),
            strengthContainer: container.querySelector('.password-strength-container')
        };
    },

    /**
     * Update strength indicator UI
     * @param {Object} elements - UI elements
     * @param {Object} validation - Validation result
     */
    updateStrengthIndicator(elements, validation) {
        const {
            strengthBar,
            strengthText,
            requirements
        } = elements;
        const {
            strength,
            checks
        } = validation;

        // Update strength bar
        strengthBar.style.width = `${strength}%`;
        strengthBar.style.background = this.getStrengthColor(strength);

        // Update strength label
        strengthText.textContent = this.getStrengthLabel(strength);
        strengthText.style.color = this.getStrengthColor(strength);

        // Update requirements
        requirements.forEach(item => {
            const checkType = item.dataset.check;
            const icon = item.querySelector('.requirement-icon');
            const text = item.querySelector('.requirement-text');

            if (checks[checkType]) {
                // Requirement met
                icon.textContent = '✓';
                icon.style.background = '#10b981';
                icon.style.borderColor = '#10b981';
                icon.style.color = 'white';
                text.style.color = '#10b981';
                text.style.fontWeight = '600';
            } else {
                // Requirement not met
                icon.textContent = '✗';
                icon.style.background = 'transparent';
                icon.style.borderColor = '#d1d5db';
                icon.style.color = '#9ca3af';
                text.style.color = '#6b7280';
                text.style.fontWeight = '400';
            }
        });
    },

    /**
     * Initialize password validation for an input field
     * @param {string} passwordInputId - Password input element ID
     * @param {string} confirmPasswordInputId - Confirm password input element ID (optional)
     */
    init(passwordInputId, confirmPasswordInputId = null) {
        const passwordInput = document.getElementById(passwordInputId);
        if (!passwordInput) {
            console.error(`Password input with ID "${passwordInputId}" not found`);
            return;
        }

        // Find or create container for strength indicator
        let container = passwordInput.parentElement.querySelector('.password-strength-container');
        if (!container) {
            const wrapper = passwordInput.closest('.form-group') || passwordInput.parentElement;
            const elements = this.createStrengthIndicator(wrapper);

            // Show/hide indicator on focus/blur
            passwordInput.addEventListener('focus', () => {
                elements.strengthContainer.style.display = 'block';
                setTimeout(() => {
                    elements.strengthContainer.style.opacity = '1';
                }, 10);
            });

            passwordInput.addEventListener('blur', () => {
                elements.strengthContainer.style.opacity = '0';
                setTimeout(() => {
                    elements.strengthContainer.style.display = 'none';
                }, 300);
            });

            // Add input event listener
            passwordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                const validation = this.validate(password);
                this.updateStrengthIndicator(elements, validation);

                // Update input border color
                if (password.length === 0) {
                    passwordInput.classList.remove('success', 'error');
                } else if (validation.isValid) {
                    passwordInput.classList.remove('error');
                    passwordInput.classList.add('success');
                } else {
                    passwordInput.classList.remove('success');
                    passwordInput.classList.add('error');
                }
            });
        }

        // Handle confirm password if provided
        if (confirmPasswordInputId) {
            const confirmPasswordInput = document.getElementById(confirmPasswordInputId);
            if (confirmPasswordInput) {
                // Create match indicator
                const confirmWrapper = confirmPasswordInput.closest('.form-group') || confirmPasswordInput.parentElement;
                const matchIndicatorHTML = `
                    <div class="password-match-indicator" style="margin-top: 8px; font-size: 13px; font-weight: 600; display: none; opacity: 0; align-items: center; gap: 8px; transition: opacity 0.3s ease;">
                        <span class="match-icon" style="width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;"></span>
                        <span class="match-text"></span>
                    </div>
                `;
                confirmWrapper.insertAdjacentHTML('beforeend', matchIndicatorHTML);

                const matchIndicator = confirmWrapper.querySelector('.password-match-indicator');
                const matchIcon = matchIndicator.querySelector('.match-icon');
                const matchText = matchIndicator.querySelector('.match-text');

                // Show/hide match indicator on focus/blur
                confirmPasswordInput.addEventListener('focus', () => {
                    if (confirmPasswordInput.value.length > 0) {
                        matchIndicator.style.display = 'flex';
                        setTimeout(() => {
                            matchIndicator.style.opacity = '1';
                        }, 10);
                    }
                });

                confirmPasswordInput.addEventListener('blur', () => {
                    matchIndicator.style.opacity = '0';
                    setTimeout(() => {
                        matchIndicator.style.display = 'none';
                    }, 300);
                });

                // Add input event listeners for both fields
                const checkPasswordMatch = () => {
                    const password = passwordInput.value;
                    const confirmPassword = confirmPasswordInput.value;

                    if (confirmPassword.length === 0) {
                        matchIndicator.style.display = 'none';
                        matchIndicator.style.opacity = '0';
                        confirmPasswordInput.classList.remove('success', 'error');
                        return;
                    }

                    // Only show if confirm password field is focused
                    if (document.activeElement === confirmPasswordInput) {
                        matchIndicator.style.display = 'flex';
                        setTimeout(() => {
                            matchIndicator.style.opacity = '1';
                        }, 10);
                    }

                    if (password === confirmPassword && password.length > 0) {
                        // Passwords match
                        matchIcon.textContent = '✓';
                        matchIcon.style.background = '#10b981';
                        matchIcon.style.color = 'white';
                        matchText.textContent = 'Passwords match';
                        matchText.style.color = '#10b981';
                        confirmPasswordInput.classList.remove('error');
                        confirmPasswordInput.classList.add('success');
                    } else {
                        // Passwords don't match
                        matchIcon.textContent = '✗';
                        matchIcon.style.background = '#dc2626';
                        matchIcon.style.color = 'white';
                        matchText.textContent = 'Passwords do not match';
                        matchText.style.color = '#dc2626';
                        confirmPasswordInput.classList.remove('success');
                        confirmPasswordInput.classList.add('error');
                    }
                };

                passwordInput.addEventListener('input', checkPasswordMatch);
                confirmPasswordInput.addEventListener('input', checkPasswordMatch);
            }
        }
    }
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the register page
    if (document.getElementById('studentRegisterForm')) {
        PasswordValidator.init('password', 'confirmPassword');
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PasswordValidator;
}