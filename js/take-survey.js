// Take Survey - New Redesigned Flow

let currentSurvey = null;
let currentUser_Survey = null;
let selectedTeachers = [];
let currentQuestionIndex = 0;
let ratings = {}; // Store ratings as { questionId: { teacherId: rating } }

// Initialize with async/await
(async function() {
    const currentUser = await checkAuth('student');
    if (!currentUser) {
        // User will be redirected
    } else {
        currentUser_Survey = currentUser;
        await initializeSurvey();
    }
})();

async function initializeSurvey() {
    const urlParams = new URLSearchParams(window.location.search);
    const surveyId = urlParams.get('id');

    if (!surveyId) {
        alert('Invalid survey ID');
        window.location.href = 'student-dashboard.html';
        return;
    }

    currentSurvey = await Storage.getSurveyById(surveyId);

    if (!currentSurvey) {
        alert('Survey not found');
        window.location.href = 'student-dashboard.html';
        return;
    }

    // Verify survey is for student's department using flexible matching
    if (currentSurvey.department && currentUser_Survey.department) {
        const normalize = (str) => {
            return str.trim().toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/[()]/g, '')
                .replace(/\./g, '')
                .replace(/_/g, ' ');
        };

        const surveyDeptNorm = normalize(currentSurvey.department);
        const studentDeptNorm = normalize(currentUser_Survey.department);

        // Check if departments match using flexible matching
        let isMatch = false;

        // Direct normalized match
        if (surveyDeptNorm === studentDeptNorm) {
            isMatch = true;
        } else {
            // Flexible matching - remove ALL special chars and spaces
            const clean1 = studentDeptNorm.replace(/[^a-z0-9]/g, '');
            const clean2 = surveyDeptNorm.replace(/[^a-z0-9]/g, '');

            if (clean1 === clean2) {
                isMatch = true;
            }
        }

        if (!isMatch) {
            alert('This survey is not available for your department');
            window.location.href = 'student-dashboard.html';
            return;
        }
    }

    // Check if already submitted (await the async function)
    const hasSubmitted = await Storage.hasSubmittedFeedback(currentUser_Survey.id, surveyId);
    if (hasSubmitted) {
        alert('You have already submitted feedback for this survey');
        window.location.href = 'student-dashboard.html';
        return;
    }

    // Initialize ratings objects
    currentSurvey.questions.forEach(q => {
        ratings[q.id] = {};
    });

    // Auto-populate student info from login details
    await autoPopulateStudentInfo();

    showStep(1);
}

async function autoPopulateStudentInfo() {
    // Get current logged-in student's data
    if (currentUser_Survey) {
        // Set roll number only (auto-filled, readonly)
        if (currentUser_Survey.rollNumber) {
            document.getElementById('rollNo').value = currentUser_Survey.rollNumber;
        }

        // Year and Class must be selected by student
        // Don't auto-populate these fields

        console.log('✅ Student roll number auto-populated:', {
            rollNumber: currentUser_Survey.rollNumber
        });
    }

    // Load departments from storage
    await loadDepartmentsForClass();
}

async function loadDepartmentsForClass() {
    const classSelect = document.getElementById('classSelect');

    try {
        // Get all departments from storage
        const departments = await Storage.getDepartments();

        if (!departments || departments.length === 0) {
            console.warn('⚠️ No departments found in storage');
            classSelect.innerHTML = '<option value="">-- No departments available --</option>';
            return;
        }

        // Clear existing options except the first one
        classSelect.innerHTML = '<option value="">-- Select Class --</option>';

        // Add departments from storage
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.name;
            option.textContent = dept.name;
            classSelect.appendChild(option);
        });

        console.log(`✅ Loaded ${departments.length} departments from storage`);
    } catch (error) {
        console.error('❌ Error loading departments:', error);
        classSelect.innerHTML = '<option value="">-- Error loading departments --</option>';
    }
}

function showStep(stepNumber) {
    document.getElementById('step1').classList.toggle('hidden', stepNumber !== 1);
    document.getElementById('step2').classList.toggle('hidden', stepNumber !== 2);
    document.getElementById('step3').classList.toggle('hidden', stepNumber !== 3);
}

