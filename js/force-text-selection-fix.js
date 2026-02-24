/**
 * CRITICAL FIX: Force text selection on all input fields
 * This script ensures users can select text in email and password fields
 */

(function() {
    'use strict';

    function enableTextSelection() {
        // Get all input and textarea elements
        const inputs = document.querySelectorAll('input, textarea');

        inputs.forEach(input => {
            // Apply inline styles with !important flag
            input.style.setProperty('user-select', 'text', 'important');
            input.style.setProperty('-webkit-user-select', 'text', 'important');
            input.style.setProperty('-moz-user-select', 'text', 'important');
            input.style.setProperty('-ms-user-select', 'text', 'important');
            input.style.setProperty('cursor', 'text', 'important');

            // Remove any blocking attributes
            input.removeAttribute('unselectable');
            input.removeAttribute('onselectstart');
            input.removeAttribute('onmousedown');
            input.removeAttribute('ondragstart');

            // Clear event handlers that might block selection
            input.onselectstart = null;
            input.onmousedown = null;
            input.ondragstart = null;

            // Apply to parent containers
            if (input.parentElement) {
                input.parentElement.style.setProperty('user-select', 'text', 'important');
                input.parentElement.style.setProperty('-webkit-user-select', 'text', 'important');
            }

            // Add event listeners to ensure selection works
            input.addEventListener('mousedown', function(e) {
                e.stopPropagation();
            }, true);

            input.addEventListener('selectstart', function(e) {
                e.stopPropagation();
            }, true);
        });

        console.log('✅ Text selection enabled on', inputs.length, 'input fields');
    }

    // Run immediately
    enableTextSelection();

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enableTextSelection);
    } else {
        enableTextSelection();
    }

    // Run again after delays to catch dynamically added inputs
    setTimeout(enableTextSelection, 100);
    setTimeout(enableTextSelection, 500);
    setTimeout(enableTextSelection, 1000);

    // Watch for new inputs being added
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(function(mutations) {
            let shouldRun = false;
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
                            shouldRun = true;
                        }
                    });
                }
            });
            if (shouldRun) {
                enableTextSelection();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Override any global event handlers
    document.addEventListener('selectstart', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            e.stopPropagation();
        }
    }, true);

    document.addEventListener('mousedown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            e.stopPropagation();
        }
    }, true);

})();