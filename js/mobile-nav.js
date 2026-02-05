// Mobile Navigation Handler for Faculty Feedback System
// Handles responsive sidebar navigation for admin and student portals

document.addEventListener('DOMContentLoaded', function() {
    initializeMobileNavigation();
});

function initializeMobileNavigation() {
    // Create mobile menu toggle button if it doesn't exist
    createMobileMenuToggle();

    // Create mobile overlay if it doesn't exist
    createMobileOverlay();

    // Add event listeners
    setupMobileNavEventListeners();

    // Handle window resize
    handleWindowResize();
}

function createMobileMenuToggle() {
    // Check if mobile toggle already exists
    if (document.querySelector('.mobile-menu-toggle')) {
        return;
    }

    const toggleButton = document.createElement('button');
    toggleButton.className = 'mobile-menu-toggle';
    toggleButton.innerHTML = '☰';
    toggleButton.setAttribute('aria-label', 'Toggle mobile menu');

    // Insert at the beginning of body
    document.body.insertBefore(toggleButton, document.body.firstChild);
}

function createMobileOverlay() {
    // Check if overlay already exists
    if (document.querySelector('.mobile-overlay')) {
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';

    // Insert after the toggle button
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    if (toggleButton) {
        toggleButton.parentNode.insertBefore(overlay, toggleButton.nextSibling);
    } else {
        document.body.appendChild(overlay);
    }
}

function setupMobileNavEventListeners() {
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');

    if (!toggleButton || !sidebar || !overlay) {
        return;
    }

    // Toggle button click
    toggleButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileMenu();
    });

    // Add touch event support for better mobile responsiveness
    toggleButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        this.click();
    }, {
        passive: false
    });

    // Overlay click to close menu
    overlay.addEventListener('click', function() {
        closeMobileMenu();
    });

    // Close menu when clicking on nav items (mobile only)
    const navItems = sidebar.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });

    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('mobile-visible')) {
            closeMobileMenu();
        }
    });
}

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');

    if (!sidebar || !overlay) {
        return;
    }

    const isOpen = sidebar.classList.contains('mobile-visible');

    if (isOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    const toggleButton = document.querySelector('.mobile-menu-toggle');

    if (!sidebar || !overlay) {
        return;
    }

    sidebar.classList.add('mobile-visible');
    sidebar.classList.remove('mobile-hidden');
    overlay.classList.add('show');

    if (toggleButton) {
        toggleButton.innerHTML = '✕';
        toggleButton.setAttribute('aria-expanded', 'true');
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus management for accessibility
    const firstNavItem = sidebar.querySelector('.nav-item');
    if (firstNavItem) {
        setTimeout(() => firstNavItem.focus(), 100);
    }
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    const toggleButton = document.querySelector('.mobile-menu-toggle');

    if (!sidebar || !overlay) {
        return;
    }

    sidebar.classList.remove('mobile-visible');
    sidebar.classList.add('mobile-hidden');
    overlay.classList.remove('show');

    if (toggleButton) {
        toggleButton.innerHTML = '☰';
        toggleButton.setAttribute('aria-expanded', 'false');
    }

    // Restore body scroll
    document.body.style.overflow = '';

    // Return focus to toggle button
    if (toggleButton) {
        toggleButton.focus();
    }
}

function handleWindowResize() {
    window.addEventListener('resize', function() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        const toggleButton = document.querySelector('.mobile-menu-toggle');

        if (!sidebar || !overlay) {
            return;
        }

        // Close mobile menu on desktop
        if (window.innerWidth > 768) {
            sidebar.classList.remove('mobile-visible', 'mobile-hidden');
            overlay.classList.remove('show');
            document.body.style.overflow = '';

            if (toggleButton) {
                toggleButton.innerHTML = '☰';
                toggleButton.setAttribute('aria-expanded', 'false');
            }
        } else {
            // Ensure sidebar is hidden on mobile by default
            if (!sidebar.classList.contains('mobile-visible')) {
                sidebar.classList.add('mobile-hidden');
            }
        }
    });

    // Initial check
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && !sidebar.classList.contains('mobile-visible')) {
            sidebar.classList.add('mobile-hidden');
        }
    }
}

// Utility function to check if device is mobile
function isMobileDevice() {
    return window.innerWidth <= 768;
}

// Utility function to check if device is tablet
function isTabletDevice() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

// Export functions for use in other scripts
window.MobileNav = {
    toggle: toggleMobileMenu,
    open: openMobileMenu,
    close: closeMobileMenu,
    isMobile: isMobileDevice,
    isTablet: isTabletDevice
};

console.log('📱 Mobile navigation initialized successfully');