// ===== STEP 1: Student Information =====
async function validateStudentInfo() {
    const rollNo = document.getElementById('rollNo').value.trim();
    const year = document.getElementById('yearSelect').value;
    const classSelect = document.getElementById('classSelect').value;
    const errorContainer = document.getElementById('step1Errors');
    const errors = [];

    // Clear previous errors
    errorContainer.innerHTML = '';
    errorContainer.classList.remove('show');
    document.getElementById('rollNo').classList.remove('error');
    document.getElementById('yearSelect').classList.remove('error');
    document.getElementById('classSelect').classList.remove('error');

    // Validation checks
    if (!rollNo) {
        errors.push('Roll number is missing. Please ensure you are logged in with valid credentials.');
        document.getElementById('rollNo').classList.add('error');
    }

    if (!classSelect) {
        errors.push('Please select your class/department');
        document.getElementById('classSelect').classList.add('error');
    }

    // Show errors if any
    if (errors.length > 0) {
        let errorHTML = '<h4>⚠️ Please fix the following errors:</h4><ul>';
        errors.forEach(error => {
            errorHTML += `<li>${error}</li>`;
        });
        errorHTML += '</ul>';
        errorContainer.innerHTML = errorHTML;
        errorContainer.classList.add('show');
        return;
    }

    // Store student info
    window.studentInfo = {
        rollNo: rollNo,
        year: year ? parseInt(year) : null,
        class: classSelect,
        classSection: rollNo.charAt(1) // Get second digit as class section
    };

    // Load teachers for selected class
    await loadTeachersForClass();
    showStep(2);
}

async function loadTeachersForClass() {
    const classSelect = document.getElementById('classSelect').value;
    const teacherList = document.getElementById('teacherList');
    teacherList.innerHTML = '';

    if (!classSelect) return;

    // Get faculties from storage (dynamically) instead of survey snapshot
    // This ensures newly added faculty appear in the survey
    let availableTeachers = [];

    try {
        const departments = await Storage.getDepartments();
        if (departments && departments.length > 0) {
            // Find the department matching the selected class
            const selectedDept = departments.find(dept => dept.name === classSelect);
            if (selectedDept && selectedDept.faculties) {
                availableTeachers = selectedDept.faculties;
            }
        }
    } catch (error) {
        console.error('Error loading teachers from storage:', error);
        // Fallback to survey faculties if storage fails
        availableTeachers = currentSurvey.faculties || [];
    }

    if (availableTeachers.length === 0) {
        teacherList.innerHTML = '<p style="color: #999; padding: 20px; text-align: center; background: #f9f9f9; border-radius: 8px; border: 2px dashed #e0e0e0;">⚠️ No teachers available for ' + classSelect + ' department</p>';
        return;
    }

    // Display all available teachers
    availableTeachers.forEach(teacher => {
        const checkboxDiv = document.createElement('label');
        checkboxDiv.className = 'teacher-checkbox';
        checkboxDiv.innerHTML = `
            <input type="checkbox" value="${teacher.id}" data-name="${teacher.name}" data-subject="${teacher.subject || ''}" onchange="updateTeacherCounter()">
            <div class="teacher-info">
                <div class="teacher-name">${teacher.name}</div>
                <div class="teacher-subject">${teacher.subject || 'Faculty'}</div>
            </div>
        `;
        teacherList.appendChild(checkboxDiv);
    });

    // Reset counter and select all button
    updateTeacherCounter();
    console.log(`✅ Loaded ${availableTeachers.length} teachers for ${classSelect} department`);
}

function validateTeacherSelection() {
    const checkboxes = document.querySelectorAll('#teacherList input[type="checkbox"]:checked');
    const errorContainer = document.getElementById('step2Errors');
    const errors = [];

    // Clear previous errors
    errorContainer.innerHTML = '';
    errorContainer.classList.remove('show');

    // Validation checks
    if (checkboxes.length === 0) {
        errors.push('Please select at least one teacher to provide feedback');
    }

    // Show errors if any
    if (errors.length > 0) {
        let errorHTML = '<h4>⚠️ Please fix the following errors:</h4><ul>';
        errors.forEach(error => {
            errorHTML += `<li>${error}</li>`;
        });
        errorHTML += '</ul>';
        errorContainer.innerHTML = errorHTML;
        errorContainer.classList.add('show');
        return;
    }

    // Store selected teachers
    selectedTeachers = Array.from(checkboxes).map(checkbox => ({
        id: checkbox.value,
        name: checkbox.getAttribute('data-name'),
        subject: checkbox.getAttribute('data-subject')
    }));

    // Initialize ratings for selected teachers
    Object.keys(ratings).forEach(qId => {
        selectedTeachers.forEach(teacher => {
            ratings[qId][teacher.id] = 0;
        });
    });

    // Move to questions
    currentQuestionIndex = 0;
    showStep(3);
    displayProgressContainer();
    loadQuestion();
}

