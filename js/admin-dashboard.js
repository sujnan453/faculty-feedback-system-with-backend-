// Admin Dashboard Functionality

let currentUser = null;

// Custom confirmation dialog (same as in manage-questions.js)
function showConfirmDialog(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;`;

        const modal = document.createElement('div');
        modal.style.cssText = `background: white; border-radius: 12px; padding: 30px; max-width: 450px; width: 90%; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);`;

        modal.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #1a202c; font-size: 20px; font-weight: 700;">${title}</h3>
            <p style="margin: 0 0 25px 0; color: #4a5568; font-size: 15px; line-height: 1.6;">${message}</p>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="cancelBtn" style="padding: 12px 24px; border: 2px solid #e2e8f0; background: white; color: #4a5568; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">${cancelText}</button>
                <button id="confirmBtn" style="padding: 12px 24px; border: none; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">${confirmText}</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        modal.querySelector('#confirmBtn').onclick = () => {
            document.body.removeChild(overlay);
            resolve(true);
        };

        modal.querySelector('#cancelBtn').onclick = () => {
            document.body.removeChild(overlay);
            resolve(false);
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve(false);
            }
        };
    });
}

(async function() {
    currentUser = await checkAuth('admin');
    if (!currentUser) {
        // User will be redirected
    } else {
        await initializeAdminDashboard();
    }
})();

async function initializeAdminDashboard() {
    // Display admin information
    document.getElementById('adminName').textContent = currentUser.name;

    // Set user initials
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userInitials').textContent = initials;

    // Add breadcrumb navigation
    addBreadcrumb();

    // Load statistics
    await loadStatistics();

    // Load recent surveys
    await loadRecentSurveys();

    // Enable/disable Select Faculties button based on existing classes in Firebase
    try {
        const classes = await Storage.getClasses();
        const btn = document.getElementById('selectFacultiesBtn');
        if (btn && classes && classes.length > 0) {
            btn.disabled = false;
        }
    } catch (e) {
        // ignore
    }

    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            await loadStatistics();
            await loadRecentSurveys();
        }
    });
}

function addBreadcrumb() {
    if (typeof BreadcrumbManager !== 'undefined') {
        const breadcrumb = BreadcrumbManager.create([{
                label: '🏠 Home',
                href: 'admin-dashboard.html'
            },
            {
                label: 'Dashboard'
            }
        ]);
        BreadcrumbManager.insert(breadcrumb);
    }
}

async function loadStatistics() {
    try {
        // Use optimized statistics function
        const stats = await Storage.getStatistics();

        if (stats) {
            // Main stat values
            document.getElementById('totalSurveys').textContent = stats.totalSurveys;
            document.getElementById('totalResponses').textContent = stats.totalFeedbacks;
            document.getElementById('totalStudents').textContent = stats.totalStudents;
            document.getElementById('activeSurveys').textContent = stats.activeSurveys;

            // Survey Card Details
            document.getElementById('activeSurveysCount').textContent = stats.activeSurveys;
            document.getElementById('inactiveSurveysCount').textContent = stats.inactiveSurveys;

            // Response Card Details
            document.getElementById('avgResponsesPerSurvey').textContent = stats.avgResponsesPerSurvey;

            // Student Card Details
            document.getElementById('totalAdmins').textContent = stats.totalAdmins;
            document.getElementById('totalUsers').textContent = stats.totalUsers;

            // Active Surveys Card Details
            document.getElementById('totalDepartments').textContent = stats.totalDepartments;

            console.log('✅ Statistics loaded from optimized function');
        } else {
            // Fallback to old method if optimized fails
            await loadStatisticsLegacy();
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Fallback to legacy method
        await loadStatisticsLegacy();
    }
}

// Legacy statistics function (fallback)
async function loadStatisticsLegacy() {
    const surveys = await Storage.getSurveys();
    const feedbacks = await Storage.getFeedbacks();
    const users = await Storage.getUsers();
    const departments = await Storage.getDepartments();

    const students = users.filter(u => u.role === 'student');
    const admins = users.filter(u => u.role === 'admin');
    const activeSurveys = surveys.filter(s => s.isActive !== false);
    const inactiveSurveys = surveys.filter(s => s.isActive === false);

    // Main stat values
    document.getElementById('totalSurveys').textContent = surveys.length;
    document.getElementById('totalResponses').textContent = feedbacks.length;
    document.getElementById('totalStudents').textContent = students.length;
    document.getElementById('activeSurveys').textContent = activeSurveys.length;

    // Survey Card Details
    document.getElementById('activeSurveysCount').textContent = activeSurveys.length;
    document.getElementById('inactiveSurveysCount').textContent = inactiveSurveys.length;

    // Response Card Details
    const avgResponsesPerSurvey = surveys.length > 0 ? (feedbacks.length / surveys.length).toFixed(2) : 0;
    document.getElementById('avgResponsesPerSurvey').textContent = avgResponsesPerSurvey;

    // Student Card Details
    document.getElementById('totalAdmins').textContent = admins.length;
    document.getElementById('totalUsers').textContent = users.length;

    // Active Surveys Card Details
    document.getElementById('totalDepartments').textContent = departments.length;

    console.log('✅ Statistics loaded (legacy method)');
}

async function loadRecentSurveys() {
    const surveys = await Storage.getRecentSurveys(50); // Load only 50 most recent
    const container = document.getElementById('recentSurveysContainer');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const bulkActionBtn = document.getElementById('bulkActionBtn');

    if (surveys.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📭</span>
                <h3>No Surveys Created Yet</h3>
                <p>Create your first survey to get started</p>
                <a href="create-survey.html" class="btn btn-primary" style="margin-top: 20px; display: inline-block;">Create Survey</a>
            </div>
        `;
        // Hide both buttons when no surveys
        selectAllBtn.style.display = 'none';
        bulkActionBtn.style.display = 'none';
        // Reset selection mode
        isSelectionMode = false;
        return;
    }

    container.innerHTML = '';

    // Create survey items with stagger animation
    for (let index = 0; index < surveys.length; index++) {
        const survey = surveys[index];
        const item = await createSurveyItem(survey);
        item.classList.add('stagger-item');
        item.style.animationDelay = (index * 0.05) + 's';
        container.appendChild(item);
    }

    // Reset to initial state - always show Select All button, hide Delete button
    if (surveys.length > 0) {
        selectAllBtn.style.display = 'flex';
        selectAllBtn.innerHTML = '<span>☑️</span><span>Select All</span>';
        bulkActionBtn.style.display = 'none';
        bulkActionBtn.innerHTML = '<span>🗑️</span><span>Delete</span>';
    } else {
        selectAllBtn.style.display = 'none';
        bulkActionBtn.style.display = 'none';
    }

    // Always reset selection mode to false on load
    isSelectionMode = false;

    console.log(`✅ Loaded ${surveys.length} recent surveys`);
}

