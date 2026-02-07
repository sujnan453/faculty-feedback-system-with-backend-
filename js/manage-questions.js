// Manage Questions Functionality

let editingQuestionId = null; // Track which question is being edited
let currentPage = 1;
let allQuestions = [];
let filteredQuestions = [];

// Custom confirmation dialog
function showConfirmDialog(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        `;

        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 450px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease;
        `;

        modal.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #1a202c; font-size: 20px; font-weight: 700;">${title}</h3>
            <p style="margin: 0 0 25px 0; color: #4a5568; font-size: 15px; line-height: 1.6;">${message}</p>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="cancelBtn" style="
                    padding: 12px 24px;
                    border: 2px solid #e2e8f0;
                    background: white;
                    color: #4a5568;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                ">${cancelText}</button>
                <button id="confirmBtn" style="
                    padding: 12px 24px;
                    border: none;
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                    color: white;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
                ">${confirmText}</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Handle buttons
        const confirmBtn = modal.querySelector('#confirmBtn');
        const cancelBtn = modal.querySelector('#cancelBtn');

        confirmBtn.addEventListener('mouseenter', () => {
            confirmBtn.style.transform = 'translateY(-2px)';
            confirmBtn.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
        });
        confirmBtn.addEventListener('mouseleave', () => {
            confirmBtn.style.transform = 'translateY(0)';
            confirmBtn.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
        });

        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = '#f7fafc';
            cancelBtn.style.borderColor = '#cbd5e0';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = 'white';
            cancelBtn.style.borderColor = '#e2e8f0';
        });

        confirmBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            document.head.removeChild(style);
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            document.head.removeChild(style);
            resolve(false);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                document.head.removeChild(style);
                resolve(false);
            }
        });
    });
}

// Wait for modules to be loaded
function waitForModules() {
    return new Promise((resolve) => {
        const checkModules = () => {
            if (typeof window.Storage !== 'undefined' &&
                typeof window.checkAuth !== 'undefined') {
                console.log('✅ Modules loaded successfully');
                resolve();
            } else {
                console.log('⏳ Waiting for modules...');
                setTimeout(checkModules, 100);
            }
        };
        checkModules();
    });
}

// Initialize when everything is ready
(async function() {
    console.log('🔄 Initializing Manage Questions...');

    // Wait for DOM
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }

    // Wait for modules
    await waitForModules();

    console.log('🔐 Checking authentication...');
    const currentUser = await checkAuth('admin');

    if (!currentUser) {
        console.log('❌ Not authenticated - redirecting...');
        // User will be redirected by checkAuth function
    } else {
        console.log('✅ Authenticated as:', currentUser.email);
        initializeManageQuestions();
    }
})();

async function initializeManageQuestions() {
    console.log('🚀 Starting initialization...');

    // Load existing questions
    await loadQuestions();

    // Form submission
    document.getElementById('addQuestionForm').addEventListener('submit', handleAddQuestion);

    // Cancel edit button
    document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);

    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            await loadQuestions();
        }
    });

    console.log('✅ Initialization complete');
}