function displayProgressContainer() {
    document.getElementById('progressContainer').style.display = 'block';
    document.getElementById('totalQuestionNum').textContent = currentSurvey.questions.length;
}

function toggleSelectAllTeachers() {
    const checkboxes = document.querySelectorAll('#teacherList input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
    });

    updateTeacherCounter();
}

function updateTeacherCounter() {
    const checkboxes = document.querySelectorAll('#teacherList input[type="checkbox"]');
    const totalTeachers = checkboxes.length;
    const checkedTeachers = document.querySelectorAll('#teacherList input[type="checkbox"]:checked').length;

    // Update counter
    const counter = document.getElementById('teacherCounter');
    if (counter) {
        if (checkedTeachers === 0) {
            counter.textContent = '0 selected';
        } else if (checkedTeachers === totalTeachers) {
            counter.textContent = `All ${totalTeachers} selected`;
        } else {
            counter.textContent = `${checkedTeachers} of ${totalTeachers} selected`;
        }
    }

    // Update select all button text
    const selectAllText = document.getElementById('selectAllText');
    if (selectAllText) {
        if (checkedTeachers === totalTeachers && totalTeachers > 0) {
            selectAllText.textContent = '☐ Deselect All';
        } else {
            selectAllText.textContent = '☑️ Select All';
        }
    }
}

