/**
 * Micro-Interactions Module
 * Handles notifications, loading states, and smooth transitions
 */

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 2000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 4000, title = '') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} fade-in`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <div class="notification-content">
                ${title ? `<div class="notification-title">${title}</div>` : ''}
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" aria-label="Close notification">×</button>
        `;

        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.remove(notification));

        this.container.appendChild(notification);
        this.notifications.push(notification);

        if (duration > 0) {
            setTimeout(() => this.remove(notification), duration);
        }

        return notification;
    }

    remove(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
            this.notifications = this.notifications.filter(n => n !== notification);
        }, 300);
    }

    success(message, title = 'Success', duration = 4000) {
        return this.show(message, 'success', duration, title);
    }

    error(message, title = 'Error', duration = 5000) {
        return this.show(message, 'error', duration, title);
    }

    warning(message, title = 'Warning', duration = 4000) {
        return this.show(message, 'warning', duration, title);
    }

    info(message, title = 'Info', duration = 3000) {
        return this.show(message, 'info', duration, title);
    }

    clear() {
        this.notifications.forEach(notification => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 300);
        });
        this.notifications = [];
    }
}

// Global notification manager instance
const notificationManager = new NotificationManager();

/**
 * Loading State Manager
 */
class LoadingManager {
    static show(element) {
        if (element) {
            element.classList.add('loading');
            element.style.pointerEvents = 'none';
        }
    }

    static hide(element) {
        if (element) {
            element.classList.remove('loading');
            element.style.pointerEvents = 'auto';
        }
    }

    static showSkeleton(container, count = 3) {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton';
            skeleton.style.cssText = `
                height: 80px;
                border-radius: 8px;
                margin-bottom: 12px;
            `;
            container.appendChild(skeleton);
        }
    }
}

/**
 * Page Transition Manager
 */
class PageTransitionManager {
    static apply(element) {
        element.classList.add('page-transition');
    }

    static applyToContent() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            this.apply(mainContent);
        }
    }
}

/**
 * Breadcrumb Manager
 */
class BreadcrumbManager {
    static create(items) {
        const breadcrumb = document.createElement('nav');
        breadcrumb.className = 'breadcrumb';
        breadcrumb.setAttribute('aria-label', 'Breadcrumb');

        items.forEach((item, index) => {
            const itemEl = document.createElement('a');
            itemEl.className = 'breadcrumb-item';
            
            if (index === items.length - 1) {
                itemEl.classList.add('active');
                itemEl.textContent = item.label;
                itemEl.style.cursor = 'default';
            } else {
                itemEl.href = item.href || '#';
                itemEl.textContent = item.label;
            }

            breadcrumb.appendChild(itemEl);

            if (index < items.length - 1) {
                const separator = document.createElement('span');
                separator.className = 'breadcrumb-separator';
                separator.textContent = '/';
                breadcrumb.appendChild(separator);
            }
        });

        return breadcrumb;
    }

    static insert(breadcrumb, targetSelector = '.dashboard-content') {
        const target = document.querySelector(targetSelector);
        if (target) {
            target.insertBefore(breadcrumb, target.firstChild);
        }
    }
}

/**
 * Progress Bar Manager
 */
class ProgressBarManager {
    static create(container) {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = '<div class="progress-bar-fill" style="width: 0%"></div>';
        
        if (container) {
            container.insertBefore(progressBar, container.firstChild);
        }
        
        return progressBar;
    }

    static update(progressBar, percentage) {
        const fill = progressBar.querySelector('.progress-bar-fill');
        if (fill) {
            fill.style.width = Math.min(100, Math.max(0, percentage)) + '%';
        }
    }

    static complete(progressBar) {
        const fill = progressBar.querySelector('.progress-bar-fill');
        if (fill) {
            fill.style.width = '100%';
            setTimeout(() => {
                progressBar.style.opacity = '0';
                progressBar.style.transition = 'opacity 0.3s ease';
                setTimeout(() => progressBar.remove(), 300);
            }, 500);
        }
    }
}

/**
 * Tooltip Manager
 */
class TooltipManager {
    static add(element, text) {
        element.classList.add('tooltip');
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip-text';
        tooltip.textContent = text;
        element.appendChild(tooltip);
    }

    static addToAll(selector, textAttribute = 'data-tooltip') {
        document.querySelectorAll(selector).forEach(element => {
            const text = element.getAttribute(textAttribute);
            if (text) {
                this.add(element, text);
            }
        });
    }
}

/**
 * Stagger Animation Manager
 */
class StaggerAnimationManager {
    static apply(container, itemSelector = '.stagger-item') {
        const items = container.querySelectorAll(itemSelector);
        items.forEach((item, index) => {
            item.style.animationDelay = (index * 0.05) + 's';
            item.classList.add('stagger-item');
        });
    }
}

/**
 * Button Ripple Effect
 */
class RippleEffect {
    static init(selector = '.btn') {
        document.querySelectorAll(selector).forEach(button => {
            button.addEventListener('click', (e) => {
                const ripple = document.createElement('span');
                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 50%;
                    left: ${x}px;
                    top: ${y}px;
                    pointer-events: none;
                    animation: ripple 0.6s ease-out;
                `;

                button.style.position = 'relative';
                button.style.overflow = 'hidden';
                button.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });
    }
}

/**
 * Smooth Scroll Behavior
 */
class SmoothScroll {
    static init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href !== '#') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }
}

/**
 * Form Validation with Animations
 */
class FormValidator {
    static validate(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            if (!input.checkValidity()) {
                isValid = false;
                input.classList.add('invalid');
                input.style.animation = 'shake 0.3s ease';
            } else {
                input.classList.remove('invalid');
            }
        });

        return isValid;
    }

    static addShakeAnimation() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize animations on page load
document.addEventListener('DOMContentLoaded', () => {
    FormValidator.addShakeAnimation();
    RippleEffect.init();
    SmoothScroll.init();
    PageTransitionManager.applyToContent();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NotificationManager,
        LoadingManager,
        PageTransitionManager,
        BreadcrumbManager,
        ProgressBarManager,
        TooltipManager,
        StaggerAnimationManager,
        RippleEffect,
        SmoothScroll,
        FormValidator,
        notificationManager
    };
}