async function loadQuestions() {
    console.log('📋 Loading questions from Firestore...');
    allQuestions = await Storage.getQuestions();
    console.log(`✅ Loaded ${allQuestions.length} questions from Firestore`);

    // If no search term, show all questions
    const searchTerm = document.getElementById('searchQuestions').value.toLowerCase().trim();
    if (searchTerm === '') {
        filteredQuestions = [...allQuestions];
    }

    const container = document.getElementById('questionsGrid');
    const countBadge = document.getElementById('questionCountBadge');

    // Update count badge
    countBadge.textContent = allQuestions.length;

    if (allQuestions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M20 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h11"></path>
                    </svg>
                </div>
                <h3>No Questions Created Yet</h3>
                <p>Start building your question library by creating your first question or loading sample questions.</p>
                <div class="empty-actions">
                    <button type="button" class="btn-primary" onclick="document.getElementById('questionText').focus(); document.querySelector('.form-section').scrollIntoView({behavior: 'smooth'});">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Create First Question
                    </button>
                    <button type="button" class="btn-secondary" onclick="loadSpecific10Questions()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"></path>
                        </svg>
                        Load Sample Questions
                    </button>
                </div>
            </div>
        `;
        document.getElementById('paginationControls').style.display = 'none';
        return;
    }

    // Show all questions without pagination
    const paginatedQuestions = filteredQuestions;

    // Handle no search results
    if (searchTerm !== '' && paginatedQuestions.length === 0) {
        container.innerHTML = `
            <div class="no-search-results">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <h3>No Questions Found</h3>
                <p>No questions match your search term "<strong>${searchTerm}</strong>". Try searching with different keywords.</p>
            </div>
        `;
        return;
    }

    // Render questions
    container.innerHTML = '';
    paginatedQuestions.forEach((question, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        questionCard.style.animationDelay = `${index * 0.1}s`;

        const createdDate = new Date(question.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        questionCard.innerHTML = `
            <div class="question-header">
                <div class="question-number">${index + 1}</div>
                <div class="question-content">
                    <p class="question-text">${question.text}</p>
                    <div class="question-meta">
                        <div class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Created ${createdDate}
                        </div>
                    </div>
                </div>
            </div>
            <div class="question-actions">
                <button type="button" class="btn-action btn-edit" onclick="editQuestion('${question.id}')" title="Edit this question">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                </button>
                <button type="button" class="btn-action btn-delete" onclick="deleteQuestion('${question.id}')" title="Delete this question">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Delete
                </button>
            </div>
        `;

        container.appendChild(questionCard);
    });

    // Hide pagination controls since we're showing all questions
    const paginationControls = document.getElementById('paginationControls');
    if (paginationControls) {
        paginationControls.style.display = 'none';
    }
}

async function handleAddQuestion(e) {
    e.preventDefault();

    const questionInput = document.getElementById('questionText');
    const questionText = questionInput.value.trim();

    // Clear previous error
    questionInput.style.borderColor = '';

    // Validation
    if (!questionText) {
        showAlert('❌ Please enter a question', 'danger');
        questionInput.style.borderColor = '#dc3545';
        return;
    }

    if (questionText.length < 5) {
        showAlert('❌ Question must be at least 5 characters long', 'danger');
        questionInput.style.borderColor = '#dc3545';
        return;
    }

    if (questionText.length > 500) {
        showAlert('❌ Question must not exceed 500 characters', 'danger');
        questionInput.style.borderColor = '#dc3545';
        return;
    }

    if (!questionText.endsWith('?')) {
        showAlert('⚠️ Question should end with a question mark (?)', 'warning');
    }

    // Check for duplicate question (excluding the one being edited)
    const existingQuestions = await Storage.getQuestions();
    const isDuplicate = existingQuestions.some(q =>
        q.text.toLowerCase() === questionText.toLowerCase() && q.id !== editingQuestionId
    );
    if (isDuplicate) {
        showAlert('❌ This question already exists', 'danger');
        questionInput.style.borderColor = '#dc3545';
        return;
    }

    if (editingQuestionId) {
        // Update existing question
        const question = await Storage.getQuestionById(editingQuestionId);

        if (question) {
            question.text = questionText;
            question.updatedAt = new Date().toISOString();
            await Storage.saveQuestion(question);

            showAlert('✅ Question updated successfully!', 'success');

            // Clear form and reset style
            questionInput.value = '';
            questionInput.style.borderColor = '';

            // Cancel edit mode
            cancelEdit();

            // Reload questions to show updated list
            await loadQuestions();
            return;
        }
    } else {
        // Create new question
        console.log('📝 Creating new question...');
        const question = {
            id: Storage.generateId(),
            text: questionText,
            allowComments: true,
            createdAt: new Date().toISOString()
        };

        console.log('Question object created:', question);

        // Save question
        const savedQuestion = await Storage.saveQuestion(question);

        if (savedQuestion) {
            console.log('✅ Question saved successfully:', savedQuestion);
            showAlert('✅ Question added successfully!', 'success');
        } else {
            console.error('❌ Failed to save question - Storage.saveQuestion returned null');
            showAlert('❌ Failed to save question. Check console for details.', 'danger');
            return;
        }
    }

    // Clear form and reset style
    questionInput.value = '';
    questionInput.style.borderColor = '';

    // Reload questions
    console.log('🔄 Reloading questions list...');
    await loadQuestions();
}

async function editQuestion(questionId) {
    const question = await Storage.getQuestionById(questionId);

    if (!question) {
        showAlert('❌ Question not found', 'danger');
        return;
    }

    // Set editing state
    editingQuestionId = questionId;

    // Update form
    const questionInput = document.getElementById('questionText');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');

    questionInput.value = question.text;
    formTitle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 8px; vertical-align: middle;">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        Edit Question
    `;
    submitBtn.textContent = 'Update Question';
    cancelBtn.style.display = 'inline-block';

    // Focus on input
    questionInput.focus();
    questionInput.select();

    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function cancelEdit() {
    editingQuestionId = null;

    const questionInput = document.getElementById('questionText');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');

    questionInput.value = '';
    formTitle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 8px; vertical-align: middle;">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add New Question
    `;
    submitBtn.textContent = 'Add Question';
    cancelBtn.style.display = 'none';
    questionInput.style.borderColor = '';
}

async function deleteQuestion(questionId) {
    // Create custom confirmation modal
    const confirmed = await showConfirmDialog(
        'Delete Question',
        'Are you sure you want to delete this question? Any surveys using this question will not be affected.',
        'Delete',
        'Cancel'
    );

    if (confirmed) {
        await Storage.deleteQuestion(questionId);
        showAlert('Question deleted successfully!', 'success');
        await loadQuestions();
    }
}

function filterQuestions() {
    const searchTerm = document.getElementById('searchQuestions').value.toLowerCase().trim();
    const clearBtn = document.getElementById('clearSearchBtn');
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    const searchResultsCount = document.getElementById('searchResultsCount');

    // Show/hide clear button
    clearBtn.style.display = searchTerm ? 'block' : 'none';

    // Filter questions
    if (searchTerm === '') {
        filteredQuestions = [...allQuestions];
        searchResultsInfo.style.display = 'none';
    } else {
        filteredQuestions = allQuestions.filter(question =>
            question.text.toLowerCase().includes(searchTerm)
        );

        // Show search results info
        searchResultsInfo.style.display = 'flex';
        const count = filteredQuestions.length;
        searchResultsCount.textContent = `${count} ${count === 1 ? 'result' : 'results'} found`;
    }

    // Reload questions with filtered results
    loadQuestions();
}

function clearSearch() {
    document.getElementById('searchQuestions').value = '';
    filterQuestions();
    document.getElementById('searchQuestions').focus();
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

// Load specific 10 questions function - REMOVED (sample-data.js deleted)
// Admin should manually create questions through the "Add Question" form
async function loadSpecific10Questions() {
    console.log('⚠️ loadSpecific10Questions function has been removed');
    showAlert('This feature has been removed. Please add questions manually using the "Add Question" button.', 'info');
}

// Debug function removed - no longer needed