// ===== STEP 3: Questions with Star Ratings =====
function loadQuestion() {
    const question = currentSurvey.questions[currentQuestionIndex];

    document.getElementById('questionNumber').textContent = `Question ${currentQuestionIndex + 1}`;
    document.getElementById('questionText').textContent = question.text;
    document.getElementById('currentQuestionNum').textContent = currentQuestionIndex + 1;
    document.getElementById('progressInfo').textContent = `${currentQuestionIndex + 1} of ${currentSurvey.questions.length} questions`;

    // Update progress bar
    const progress = ((currentQuestionIndex + 1) / currentSurvey.questions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    // Load teacher ratings for this question
    loadTeacherRatings(question);

    // Update navigation buttons
    updateQuestionNavigation();
}

function loadTeacherRatings(question) {
    const container = document.getElementById('teacherRatingsContainer');
    container.innerHTML = '';

    selectedTeachers.forEach(teacher => {
        const ratingDiv = document.createElement('div');
        ratingDiv.className = 'teacher-rating-item';

        const currentRating = ratings[question.id][teacher.id] || 0;

        ratingDiv.innerHTML = `
            <div class="teacher-rating-name">${teacher.name}</div>
            <div class="number-rating" id="numbers-${teacher.id}">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => `
                    <button type="button" class="rating-number ${currentRating === num ? 'active' : ''}" 
                            onclick="setRating('${question.id}', '${teacher.id}', ${num})">${num}</button>
                `).join('')}
            </div>
            <div class="rating-display">
                ${currentRating > 0 ? `Rating: ${currentRating}/10` : 'Not rated'}
            </div>
        `;

        container.appendChild(ratingDiv);
    });
}


function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

function nextQuestion() {
    // Validate current question - check if all teachers have ratings
    const question = currentSurvey.questions[currentQuestionIndex];
    const allRated = selectedTeachers.every(teacher => ratings[question.id][teacher.id] > 0);

    if (!allRated) {
        const unratedTeachers = selectedTeachers
            .filter(teacher => ratings[question.id][teacher.id] === 0)
            .map(t => t.name)
            .join(', ');

        alert(`⚠️ Please rate all teachers before proceeding.\n\nUnrated: ${unratedTeachers}`);
        return;
    }

    if (currentQuestionIndex < currentSurvey.questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    }
}

function updateQuestionNavigation() {
    const prevBtn = document.getElementById('prevQuestionBtn');
    const nextBtn = document.getElementById('nextQuestionBtn');
    const submitBtn = document.getElementById('submitBtn');

    prevBtn.style.display = currentQuestionIndex > 0 ? 'block' : 'none';

    if (currentQuestionIndex === currentSurvey.questions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';

        // Check if all questions are rated
        updateSubmitButtonState();
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

function updateSubmitButtonState() {
    const submitBtn = document.getElementById('submitBtn');

    // Check if all questions are rated for all teachers
    let allQuestionsRated = true;
    for (let i = 0; i < currentSurvey.questions.length; i++) {
        const q = currentSurvey.questions[i];
        const qRated = selectedTeachers.every(teacher => ratings[q.id] && ratings[q.id][teacher.id] > 0);
        if (!qRated) {
            allQuestionsRated = false;
            break;
        }
    }

    if (allQuestionsRated) {
        submitBtn.classList.remove('btn-disabled');
        submitBtn.classList.add('btn-success');
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    } else {
        submitBtn.classList.add('btn-disabled');
        submitBtn.classList.remove('btn-success');
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
    }
}

// Update submit button state whenever a rating is set
function setRating(questionId, teacherId, rating) {
    ratings[questionId][teacherId] = rating;

    // Update number display
    const numbersContainer = document.getElementById(`numbers-${teacherId}`);
    const numbers = numbersContainer.querySelectorAll('.rating-number');
    numbers.forEach((btn, index) => {
        if (index + 1 === rating) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update the rating display
    const parent = numbersContainer.parentElement;
    const ratingDisplay = parent.querySelector('.rating-display');
    if (ratingDisplay) {
        ratingDisplay.textContent = `Rating: ${rating}/10`;
    }

    // Update submit button state if on last question
    if (currentQuestionIndex === currentSurvey.questions.length - 1) {
        updateSubmitButtonState();
    }
}

async function submitSurvey() {
    const submitBtn = document.getElementById('submitBtn');

    // Prevent double submission
    if (submitBtn.disabled) {
        return;
    }

    // Validate last question
    const lastQuestion = currentSurvey.questions[currentQuestionIndex];
    const allRated = selectedTeachers.every(teacher => ratings[lastQuestion.id][teacher.id] > 0);

    if (!allRated) {
        const unratedTeachers = selectedTeachers
            .filter(teacher => ratings[lastQuestion.id][teacher.id] === 0)
            .map(t => t.name)
            .join(', ');

        showCustomAlert(`⚠️ Please rate all teachers for this question before submitting.\n\nUnrated: ${unratedTeachers}`, 'warning');
        return;
    }

    // Validate all questions are rated
    let allQuestionsRated = true;
    for (let i = 0; i < currentSurvey.questions.length; i++) {
        const q = currentSurvey.questions[i];
        const qRated = selectedTeachers.every(teacher => ratings[q.id][teacher.id] > 0);
        if (!qRated) {
            allQuestionsRated = false;
            break;
        }
    }

    if (!allQuestionsRated) {
        showCustomAlert('⚠️ All questions must be rated before submission. Please go back and complete all ratings.', 'warning');
        return;
    }

    // Show confirmation dialog
    const confirmed = await showCustomConfirm('Are you sure you want to submit your feedback? You cannot edit it later.');
    if (!confirmed) {
        return;
    }

    // Disable button and show loading animation
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
    submitBtn.style.opacity = '0.7';
    submitBtn.style.cursor = 'not-allowed';

    // CHECK FOR DUPLICATE SUBMISSION FIRST
    const alreadySubmitted = await Storage.hasSubmittedFeedback(currentUser_Survey.id, currentSurvey.id);
    if (alreadySubmitted) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Survey ✓';
        submitBtn.style.opacity = '1';
        showCustomAlert('⚠️ You have already submitted feedback for this survey. Duplicate submissions are not allowed.', 'warning');
        setTimeout(() => {
            window.location.href = 'student-dashboard.html';
        }, 2000);
        return;
    }

    // VALIDATION: Verify survey still exists
    const surveyExists = await Storage.getSurveyById(currentSurvey.id);
    if (!surveyExists) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Survey ✓';
        showCustomAlert('❌ Error: Survey no longer exists. Please contact administrator.', 'error');
        setTimeout(() => {
            window.location.href = 'student-dashboard.html';
        }, 2000);
        return;
    }

    // VALIDATION: Verify all selected teachers still exist in department
    const department = await Storage.getDepartmentByName(currentUser_Survey.department);
    if (!department) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Survey ✓';
        showCustomAlert('❌ Error: Your department no longer exists. Please contact administrator.', 'error');
        setTimeout(() => {
            window.location.href = 'student-dashboard.html';
        }, 2000);
        return;
    }

    const departmentFacultyIds = (department.faculties || []).map(f => f.id);
    const invalidTeachers = selectedTeachers.filter(t => !departmentFacultyIds.includes(t.id));
    if (invalidTeachers.length > 0) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Survey ✓';
        showCustomAlert(`❌ Error: Some selected faculty members no longer exist in your department: ${invalidTeachers.map(t => t.name).join(', ')}`, 'error');
        setTimeout(() => {
            window.location.href = 'student-dashboard.html';
        }, 2000);
        return;
    }

    // VALIDATION: Verify all questions still exist
    const questionIds = currentSurvey.questions.map(q => q.id);
    const invalidQuestions = Object.keys(ratings).filter(qId => !questionIds.includes(qId));
    if (invalidQuestions.length > 0) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Survey ✓';
        showCustomAlert('❌ Error: Survey questions have been modified. Please retake the survey.', 'error');
        setTimeout(() => {
            window.location.href = 'student-dashboard.html';
        }, 2000);
        return;
    }

    // Create feedback responses - organized by teacher for easy querying
    const responses = [];
    const teacherRatings = {}; // Aggregate ratings per teacher

    currentSurvey.questions.forEach(question => {
        selectedTeachers.forEach(teacher => {
            const rating = ratings[question.id][teacher.id];

            responses.push({
                questionId: question.id,
                questionText: question.text,
                teacherId: teacher.id,
                teacherName: teacher.name,
                rating: rating
            });

            // Aggregate ratings per teacher
            if (!teacherRatings[teacher.id]) {
                teacherRatings[teacher.id] = {
                    teacherId: teacher.id,
                    teacherName: teacher.name,
                    teacherSubject: teacher.subject || 'Faculty',
                    ratings: [],
                    totalRating: 0,
                    averageRating: 0
                };
            }
            teacherRatings[teacher.id].ratings.push({
                questionId: question.id,
                questionText: question.text,
                rating: rating
            });
            teacherRatings[teacher.id].totalRating += rating;
        });
    });

    // Calculate average ratings per teacher
    Object.values(teacherRatings).forEach(teacher => {
        teacher.averageRating = parseFloat((teacher.totalRating / teacher.ratings.length).toFixed(2));
    });

    // Get year from studentInfo (filled in Step 1)
    const studentYear = (window.studentInfo && window.studentInfo.year) || currentUser_Survey.year || null;

    console.log('📊 Student Info:', {
        fromForm: window.studentInfo,
        fromUser: currentUser_Survey,
        finalYear: studentYear
    });

    // Create feedback object with proper structure for querying
    const feedback = {
        // Primary identifiers
        id: Storage.generateId(),
        surveyId: currentSurvey.id,
        studentId: currentUser_Survey.id,

        // Survey information
        surveyTitle: 'Faculty Feedback Survey',
        surveyDepartment: currentSurvey.department,
        surveyCreatedAt: currentSurvey.createdAt,

        // Student information
        studentName: currentUser_Survey.name,
        studentYear: studentYear,
        studentDepartment: currentUser_Survey.department,
        studentClass: (window.studentInfo && window.studentInfo.class) || currentUser_Survey.department,
        studentEmail: currentUser_Survey.email || '',

        // Teachers evaluated
        selectedTeachers: selectedTeachers.map(t => ({
            id: t.id,
            name: t.name,
            subject: t.subject || 'Faculty'
        })),

        // Detailed responses (for admin analysis)
        responses: responses,

        // Aggregated teacher ratings (for quick access)
        teacherRatings: Object.values(teacherRatings),

        // Statistics
        totalQuestions: currentSurvey.questions.length,
        totalTeachersEvaluated: selectedTeachers.length,
        totalResponses: responses.length,

        // Timestamps
        submittedAt: new Date().toISOString(),
        submittedDate: new Date().toLocaleDateString(),
        submittedTime: new Date().toLocaleTimeString(),

        // Status flags for easy querying
        isCompleted: true,
        isValidated: true,

        // Metadata for admin
        _metadata: {
            surveyExists: true,
            departmentExists: true,
            facultiesExist: true,
            version: '1.0'
        }
    };

    console.log('📝 Submitting feedback:', feedback);

    // Save feedback
    const savedFeedback = await Storage.saveFeedback(feedback);

    if (!savedFeedback) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Survey ✓';
        submitBtn.style.opacity = '1';
        showCustomAlert('❌ Error saving feedback. Please try again.', 'error');
        return;
    }

    console.log('✅ Feedback saved successfully:', savedFeedback);

    // Show success message with animation
    showCustomAlert('✅ Thank you! Your feedback has been submitted successfully.', 'success');

    // Redirect after 2 seconds
    setTimeout(() => {
        window.location.href = 'student-dashboard.html';
    }, 2000);
}

