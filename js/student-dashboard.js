// Student Dashboard Functionality

// Check authentication
let currentUser = null;

// Show loading overlay on page load
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
}

// Hide loading overlay
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

(async function() {
    showLoading();
    try {
        currentUser = await checkAuth('student');
        if (!currentUser) {
            // User will be redirected by checkAuth function
            hideLoading();
        } else {
            await initializeDashboard();
            hideLoading();
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        hideLoading();
    }
})();

async function initializeDashboard() {
    // Display user information
    document.getElementById('studentName').textContent = currentUser.name;

    // Display class name (or department as fallback)
    const className = currentUser.className || currentUser.department || 'N/A';
    document.getElementById('studentClass').textContent = className;

    // Display roll number
    const rollNumber = currentUser.rollNumber || 'N/A';
    document.getElementById('studentRollNumber').textContent = rollNumber;

    // Set user initials
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userInitials').textContent = initials;

    // Load surveys
    await loadSurveys();

    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            await loadSurveys();
        }
    });
}

async function loadSurveys() {
    // Show loading for data refresh (optional - only if you want loading on refresh)
    // Uncomment the line below if you want loading animation during refresh
    // showLoading();

    // Get ALL surveys first for debugging
    const allSurveysUnfiltered = await Storage.getSurveys();

    // Enhanced debug logging BEFORE filtering
    console.log('=== SURVEY LOADING DEBUG (BEFORE FILTER) ===');
    console.log('Student Department:', currentUser.department);
    console.log('Student ClassId:', currentUser.classId);
    console.log('Student Department Type:', typeof currentUser.department);
    console.log('Student ClassId Type:', typeof currentUser.classId);
    console.log('Total Surveys in DB:', allSurveysUnfiltered.length);
    console.log('All Surveys:', allSurveysUnfiltered.map(s => ({
        id: s.id,
        classId: s.classId,
        className: s.className,
        dept: s.department,
        active: s.isActive
    })));

    // Prefer filtering by student's class (new flow). Hide legacy department-only surveys unless user has no class.
    let surveys = [];
    const studentClassId = currentUser.classId || null;

    if (studentClassId) {
        // Only show surveys explicitly created for this class
        // FIX: Use String() to ensure type consistency
        surveys = allSurveysUnfiltered.filter(s => {
            const isActive = s.isActive !== false;
            const classMatch = String(s.classId) === String(studentClassId);
            console.log(`Survey ${s.id}: active=${isActive}, classMatch=${classMatch} (survey.classId="${s.classId}" vs student.classId="${studentClassId}")`);
            return isActive && classMatch;
        });
    } else if (currentUser.department) {
        // Fallback for older accounts: show department-scoped surveys that do NOT have a classId
        const filteredSurveys = await Storage.getSurveysByDepartment(currentUser.department);
        surveys = filteredSurveys.filter(s => s.isActive !== false && !s.classId);
    } else {
        console.warn('⚠️ Student has no class or department set!');
        // Default: show no surveys to avoid exposing old data
        surveys = [];
    }

    // Enhanced debug logging AFTER filtering
    console.log('=== SURVEY LOADING DEBUG (AFTER FILTER) ===');
    console.log('Filtered Surveys Count:', surveys.length);
    console.log('Matched Surveys:', surveys.map(s => ({
        id: s.id,
        classId: s.classId,
        className: s.className,
        dept: s.department,
        active: s.isActive
    })));
    console.log('=============================================');

    const feedbacks = await Storage.getFeedbacksByStudentId(currentUser.id);
    const completedSurveyIds = feedbacks.map(f => f.surveyId);

    console.log('📊 Student feedbacks:', feedbacks.length);
    console.log('✅ Completed survey IDs:', completedSurveyIds);

    // Calculate statistics
    const availableCount = surveys.length;
    const completedCount = completedSurveyIds.length;
    const pendingCount = availableCount - completedCount;

    document.getElementById('availableSurveys').textContent = availableCount;
    document.getElementById('completedSurveys').textContent = completedCount;
    document.getElementById('pendingSurveys').textContent = pendingCount;

    // Display surveys
    const surveysContainer = document.getElementById('surveysContainer');

    if (surveys.length === 0) {
        surveysContainer.innerHTML = `
            <div class="empty-state">
                <span>📭</span>
                <h3>No Surveys Available</h3>
                <p>There are no active surveys for your class at the moment.</p>
                ${!studentClassId ? '<p style="color: #dc3545; margin-top: 10px;"><strong>Note:</strong> Your account doesn\'t have a class assigned. Please contact your administrator.</p>' : ''}
            </div>
        `;
        return;
    }

    surveysContainer.innerHTML = '';

    // Use for...of to properly await async createSurveyCard
    for (const survey of surveys) {
        const isCompleted = completedSurveyIds.includes(survey.id);
        const card = await createSurveyCard(survey, isCompleted);
        surveysContainer.appendChild(card);
    }
}

async function createSurveyCard(survey, isCompleted) {
    const card = document.createElement('div');
    card.className = 'survey-card';

    const createdDate = new Date(survey.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Determine display text (class or department)
    let departmentDisplay = survey.className || survey.department || '';

    // Get current faculty count from storage (dynamically updated)
    let facultyCount = (survey.faculties || []).length;
    try {
        const departments = await Storage.getDepartments();
        if (departments && departments.length > 0) {
            const selectedDept = departments.find(dept => dept.name === survey.department);
            if (selectedDept && selectedDept.faculties) {
                facultyCount = selectedDept.faculties.length;
            }
        }
    } catch (error) {
        console.error('Error loading faculty count from storage:', error);
        // Fallback to survey snapshot count
        facultyCount = (survey.faculties || []).length;
    }

    card.innerHTML = `
        <div class="survey-header">
            <div class="survey-info">
                <h3>Faculty Feedback Survey</h3>
            </div>
            <span class="survey-badge">${departmentDisplay}</span>
        </div>
        
        <div class="survey-meta">
            <div class="meta-item">
                <span>📅</span>
                <span>${createdDate}</span>
            </div>
            <div class="meta-item">
                <span>📚</span>
                <span>${departmentDisplay}</span>
            </div>
        </div>
        
        <div class="teacher-count">
            <p>Teachers to evaluate:</p>
            <strong>${facultyCount} Faculties</strong>
        </div>
        
        <div class="survey-actions">
            ${isCompleted ?
            '<button class="btn btn-success">✅ Completed</button>' :
            `<a href="take-survey.html?id=${survey.id}" class="btn btn-primary">Take Survey →</a>`
        }
        </div>
    `;

    return card;
}