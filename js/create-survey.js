// Create Survey Functionality - Firebase Version

let selectedQuestionIds = [];
let allAvailableQuestionIds = [];
let currentUser = null;

(async function() {
    currentUser = await checkAuth('admin');
    if (!currentUser) {
        // User will be redirected
    } else {
        // Defer initialization until DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => initializeCreateSurvey());
        } else {
            await initializeCreateSurvey();
        }
    }
})();

async function initializeCreateSurvey() {
    // Load departments into dropdown
    await loadDepartments();

    // Load questions
    await loadAvailableQuestions();

    // Form submission
    document.getElementById('createSurveyForm').addEventListener('submit', handleSurveySubmit);

    // Setup progress bar tracking
    setupProgressBar();

    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            await loadDepartments();
            await loadAvailableQuestions();
        }
    });
}

function setupProgressBar() {
    // Track department selection
    const departmentSelect = document.getElementById('department');
    if (departmentSelect) {
        departmentSelect.addEventListener('change', updateProgressBar);
    }

    // Track faculty selection
    const facultyContainer = document.getElementById('facultyCheckboxContainer');
    if (facultyContainer) {
        const observer = new MutationObserver(() => {
            updateProgressBar();
        });
        observer.observe(facultyContainer, {
            childList: true,
            subtree: true
        });
    }

    // Track question selection
    const questionsContainer = document.getElementById('questionsContainer');
    if (questionsContainer) {
        const observer = new MutationObserver(() => {
            updateProgressBar();
        });
        observer.observe(questionsContainer, {
            childList: true,
            subtree: true
        });
    }
}

async function loadDepartments() {
    const departments = await Storage.getDepartments();
    const departmentSelect = document.getElementById('department');

    departmentSelect.innerHTML = '<option value="">Select Department</option><option value="ALL">ALL Departments</option>';

    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        departmentSelect.appendChild(option);
    });
}

async function loadFaculties() {
    const departmentId = document.getElementById('department').value;
    const container = document.getElementById('facultyCheckboxContainer');

    if (!departmentId) {
        container.innerHTML = '<div class="faculty-list-item empty-state"><p>📭 Please select a department first</p></div>';
        updateFacultiesCounter(0);
        return;
    }

    if (departmentId === 'ALL') {
        const allDepartments = await Storage.getDepartments();
        let totalFaculties = 0;
        let deptList = [];

        allDepartments.forEach(dept => {
            const facultyCount = (dept.faculties || []).length;
            totalFaculties += facultyCount;
            deptList.push(`${dept.name} (${facultyCount})`);
        });

        container.innerHTML = `
            <div class="all-departments-card" style="background: linear-gradient(135deg, rgba(17, 153, 142, 0.08) 0%, rgba(56, 239, 125, 0.05) 100%); border: 2px solid rgba(17, 153, 142, 0.2); border-radius: 12px; padding: 24px; width: 100%;">
                <div style="display: flex; align-items: flex-start; gap: 24px; margin-bottom: 24px;">
                    <div style="font-size: 3.5rem; flex-shrink: 0; line-height: 1;">🌍</div>
                    <div style="flex: 1;">
                        <h3 style="color: #1a202c; margin: 0 0 8px 0; font-size: 1.4rem; font-weight: 700; line-height: 1.3;">All Departments Selected</h3>
                        <p style="color: #4a5568; margin: 0; font-size: 0.95rem; line-height: 1.5;">Survey will be created for all departments</p>
                    </div>
                </div>

                <div style="background: white; padding: 24px; border-radius: 10px; margin-bottom: 16px; text-align: center; border: 1px solid rgba(17, 153, 142, 0.2); box-shadow: 0 2px 8px rgba(17, 153, 142, 0.1);">
                    <div style="font-size: 3rem; font-weight: 700; color: #11998e; margin-bottom: 8px;">${totalFaculties}</div>
                    <div style="color: #4a5568; font-size: 0.95rem; font-weight: 600;">Total Faculty Members</div>
                </div>

                <div style="background: white; padding: 18px; border-radius: 10px; border-left: 5px solid #11998e; box-shadow: 0 2px 8px rgba(17, 153, 142, 0.1);">
                    <p style="color: #1a202c; margin: 0; font-size: 0.95rem; line-height: 1.6; font-weight: 600;">
                        <strong style="color: #1a202c;">Departments:</strong> <span style="color: #4a5568;">${deptList.join(' • ')}</span>
                    </p>
                </div>
            </div>
        `;
        updateFacultiesCounter(totalFaculties);
        return;
    }

    const faculties = await Storage.getFacultiesByDepartment(departmentId);

    if (faculties.length === 0) {
        container.innerHTML = '<div class="faculty-list-item empty-state"><p>📭 No faculties added for this department</p><p>Go to <a href="manage-faculties.html">Manage Faculties</a> to add faculty members first.</p></div>';
        updateFacultiesCounter(0);
        return;
    }

    container.innerHTML = '';
    updateFacultiesCounter(faculties.length);

    faculties.forEach(faculty => {
        const facultyItem = document.createElement('div');
        facultyItem.className = 'faculty-list-item';
        facultyItem.id = `faculty-item-${faculty.id}`;

        facultyItem.innerHTML = `
            <div class="faculty-item-content">
                <p class="faculty-item-name">
                    <span class="faculty-item-icon">👨‍🏫</span>
                    ${faculty.name}
                </p>
            </div>
        `;

        facultyItem.addEventListener('click', function() {
            this.classList.toggle('selected');
            updateProgressBar();
        });

        container.appendChild(facultyItem);
    });
}