function goBackDashboard() {
    if (confirm('Are you sure you want to leave? Your progress will not be saved.')) {
        window.location.href = 'student-dashboard.html';
    }
}

function goBackStep(stepNumber) {
    showStep(stepNumber);
}

// Expose functions to global scope for onclick handlers
window.validateStudentInfo = validateStudentInfo;
window.validateTeacherSelection = validateTeacherSelection;
window.toggleSelectAllTeachers = toggleSelectAllTeachers;
window.updateTeacherCounter = updateTeacherCounter;
window.loadTeachersForClass = loadTeachersForClass;
window.previousQuestion = previousQuestion;
window.nextQuestion = nextQuestion;
window.submitSurvey = submitSurvey;
window.goBackDashboard = goBackDashboard;
window.goBackStep = goBackStep;
window.setRating = setRating;


// Custom Alert Functions
function showCustomAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert custom-alert-${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';

    alertDiv.innerHTML = `
        <div class="custom-alert-content">
            <span class="custom-alert-icon">${icon}</span>
            <span class="custom-alert-message">${message}</span>
        </div>
    `;

    document.body.appendChild(alertDiv);

    // Trigger animation
    setTimeout(() => alertDiv.classList.add('show'), 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

function showCustomConfirm(message) {
    return new Promise((resolve) => {
        const confirmDiv = document.createElement('div');
        confirmDiv.className = 'custom-confirm-overlay';

        confirmDiv.innerHTML = `
            <div class="custom-confirm-box">
                <div class="custom-confirm-icon">❓</div>
                <div class="custom-confirm-message">${message}</div>
                <div class="custom-confirm-buttons">
                    <button class="custom-confirm-btn custom-confirm-cancel">Cancel</button>
                    <button class="custom-confirm-btn custom-confirm-ok">Confirm</button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmDiv);

        // Trigger animation
        setTimeout(() => confirmDiv.classList.add('show'), 10);

        // Handle button clicks
        confirmDiv.querySelector('.custom-confirm-ok').onclick = () => {
            confirmDiv.classList.remove('show');
            setTimeout(() => {
                confirmDiv.remove();
                resolve(true);
            }, 300);
        };

        confirmDiv.querySelector('.custom-confirm-cancel').onclick = () => {
            confirmDiv.classList.remove('show');
            setTimeout(() => {
                confirmDiv.remove();
                resolve(false);
            }, 300);
        };
    });
}

// Add CSS for custom alerts and spinner
const style = document.createElement('style');
style.textContent = `
    .custom-alert {
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 300px;
        max-width: 500px;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .custom-alert.show {
        transform: translateX(0);
    }
    
    .custom-alert-success {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: white;
    }
    
    .custom-alert-error {
        background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
        color: white;
    }
    
    .custom-alert-warning {
        background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
        color: white;
    }
    
    .custom-alert-info {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    .custom-alert-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .custom-alert-icon {
        font-size: 24px;
    }
    
    .custom-alert-message {
        flex: 1;
        font-size: 15px;
        line-height: 1.5;
        white-space: pre-line;
    }
    
    .custom-confirm-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .custom-confirm-overlay.show {
        opacity: 1;
    }
    
    .custom-confirm-box {
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        transform: scale(0.9);
        transition: transform 0.3s ease;
    }
    
    .custom-confirm-overlay.show .custom-confirm-box {
        transform: scale(1);
    }
    
    .custom-confirm-icon {
        font-size: 48px;
        text-align: center;
        margin-bottom: 20px;
    }
    
    .custom-confirm-message {
        text-align: center;
        font-size: 16px;
        color: #333;
        margin-bottom: 25px;
        line-height: 1.5;
    }
    
    .custom-confirm-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
    }
    
    .custom-confirm-btn {
        padding: 10px 24px;
        border: none;
        border-radius: 6px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .custom-confirm-cancel {
        background: #e0e0e0;
        color: #333;
    }
    
    .custom-confirm-cancel:hover {
        background: #d0d0d0;
    }
    
    .custom-confirm-ok {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        color: white;
    }
    
    .custom-confirm-ok:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
    }
    
    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .btn-disabled {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
        pointer-events: none;
    }
`;
document.head.appendChild(style);