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

    // Ensure admin Class Survey link is present in sidebar (robustness for inconsistent HTML copies)
    ensureClassSurveyLink();

    // Handle window resize
    handleWindowResize();
}

// Ensure 'Class Survey' nav item exists in the sidebar (helps pages missing it)
function ensureClassSurveyLink() {
    try {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        // Only inject link for admin sidebar variants
        if (!sidebar.classList.contains('admin-sidebar')) return;
        const nav = sidebar.querySelector('.sidebar-nav');
        if (!nav) return;
        // If link already exists, nothing to do
        if (nav.querySelector('a[href="select-faculties.html"]')) return;

        // Create the link and insert after Manage Faculties link if present
        const link = document.createElement('a');
        link.className = 'nav-item';
        link.href = 'select-faculties.html';
        link.innerHTML = '<span class="icon">🏫</span><span>Class Survey</span>';

        // Find Manage Faculties link and insert after it
        const manageFacultiesLink = nav.querySelector('a[href="manage-faculties.html"]');
        if (manageFacultiesLink && manageFacultiesLink.parentNode) {
            manageFacultiesLink.parentNode.insertBefore(link, manageFacultiesLink.nextSibling);
        } else {
            // Fallback: insert at position 2 (after dashboard if manage-faculties not found)
            const dashboardLink = nav.querySelector('a[href="admin-dashboard.html"]');
            if (dashboardLink && dashboardLink.parentNode) {
                dashboardLink.parentNode.insertBefore(link, dashboardLink.nextSibling);
            } else {
                nav.insertBefore(link, nav.firstChild);
            }
        }
    } catch (e) {
        console.error('Could not ensure Class Survey link in sidebar', e);
    }
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