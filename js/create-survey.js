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
    console.log('🚀 Initializing Create Survey page...');

    // Verify Storage is available
    if (typeof Storage === 'undefined' || !Storage.getClasses) {
        console.error('❌ Storage module not loaded properly');
        showAlert('❌ System error: Storage module not available. Please refresh the page.', 'danger');
        return;
    }

    // Load classes for survey (from Firebase with localStorage caching)
    await loadClassesForSurvey();

    // Load questions
    await loadAvailableQuestions();

    // Form submission
    const form = document.getElementById('createSurveyForm');
    if (form) {
        form.addEventListener('submit', handleSurveySubmit);
    } else {
        console.error('❌ createSurveyForm not found');
    }

    // Setup progress bar tracking
    setupProgressBar();

    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            console.log('🔄 Page visible again, refreshing data...');
            await loadClassesForSurvey();
            await loadAvailableQuestions();
        }
    });

    console.log('✅ Create Survey page initialized');
}

// Load classes created via Class Survey (from Firebase with localStorage caching)
async function loadClassesForSurvey() {
    const select = document.getElementById('classForSurvey');
    if (!select) {
        console.error('❌ classForSurvey select element not found');
        return;
    }
    try {
        console.log('🔄 Loading classes from Firebase...');

        // Fetch from Firebase (with automatic caching)
        const classes = await Storage.getClasses();

        console.log(`✅ Loaded ${classes.length} classes from Firebase:`, classes);

        // Clear all options except the default ones
        select.innerHTML = '';

        // Add placeholder
        const placeholderOpt = document.createElement('option');
        placeholderOpt.value = '';
        placeholderOpt.textContent = 'Select Class';
        select.appendChild(placeholderOpt);

        // Check if classes array is valid
        if (!Array.isArray(classes) || classes.length === 0) {
            console.warn('⚠️ No classes found in Firebase');
            const noClassOpt = document.createElement('option');
            noClassOpt.value = '';
            noClassOpt.textContent = 'No classes available';
            noClassOpt.disabled = true;
            select.appendChild(noClassOpt);
            return;
        }

        // Add individual classes
        classes.forEach(c => {
            if (!c || !c.id || !c.name) {
                console.warn('⚠️ Invalid class object:', c);
                return;
            }
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });

        // Add ALL Classes option at the end
        const allOpt = document.createElement('option');
        allOpt.value = 'ALL';
        allOpt.textContent = 'ALL Classes';
        select.appendChild(allOpt);

        console.log(`✅ Successfully populated ${classes.length} classes in dropdown`);
    } catch (err) {
        console.error('❌ Error loading classes for survey:', err);
        showAlert('❌ Failed to load classes. Please refresh the page.', 'danger');

        // Add error option
        const errorOpt = document.createElement('option');
        errorOpt.value = '';
        errorOpt.textContent = 'Error loading classes';
        errorOpt.disabled = true;
        select.appendChild(errorOpt);
    }
}

function onClassSelectionChange() {
    // Class selection changed, load faculties and update progress bar
    loadFaculties();
    updateProgressBar();
}