async function createSurveyItem(survey) {
    const item = document.createElement('div');
    item.className = 'survey-item';
    item.dataset.surveyId = survey.id;

    const createdDate = new Date(survey.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Use optimized statistics function
    let feedbackCount = 0;
    try {
        const stats = await Storage.getSurveyStatistics(survey.id);
        feedbackCount = stats ? stats.totalResponses : 0;
    } catch (error) {
        console.warn('Failed to get survey stats, using fallback');
        const feedbacks = await Storage.getFeedbacksBySurveyId(survey.id);
        feedbackCount = feedbacks.length;
    }

    const isActive = survey.isActive !== false;

    item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px; width: 100%;">
            <input type="checkbox" class="survey-checkbox" data-survey-id="${survey.id}" 
                   style="width: 20px; height: 20px; cursor: pointer; accent-color: #7c3aed; display: none;">
            <div class="survey-item-info" style="flex: 1;">
                <h4>${survey.className || survey.department || 'Untitled'} - Class</h4>
                <div class="survey-item-meta">
                    <span>📅 Created: ${createdDate}</span>
                    <span>❓ ${(survey.questions || []).length} Questions</span>
                    <span>📝 ${feedbackCount} Responses</span>
                </div>
            </div>
            <div class="survey-item-actions">
                <span class="survey-status ${isActive ? 'status-active' : 'status-inactive'}">
                    ${isActive ? '● Active' : '○ Inactive'}
                </span>
                <button class="btn btn-secondary btn-sm" onclick="viewSurveyDetails('${survey.id}')">View Details</button>
                <button class="btn btn-danger btn-sm" onclick="deleteSurvey('${survey.id}')" style="background: #f56565; color: white; border: none; padding: 4px 8px; font-size: 11px;">🗑️ Delete</button>
            </div>
        </div>
    `;

    return item;
}

// Track selection mode
let isSelectionMode = false;

function toggleSelectMode() {
    console.log('toggleSelectMode called, current mode:', isSelectionMode);
    isSelectionMode = !isSelectionMode;
    const checkboxes = document.querySelectorAll('.survey-checkbox');
    console.log('Found checkboxes:', checkboxes.length);
    const selectAllBtn = document.getElementById('selectAllBtn');
    const bulkActionBtn = document.getElementById('bulkActionBtn');

    if (isSelectionMode) {
        console.log('Showing checkboxes');
        // Show checkboxes and select all
        checkboxes.forEach(cb => {
            console.log('Setting checkbox display to block');
            cb.style.display = 'block';
            cb.checked = true;
        });
        selectAllBtn.innerHTML = '<span>☐</span><span>Deselect All</span>';
        bulkActionBtn.style.display = 'flex'; // Show delete button
        bulkActionBtn.innerHTML = '<span>🗑️</span><span>Delete (' + checkboxes.length + ')</span>';
    } else {
        console.log('Hiding checkboxes');
        // Hide checkboxes
        checkboxes.forEach(cb => {
            cb.style.display = 'none';
            cb.checked = false;
        });
        selectAllBtn.innerHTML = '<span>☑️</span><span>Select All</span>';
        bulkActionBtn.style.display = 'none'; // Hide delete button
        bulkActionBtn.innerHTML = '<span>🗑️</span><span>Delete</span>';
    }
}

async function handleBulkAction() {
    const checkboxes = document.querySelectorAll('.survey-checkbox');
    const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);

    if (checkedBoxes.length === 0) {
        // Cancel - hide checkboxes and reset to initial state
        isSelectionMode = false;
        checkboxes.forEach(cb => {
            cb.style.display = 'none';
            cb.checked = false;
        });
        const selectAllBtn = document.getElementById('selectAllBtn');
        const bulkActionBtn = document.getElementById('bulkActionBtn');
        selectAllBtn.innerHTML = '<span>☑️</span><span>Select All</span>';
        bulkActionBtn.style.display = 'none';
        bulkActionBtn.innerHTML = '<span>🗑️</span><span>Delete</span>';
        return;
    }

    // Delete selected
    const surveyIds = checkedBoxes.map(cb => cb.dataset.surveyId);
    const count = surveyIds.length;

    const confirmed = await showConfirmDialog(
        'Delete Surveys',
        `Are you sure you want to delete ${count} survey${count > 1 ? 's' : ''}? This cannot be undone.`,
        'Delete',
        'Cancel'
    );

    if (confirmed) {
        const bulkActionBtn = document.getElementById('bulkActionBtn');

        // Show loading state on bulk delete button
        bulkActionBtn.disabled = true;
        bulkActionBtn.style.opacity = '0.7';
        bulkActionBtn.innerHTML = `
            <svg style="width: 16px; height: 16px; animation: spin 0.8s linear infinite; display: inline-block; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="31.4 31.4" stroke-linecap="round" style="opacity: 0.25;"></circle>
                <circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="15.7 31.4" stroke-linecap="round"></circle>
            </svg>
            <span>Deleting ${count}...</span>
        `;

        // Add fade effect to selected items
        surveyIds.forEach(surveyId => {
            const surveyItem = document.querySelector(`[data-survey-id="${surveyId}"]`);
            if (surveyItem) {
                surveyItem.style.transition = 'all 0.3s ease';
                surveyItem.style.opacity = '0.5';
                surveyItem.style.transform = 'scale(0.98)';
                surveyItem.style.pointerEvents = 'none';
            }
        });

        try {
            for (const surveyId of surveyIds) {
                await Storage.deleteSurvey(surveyId);
            }

            showAlert(`✅ Deleted ${count} survey${count > 1 ? 's' : ''}!`, 'success');

            // Reset selection mode before reloading
            isSelectionMode = false;

            await loadRecentSurveys();
            await loadStatistics();
        } catch (error) {
            console.error('Error:', error);
            showAlert('❌ Error deleting surveys', 'danger');

            // Reset button state
            bulkActionBtn.disabled = false;
            bulkActionBtn.style.opacity = '1';
            bulkActionBtn.innerHTML = '<span>🗑️</span><span>Delete</span>';

            // Reset survey items
            surveyIds.forEach(surveyId => {
                const surveyItem = document.querySelector(`[data-survey-id="${surveyId}"]`);
                if (surveyItem) {
                    surveyItem.style.opacity = '1';
                    surveyItem.style.transform = 'scale(1)';
                    surveyItem.style.pointerEvents = 'auto';
                }
            });
        }
    }
}

function viewSurveyDetails(surveyId) {
    // Show loading state
    if (typeof notificationManager !== 'undefined') {
        notificationManager.info('Loading survey details...', 'Loading', 0);
    }

    // Store the survey ID and redirect to faculty performance page
    sessionStorage.setItem('selectedSurveyId', surveyId);

    setTimeout(() => {
        window.location.href = 'faculty-performance.html';
    }, 300);
}

async function deleteSurvey(surveyId) {
    const confirmed = await showConfirmDialog(
        'Delete Survey',
        'Are you sure you want to delete this survey? This will remove it from all students and cannot be undone.',
        'Delete',
        'Cancel'
    );

    if (confirmed) {
        // Find the survey item and its delete button
        const surveyItem = document.querySelector(`[data-survey-id="${surveyId}"]`);
        const deleteBtn = surveyItem ? surveyItem.querySelector('.btn-danger') : null;

        if (deleteBtn) {
            // Disable button and show loading animation immediately
            deleteBtn.disabled = true;
            deleteBtn.style.opacity = '0.7';
            deleteBtn.style.cursor = 'not-allowed';
            deleteBtn.innerHTML = `
                <svg style="width: 14px; height: 14px; animation: spin 0.8s linear infinite; display: inline-block; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="31.4 31.4" stroke-linecap="round" style="opacity: 0.25;"></circle>
                    <circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="15.7 31.4" stroke-linecap="round"></circle>
                </svg>
                Deleting...
            `;
        }

        // Add pulsing effect to the entire survey item
        if (surveyItem) {
            surveyItem.style.transition = 'all 0.3s ease';
            surveyItem.style.opacity = '0.6';
            surveyItem.style.transform = 'scale(0.98)';
            surveyItem.style.pointerEvents = 'none';
        }

        try {
            await Storage.deleteSurvey(surveyId);

            // Fade out animation before removing
            if (surveyItem) {
                surveyItem.style.opacity = '0';
                surveyItem.style.transform = 'scale(0.95)';

                setTimeout(async () => {
                    await loadStatistics();
                    await loadRecentSurveys();
                    if (typeof notificationManager !== 'undefined') {
                        notificationManager.success('Survey deleted successfully!', 'Success');
                    }
                }, 300);
            } else {
                await loadStatistics();
                await loadRecentSurveys();
                if (typeof notificationManager !== 'undefined') {
                    notificationManager.success('Survey deleted successfully!', 'Success');
                }
            }
        } catch (error) {
            // Reset button state on error
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.style.opacity = '1';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.innerHTML = '🗑️ Delete';
            }
            if (surveyItem) {
                surveyItem.style.opacity = '1';
                surveyItem.style.transform = 'scale(1)';
                surveyItem.style.pointerEvents = 'auto';
            }
            showAlert('❌ Error deleting survey. Please try again.', 'danger');
            console.error('Delete error:', error);
        }
    }
}

// Make functions globally available
window.viewSurveyDetails = viewSurveyDetails;
window.deleteSurvey = deleteSurvey;
window.toggleSelectMode = toggleSelectMode;
window.handleBulkAction = handleBulkAction;

// ===== Class Survey helpers =====
async function _getClasses() {
    try {
        // Fetch from Firebase (with caching)
        const classes = await Storage.getClasses();
        return classes;
    } catch (e) {
        console.error('Failed to load classes from Firebase', e);
        return [];
    }
}

async function _saveClasses(classes) {
    // This function is deprecated - use Storage.saveClass() directly
    console.warn('_saveClasses is deprecated. Use Storage.saveClass() for individual classes.');
    return false;
}

async function createClass() {
    const name = prompt('Enter a name for the class (e.g. BSc CS - 3rd Year):');
    if (!name || !name.trim()) return;

    try {
        const classes = await _getClasses();

        // Simple uniqueness check
        if (classes.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
            showAlert('A class with this name already exists', 'warning');
            return;
        }

        // Create new class object
        const newClass = {
            id: Storage.generateId(),
            name: name.trim(),
            faculties: [],
            createdAt: new Date().toISOString()
        };

        // Save to Firebase
        await Storage.saveClass(newClass);

        showAlert(`Class "${name.trim()}" created successfully! Redirecting...`, 'success');

        // Enable select faculties button
        const selectBtn = document.getElementById('selectFacultiesBtn');
        if (selectBtn) {
            selectBtn.disabled = false;
        }

        // Redirect to selection page for immediate selection
        setTimeout(() => {
            window.location.href = `select-faculties.html?classId=${encodeURIComponent(newClass.id)}`;
        }, 1500);
    } catch (error) {
        console.error('Error creating class:', error);
        showAlert('Failed to create class: ' + error.message, 'danger');
    }
}

async function selectFaculties(classId) {
    try {
        // If invoked without id, try to read from UI
        const classes = await _getClasses();
        let idToOpen = classId || null;

        if (!idToOpen) {
            if (classes.length === 0) {
                showAlert('Please create a class first', 'warning');
                return;
            } else if (classes.length === 1) {
                idToOpen = classes[0].id;
            }
        }

        const url = idToOpen ? `select-faculties.html?classId=${encodeURIComponent(idToOpen)}` : 'select-faculties.html';
        window.location.href = url;
    } catch (error) {
        console.error('Error selecting faculties:', error);
        showAlert('Failed to load classes: ' + error.message, 'danger');
    }
}

// Expose to global scope
window.createClass = createClass;
window.selectFaculties = selectFaculties;