function updateFacultiesCounter(count) {
    const counter = document.getElementById('selectedFacultiesCount');
    if (counter) {
        counter.textContent = count;
    }
}

function updateProgressBar() {
    const progressBarFill = document.getElementById('progressBarFill');
    if (!progressBarFill) return;

    const departmentId = document.getElementById('department').value;
    const selectedFaculties = document.querySelectorAll('.faculty-list-item.selected').length;
    const selectedQuestions = selectedQuestionIds.length;

    let progress = 0;

    if (departmentId) {
        progress = 25;
    }

    if (departmentId === 'ALL' || selectedFaculties > 0) {
        progress = 50;
    }

    if (selectedQuestions > 0) {
        progress = 75;
    }

    if (departmentId && (departmentId === 'ALL' || selectedFaculties > 0) && selectedQuestions > 0) {
        progress = 100;
    }

    progressBarFill.style.width = progress + '%';
}

async function loadAvailableQuestions() {
    const questions = await Storage.getQuestions();
    const container = document.getElementById('questionsContainer');

    if (questions.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; padding: 40px 20px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.02) 100%); border-radius: 8px; text-align: center; border: 2px dashed var(--border-color);">
                <p style="color: var(--text-muted); margin: 0 0 10px 0; font-size: 1rem;">📭 No questions available yet.</p>
                <p style="color: var(--text-muted); margin: 0; font-size: 0.9rem;">Go to <a href="manage-questions.html" style="color: var(--primary-color); font-weight: 600;">Manage Questions</a> to create questions first.</p>
            </div>
        `;
        allAvailableQuestionIds = [];
        updateQuestionCounter();
        return;
    }

    container.innerHTML = '';
    allAvailableQuestionIds = questions.map(q => q.id);

    questions.forEach((question, index) => {
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        questionItem.id = `question-item-${question.id}`;
        questionItem.style.cursor = 'pointer';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = question.id;
        checkbox.id = `question-checkbox-${question.id}`;
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                if (!selectedQuestionIds.includes(question.id)) {
                    selectedQuestionIds.push(question.id);
                }
                questionItem.classList.add('selected');
            } else {
                selectedQuestionIds = selectedQuestionIds.filter(id => id !== question.id);
                questionItem.classList.remove('selected');
            }
            updateQuestionCounter();
            updateProgressBar();
        });

        const content = document.createElement('div');
        content.className = 'question-content';

        const text = document.createElement('p');
        text.className = 'question-text';
        text.textContent = question.text;

        const meta = document.createElement('p');
        meta.className = 'question-meta';
        meta.textContent = `Added on ${new Date(question.createdAt).toLocaleDateString()}`;

        content.appendChild(text);
        content.appendChild(meta);

        questionItem.appendChild(checkbox);
        questionItem.appendChild(content);

        // Add click handler to the entire question item
        questionItem.addEventListener('click', (e) => {
            // Don't trigger if clicking directly on checkbox (to avoid double toggle)
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                // Trigger the change event
                checkbox.dispatchEvent(new Event('change'));
            }
        });

        container.appendChild(questionItem);
    });

    const searchInput = document.getElementById('questionSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterQuestions);
    }

    updateQuestionCounter();
    updateProgressBar();
}

function filterQuestions() {
    const searchTerm = document.getElementById('questionSearch').value.toLowerCase();
    const questionItems = document.querySelectorAll('.question-item');

    questionItems.forEach(item => {
        const questionText = item.querySelector('.question-text').textContent.toLowerCase();
        if (questionText.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function updateQuestionCounter() {
    const selectedCount = document.getElementById('selectedCount');
    const totalCount = document.getElementById('totalCount');

    if (selectedCount && totalCount) {
        selectedCount.textContent = selectedQuestionIds.length;
        totalCount.textContent = allAvailableQuestionIds.length;
    }
}

function toggleSelectAllQuestions() {
    const allSelected = selectedQuestionIds.length === allAvailableQuestionIds.length;

    if (allSelected) {
        selectedQuestionIds = [];
        allAvailableQuestionIds.forEach(qId => {
            const checkbox = document.getElementById(`question-checkbox-${qId}`);
            const item = document.getElementById(`question-item-${qId}`);
            if (checkbox) {
                checkbox.checked = false;
            }
            if (item) {
                item.classList.remove('selected');
            }
        });
    } else {
        selectedQuestionIds = [...allAvailableQuestionIds];
        allAvailableQuestionIds.forEach(qId => {
            const checkbox = document.getElementById(`question-checkbox-${qId}`);
            const item = document.getElementById(`question-item-${qId}`);
            if (checkbox) {
                checkbox.checked = true;
            }
            if (item) {
                item.classList.add('selected');
            }
        });
    }

    updateQuestionCounter();
    updateProgressBar();
}

async function handleSurveySubmit(e) {
    e.preventDefault();

    // Get button elements
    const submitBtn = document.getElementById('createSurveyBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');

    // Prevent multiple submissions - disable button IMMEDIATELY
    if (submitBtn.disabled) {
        return;
    }

    // Disable button and show loading state IMMEDIATELY
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
    submitBtn.style.cursor = 'not-allowed';
    btnText.style.display = 'none';
    btnLoader.classList.add('show');

    const departmentId = document.getElementById('department').value;

    if (!departmentId) {
        // Reset button state for validation errors
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        btnText.style.display = 'inline-block';
        btnLoader.classList.remove('show');

        showAlert('❌ Please select a department', 'danger');
        document.getElementById('department').style.borderColor = '#dc3545';
        return;
    }

    document.getElementById('department').style.borderColor = '';

    const questions = [];

    if (selectedQuestionIds.length === 0) {
        // Reset button state for validation errors
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        btnText.style.display = 'inline-block';
        btnLoader.classList.remove('show');

        showAlert('❌ Please select at least one question', 'danger');
        return;
    }

    if (selectedQuestionIds.length > 50) {
        // Reset button state for validation errors
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        btnText.style.display = 'inline-block';
        btnLoader.classList.remove('show');

        showAlert('❌ Maximum 50 questions allowed per survey', 'danger');
        return;
    }

    for (const qId of selectedQuestionIds) {
        const question = await Storage.getQuestionById(qId);
        if (question) {
            questions.push({
                id: question.id,
                text: question.text,
                allowComments: true
            });
        }
    }

    let departmentsToCreateFor = [];

    if (departmentId === 'ALL') {
        departmentsToCreateFor = await Storage.getDepartments();
    } else {
        const department = await Storage.getDepartmentById(departmentId);
        if (!department) {
            // Reset button state for validation errors
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            btnText.style.display = 'inline-block';
            btnLoader.classList.remove('show');

            showAlert('❌ Department not found', 'danger');
            return;
        }
        departmentsToCreateFor = [department];
    }

    if (departmentsToCreateFor.length === 0) {
        // Reset button state for validation errors
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        btnText.style.display = 'inline-block';
        btnLoader.classList.remove('show');

        showAlert('❌ No departments found', 'danger');
        return;
    }

    let allValid = true;
    departmentsToCreateFor.forEach(department => {
        const faculties = (department.faculties || []).map(faculty => ({
            id: faculty.id,
            name: faculty.name
        }));

        if (faculties.length === 0) {
            showAlert(`❌ No faculties available for ${department.name} department. Please add faculties first.`, 'danger');
            allValid = false;
        }
    });

    if (!allValid) {
        // Reset button state for validation errors
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        btnText.style.display = 'inline-block';
        btnLoader.classList.remove('show');
        return;
    }

    try {
        let surveysCreated = 0;
        for (const department of departmentsToCreateFor) {
            const faculties = (department.faculties || []).map(faculty => ({
                id: faculty.id,
                name: faculty.name
            }));

            const survey = {
                id: Storage.generateId(),
                department: department.name,
                faculties: faculties,
                questions: questions,
                createdBy: currentUser.id,
                createdAt: new Date().toISOString(),
                isActive: true
            };

            await Storage.saveSurvey(survey);
            surveysCreated++;
        }

        showAlert(`✅ Survey created successfully for ${surveysCreated} department(s)! Redirecting...`, 'success');

        // Keep button disabled during redirect
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 2000);
    } catch (error) {
        // Reset button state ONLY on error
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        btnText.style.display = 'inline-block';
        btnLoader.classList.remove('show');
        showAlert('❌ Error creating survey. Please try again.', 'danger');
        console.error('Survey creation error:', error);
    }
}

function showAlert(message, type = 'danger') {
    const alertDiv = document.getElementById('alertMessage');
    if (alertDiv) {
        alertDiv.textContent = message;
        alertDiv.className = `alert alert-${type} show`;

        setTimeout(() => {
            alertDiv.className = 'alert';
        }, 5000);
    }
}

// Make functions globally available
window.loadFaculties = loadFaculties;
window.toggleSelectAllQuestions = toggleSelectAllQuestions;