// Student Dashboard Functionality

// Check authentication
let currentUser = null;

(async function() {
    currentUser = await checkAuth('student');
    if (!currentUser) {
        // User will be redirected by checkAuth function
    } else {
        await initializeDashboard();
    }
})();

async function initializeDashboard() {
    // Display user information
    document.getElementById('studentName').textContent = currentUser.name;
    document.getElementById('studentSemester').textContent = currentUser.department;

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
    // Get ALL surveys first for debugging
    const allSurveysUnfiltered = await Storage.getSurveys();

    // Enhanced debug logging BEFORE filtering
    console.log('=== SURVEY LOADING DEBUG (BEFORE FILTER) ===');
    console.log('Student Department:', currentUser.department);
    console.log('Student Department Type:', typeof currentUser.department);
    console.log('Total Surveys in DB:', allSurveysUnfiltered.length);
    console.log('All Surveys:', allSurveysUnfiltered.map(s => ({
        id: s.id,
        dept: s.department,
        active: s.isActive
    })));

    // Get surveys filtered by student's department
    let surveys = [];

    if (currentUser.department) {
        const filteredSurveys = await Storage.getSurveysByDepartment(currentUser.department);
        surveys = filteredSurveys.filter(s => s.isActive !== false);
    } else {
        console.warn('⚠️ Student has no department set!');
        // Fallback: show all active surveys if no department
        surveys = allSurveysUnfiltered.filter(s => s.isActive !== false);
    }

    // Enhanced debug logging AFTER filtering
    console.log('=== SURVEY LOADING DEBUG (AFTER FILTER) ===');
    console.log('Filtered Surveys Count:', surveys.length);
    console.log('Matched Surveys:', surveys.map(s => ({
        id: s.id,
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
                <p>There are no active surveys for your department at the moment.</p>
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

    // Determine department display text
    let departmentDisplay = survey.department;

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