function setupProgressBar() {
    // Track class selection
    const classSelect = document.getElementById('classForSurvey');
    if (classSelect) {
        classSelect.addEventListener('change', updateProgressBar);
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
    const classId = document.getElementById('classForSurvey').value;
    const container = document.getElementById('facultyCheckboxContainer');
    const subtitle = document.querySelector('.faculties-subtitle');

    if (!classId) {
        container.innerHTML = '<div class="faculty-list-item empty-state"><p>📭 Please select a class first</p></div>';
        updateFacultiesCounter(0);
        if (subtitle) subtitle.textContent = 'Choose faculty members for this survey';
        return;
    }

    if (classId === 'ALL') {
        const classes = await Storage.getClasses();
        let totalFaculties = 0;
        let classList = [];

        classes.forEach(cls => {
            const facultyCount = (cls.faculties || []).length;
            totalFaculties += facultyCount;
            classList.push(`${cls.name} (${facultyCount})`);
        });

        // Update subtitle with class list
        if (subtitle) {
            subtitle.textContent = `All classes: ${classList.join(' • ')}`;
        }

        container.innerHTML = `
            <div class="all-departments-card" style="background: linear-gradient(135deg, rgba(17, 153, 142, 0.08) 0%, rgba(56, 239, 125, 0.05) 100%); border: 2px solid rgba(17, 153, 142, 0.2); border-radius: 12px; padding: 24px; width: 100%;">
                <div style="display: flex; align-items: flex-start; gap: 24px; margin-bottom: 24px;">
                    <div style="font-size: 3.5rem; flex-shrink: 0; line-height: 1;">📚</div>
                    <div style="flex: 1;">
                        <h3 style="color: #1a202c; margin: 0 0 8px 0; font-size: 1.4rem; font-weight: 700; line-height: 1.3;">All Classes Selected</h3>
                        <p style="color: #4a5568; margin: 0; font-size: 0.95rem; line-height: 1.5;">Survey will be created for all classes</p>
                    </div>
                </div>

                <div style="background: white; padding: 24px; border-radius: 10px; margin-bottom: 16px; text-align: center; border: 1px solid rgba(17, 153, 142, 0.2); box-shadow: 0 2px 8px rgba(17, 153, 142, 0.1);">
                    <div style="font-size: 3rem; font-weight: 700; color: #11998e; margin-bottom: 8px;">${totalFaculties}</div>
                    <div style="color: #4a5568; font-size: 0.95rem; font-weight: 600;">Total Faculty Members</div>
                </div>

                <div style="background: white; padding: 18px; border-radius: 10px; border-left: 5px solid #11998e; box-shadow: 0 2px 8px rgba(17, 153, 142, 0.1);">
                    <p style="color: #1a202c; margin: 0; font-size: 0.95rem; line-height: 1.6; font-weight: 600;">
                        <strong style="color: #1a202c;">Classes:</strong> <span style="color: #4a5568;">${classList.join(' • ')}</span>
                    </p>
                </div>
            </div>
        `;
        updateFacultiesCounter(totalFaculties);
        return;
    }

    // Get individual class from Firebase
    const classes = await Storage.getClasses();
    const selectedClass = classes.find(c => c.id === classId);

    if (!selectedClass) {
        container.innerHTML = '<div class="faculty-list-item empty-state"><p>📭 Class not found</p></div>';
        updateFacultiesCounter(0);
        if (subtitle) subtitle.textContent = 'Choose faculty members for this survey';
        return;
    }

    const faculties = selectedClass.faculties || [];

    if (faculties.length === 0) {
        container.innerHTML = '<div class="faculty-list-item empty-state"><p>📭 No faculties assigned to this class</p><p>Go to <a href="select-faculties.html">Class Survey</a> to assign faculties to this class.</p></div>';
        updateFacultiesCounter(0);
        if (subtitle) subtitle.textContent = 'No faculties available for this class';
        return;
    }

    // Update subtitle with faculty names
    const facultyNames = faculties.map(f => f.name).join(', ');
    if (subtitle) {
        subtitle.textContent = `All lecturers: ${facultyNames}`;
    }

    container.innerHTML = '';
    updateFacultiesCounter(faculties.length);

    faculties.forEach(faculty => {
        const facultyItem = document.createElement('div');
        facultyItem.className = 'faculty-list-item selected';
        facultyItem.id = `faculty-item-${faculty.id}`;

        facultyItem.innerHTML = `
            <div class="faculty-item-content">
                <p class="faculty-item-name">
                    <span class="faculty-item-icon">👨‍🏫</span>
                    ${faculty.name}
                </p>
            </div>
        `;

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
    const progressStepsFill = document.getElementById('progressStepsFill');
    if (!progressStepsFill) {
        console.warn('Progress steps fill element not found');
        return;
    }

    const classId = document.getElementById('classForSurvey')?.value || '';
    const selectedQuestions = selectedQuestionIds.length;

    // Get step elements
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    // Verify all step elements exist
    if (!step1 || !step2 || !step3) {
        console.warn('One or more step elements not found');
        return;
    }

    // Calculate which step we're on
    let progress = 0;

    // Reset all steps first
    [step1, step2, step3].forEach(step => {
        step.classList.remove('active', 'completed');
    });

    // Step 1: Class selected
    if (classId) {
        progress = 33;
        step1.classList.add('completed');
    } else {
        step1.classList.add('active');
    }

    // Step 2: Questions selected
    if (classId && selectedQuestions > 0) {
        progress = 66;
        step2.classList.add('completed');
    } else if (classId) {
        step2.classList.add('active');
    }

    // Step 3: Ready to create
    if (classId && selectedQuestions > 0) {
        progress = 100;
        step3.classList.add('active');
    }

    progressStepsFill.style.width = progress + '%';
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

    const classForSurvey = document.getElementById('classForSurvey') ? document.getElementById('classForSurvey').value : '';

    // Require class selection
    if (!classForSurvey) {
        // Reset button state for validation errors
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        btnText.style.display = 'inline-block';
        btnLoader.classList.remove('show');
        showAlert('❌ Please select a class', 'danger');
        if (document.getElementById('classForSurvey')) document.getElementById('classForSurvey').style.borderColor = '#dc3545';
        return;
    }

    if (document.getElementById('classForSurvey')) document.getElementById('classForSurvey').style.borderColor = '';

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

    let classesToCreateFor = [];

    if (classForSurvey === 'ALL') {
        // Create survey for ALL classes from Firebase
        classesToCreateFor = await Storage.getClasses();
        if (classesToCreateFor.length === 0) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            btnText.style.display = 'inline-block';
            btnLoader.classList.remove('show');
            showAlert('❌ No classes found. Create classes first.', 'danger');
            return;
        }
    } else {
        // Create survey for a single class
        const classes = await Storage.getClasses();
        const cls = classes.find(x => x.id === classForSurvey);
        if (!cls) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            btnText.style.display = 'inline-block';
            btnLoader.classList.remove('show');
            showAlert('❌ Selected class not found. Refresh and try again.', 'danger');
            return;
        }
        classesToCreateFor = [cls];
    }

    // Validate that all classes have faculties
    let allValid = true;
    classesToCreateFor.forEach(cls => {
        const faculties = cls.faculties || [];
        if (faculties.length === 0) {
            showAlert(`❌ No faculties assigned to class "${cls.name}". Please assign faculties first.`, 'danger');
            allValid = false;
        }
    });

    if (!allValid) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        btnText.style.display = 'inline-block';
        btnLoader.classList.remove('show');
        return;
    }

    try {
        let surveysCreated = 0;
        for (const classItem of classesToCreateFor) {
            const faculties = (classItem.faculties || []).map(faculty => ({
                id: faculty.id,
                name: faculty.name
            }));

            const survey = {
                id: Storage.generateId(),
                classId: classItem.id,
                className: classItem.name,
                faculties: faculties,
                questions: questions,
                createdBy: currentUser.id,
                createdAt: new Date().toISOString(),
                isActive: true
            };

            await Storage.saveSurvey(survey);
            surveysCreated++;
        }

        showAlert(`✅ Survey created successfully for ${surveysCreated} class(es)! Redirecting...`, 'success');

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
window.onClassSelectionChange = onClassSelectionChange;
window.toggleSelectAllQuestions = toggleSelectAllQuestions;