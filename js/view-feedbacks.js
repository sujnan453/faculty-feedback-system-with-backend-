// View Feedbacks Functionality - Updated with Filters and Faculty Selection

let allFeedbacks = [];
let currentFilters = {
    year: '',
    department: '',
    faculty: ''
};

const currentUser = checkAuth('admin');
if (!currentUser) {
    // User will be redirected
} else {
    initializeViewFeedbacks();
}

function initializeViewFeedbacks() {
    allFeedbacks = loadAllFeedbacks();
    loadDepartmentOptions();
    // Start with empty state - no filters applied
    showEmptyState();
    
    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            allFeedbacks = loadAllFeedbacks();
            loadDepartmentOptions();
        }
    });
}

function loadDepartmentOptions() {
    // Get all departments created by admin
    const departments = Storage.getDepartments();
    const departmentSelect = document.getElementById('filterClass');
    
    // Clear existing options except the first one
    departmentSelect.innerHTML = '<option value="">-- Select Department --</option><option value="ALL">📋 All Departments</option>';
    
    // Add each department as an option
    departments.forEach(dept => {
        const option = document.createElement('option');
        // Handle both string and object formats
        const deptName = typeof dept === 'string' ? dept : dept.name;
        option.value = deptName;
        option.textContent = deptName;
        departmentSelect.appendChild(option);
    });
}

function loadAllFeedbacks() {
    let allFeedbacks = Storage.getFeedbacks();
    
    // VALIDATION: Filter out orphaned feedbacks (where survey/department/faculty no longer exist)
    allFeedbacks = allFeedbacks.filter(feedback => {
        // Check if survey exists
        const survey = Storage.getSurveyById(feedback.surveyId);
        if (!survey) {
            console.warn(`⚠️ Orphaned feedback detected: Survey ${feedback.surveyId} no longer exists`);
            return false;
        }

        // Check if department exists
        const department = Storage.getDepartmentByName(feedback.studentDepartment);
        if (!department) {
            console.warn(`⚠️ Orphaned feedback detected: Department ${feedback.studentDepartment} no longer exists`);
            return false;
        }

        // Check if all faculty members still exist
        const departmentFacultyIds = (department.faculties || []).map(f => f.id);
        const invalidFaculty = feedback.selectedTeachers.some(t => !departmentFacultyIds.includes(t.id));
        if (invalidFaculty) {
            console.warn(`⚠️ Orphaned feedback detected: Some faculty members no longer exist in ${feedback.studentDepartment}`);
            return false;
        }

        return true;
    });

    return allFeedbacks;
}

function applyFilters() {
    const year = document.getElementById('filterYear').value;
    const department = document.getElementById('filterClass').value;
    const faculty = document.getElementById('filterFaculty').value;
    // Removed: searchTeacher and sortBy filters

    // Check if year is selected
    if (!year) {
        showEmptyState();
        return;
    }

    // Check if department is selected (allow "ALL" for all departments)
    if (!department) {
        showEmptyState();
        return;
    }

    currentFilters = { year, department, faculty };

    // Load faculty options if department is selected and not "ALL"
    if (department !== 'ALL') {
        loadFacultyOptions(department);
    } else {
        // For "All Departments", show all faculties
        loadAllFacultiesForAllDepartments();
    }

    // Filter feedbacks
    let filteredFeedbacks = [...allFeedbacks];

    // Apply year filter (handle "all" option)
    if (year !== 'all') {
        filteredFeedbacks = filteredFeedbacks.filter(f => f.studentYear == year);
    }

    // Apply department filter
    if (department !== 'ALL') {
        filteredFeedbacks = filteredFeedbacks.filter(f => {
            return (f.studentDepartment === department) || (f.department === department);
        });
    }

    // Apply faculty filter if selected
    if (faculty) {
        filteredFeedbacks = filteredFeedbacks.filter(f => {
            return f.responses && f.responses.some(r => r.teacherId === faculty);
        });
    }

    if (filteredFeedbacks.length === 0) {
        const deptDisplay = department === 'ALL' ? 'All Departments' : department;
        showNoDataState(year, deptDisplay);
        return;
    }

    // Show stats and results
    showStats();
    updateStatistics(filteredFeedbacks, faculty);
    displayResults(filteredFeedbacks, faculty);
}

function loadFacultyOptions(department) {
    // Get faculty directly from storage for the selected department
    const departments = Storage.getDepartments();
    const selectedDept = departments.find(d => d.name === department);
    
    let faculties = [];
    if (selectedDept && selectedDept.faculties) {
        faculties = selectedDept.faculties;
    }

    // Populate faculty dropdown
    const facultySelect = document.getElementById('filterFaculty');
    const currentValue = facultySelect.value;
    facultySelect.innerHTML = '<option value="">-- All Faculties --</option>';

    faculties.forEach(faculty => {
        const option = document.createElement('option');
        option.value = faculty.id;
        option.textContent = faculty.name;
        facultySelect.appendChild(option);
    });

    // Show faculty selection group if there are faculties
    document.getElementById('facultySelectionGroup').style.display = faculties.length > 0 ? 'flex' : 'none';

    // Restore previous selection if it exists
    if (currentValue && facultySelect.querySelector(`option[value="${currentValue}"]`)) {
        facultySelect.value = currentValue;
    } else {
        facultySelect.value = '';
    }
}

function loadAllFacultiesForAllDepartments() {
    // Get all faculties from all departments
    const departments = Storage.getDepartments();
    const allFaculties = {};
    
    departments.forEach(dept => {
        if (dept.faculties) {
            dept.faculties.forEach(faculty => {
                if (!allFaculties[faculty.id]) {
                    allFaculties[faculty.id] = {
                        id: faculty.id,
                        name: `${faculty.name} (${dept.name})`
                    };
                }
            });
        }
    });

    // Populate faculty dropdown
    const facultySelect = document.getElementById('filterFaculty');
    const currentValue = facultySelect.value;
    facultySelect.innerHTML = '<option value="">-- All Faculties --</option>';

    Object.values(allFaculties).forEach(faculty => {
        const option = document.createElement('option');
        option.value = faculty.id;
        option.textContent = faculty.name;
        facultySelect.appendChild(option);
    });

    // Show faculty selection group if there are faculties
    document.getElementById('facultySelectionGroup').style.display = Object.keys(allFaculties).length > 0 ? 'flex' : 'none';

    // Restore previous selection if it exists
    if (currentValue && facultySelect.querySelector(`option[value="${currentValue}"]`)) {
        facultySelect.value = currentValue;
    } else {
        facultySelect.value = '';
    }
}

function showEmptyState() {
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('feedbacksContainer').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('facultySelectionGroup').style.display = 'none';
    currentFilters = { year: '', department: '', faculty: '' };
}

function showNoDataState(year, department) {
    document.getElementById('statsSection').style.display = 'none';
    const yearDisplay = year === 'all' ? 'All Years' : `Year ${year}`;
    document.getElementById('emptyState').innerHTML = `
        <div style="text-align: center; padding: 50px 20px;">
            <span style="font-size: 64px; display: block; margin-bottom: 20px;">📭</span>
            <h3 style="color: #999; margin: 0 0 10px 0;">No Feedback Data</h3>
            <p style="color: #ccc; margin: 0;">No feedbacks found for ${yearDisplay}, ${department} department</p>
        </div>
    `;
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('feedbacksContainer').style.display = 'none';
}

function showStats() {
    document.getElementById('statsSection').style.display = 'grid';
    document.getElementById('quickStatsSection').style.display = 'grid';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('feedbacksContainer').style.display = 'block';
}

function resetFilters() {
    document.getElementById('filterYear').value = '';
    document.getElementById('filterClass').value = '';
    document.getElementById('filterFaculty').value = '';
    document.getElementById('searchTeacher').value = '';
    document.getElementById('sortBy').value = '';
    showEmptyState();
}

function updateStatistics(feedbacks, selectedFaculty) {
    const totalFeedbacks = feedbacks.length;

    let totalRatings = 0;
    let ratingCount = 0;
    const evaluatedFaculties = {};
    const questionsAnswered = new Set();
    const facultyStats = {};

    feedbacks.forEach(feedback => {
        if (feedback.responses) {
            feedback.responses.forEach(response => {
                // If faculty filter is applied, only count responses for that faculty
                if (selectedFaculty && response.teacherId !== selectedFaculty) {
                    return;
                }

                if (!evaluatedFaculties[response.teacherId]) {
                    evaluatedFaculties[response.teacherId] = response.teacherName;
                }

                totalRatings += response.rating || 0;
                ratingCount++;

                // Track faculty stats for quick stats
                const facultyId = response.teacherId;
                if (!facultyStats[facultyId]) {
                    facultyStats[facultyId] = {
                        name: response.teacherName,
                        ratings: [],
                        count: 0
                    };
                }
                facultyStats[facultyId].ratings.push(response.rating || 0);
                facultyStats[facultyId].count++;
            });
        }
    });

    // Count unique questions from the first feedback
    let totalQuestions = 0;
    if (feedbacks.length > 0 && feedbacks[0].responses) {
        totalQuestions = feedbacks[0].responses.length;
    }

    const averageRating = ratingCount > 0 ? (totalRatings / ratingCount).toFixed(2) : 0;

    document.getElementById('totalFeedbacks').textContent = totalFeedbacks;
    document.getElementById('averageRating').textContent = averageRating + ' / 10';
    document.getElementById('teachersEvaluated').textContent = Object.keys(evaluatedFaculties).length;
    document.getElementById('questionsAnswered').textContent = totalQuestions;

    // Update Quick Stats
    updateQuickStats(facultyStats, averageRating);
}

function updateQuickStats(facultyStats, deptAverage) {
    let highestTeacher = '-';
    let highestScore = 0;
    let lowestTeacher = '-';
    let lowestScore = 10;
    let mostFeedbackTeacher = '-';
    let mostFeedbackCount = 0;

    Object.values(facultyStats).forEach(faculty => {
        const avgRating = faculty.ratings.length > 0 
            ? (faculty.ratings.reduce((a, b) => a + b, 0) / faculty.ratings.length)
            : 0;

        // Highest rated
        if (avgRating > highestScore) {
            highestScore = avgRating;
            highestTeacher = faculty.name;
        }

        // Lowest rated
        if (avgRating < lowestScore && faculty.ratings.length > 0) {
            lowestScore = avgRating;
            lowestTeacher = faculty.name;
        }

        // Most feedback
        if (faculty.count > mostFeedbackCount) {
            mostFeedbackCount = faculty.count;
            mostFeedbackTeacher = faculty.name;
        }
    });

    document.getElementById('highestRatedTeacher').textContent = highestTeacher;
    document.getElementById('highestRatedScore').textContent = highestScore.toFixed(2) + '/10';
    document.getElementById('lowestRatedTeacher').textContent = lowestTeacher;
    document.getElementById('lowestRatedScore').textContent = lowestScore.toFixed(2) + '/10';
    document.getElementById('mostFeedbackTeacher').textContent = mostFeedbackTeacher;
    document.getElementById('mostFeedbackCount').textContent = mostFeedbackCount + ' response' + (mostFeedbackCount !== 1 ? 's' : '');
    document.getElementById('deptAvgRating').textContent = deptAverage;
}

function displayResults(feedbacks, selectedFaculty) {
    const container = document.getElementById('feedbacksListContainer');
    container.innerHTML = '';

    // Organize feedbacks by faculty
    const facultyStats = {};

    feedbacks.forEach(feedback => {
        if (feedback.responses) {
            feedback.responses.forEach(response => {
                // If faculty filter is applied, only show that faculty
                if (selectedFaculty && response.teacherId !== selectedFaculty) {
                    return;
                }

                const facultyId = response.teacherId || 'unknown';
                if (!facultyStats[facultyId]) {
                    facultyStats[facultyId] = {
                        name: response.teacherName,
                        ratings: [],
                        comments: []
                    };
                }

                facultyStats[facultyId].ratings.push(response.rating || 0);
                if (response.comment) {
                    facultyStats[facultyId].comments.push(response.comment);
                }
            });
        }
    });

    // Display each faculty's statistics (removed search and sort)
    let displayFaculties = Object.entries(facultyStats);
    
    displayFaculties.forEach(([facultyId, faculty]) => {
        const avgRating = faculty.ratings.length > 0 
            ? (faculty.ratings.reduce((a, b) => a + b, 0) / faculty.ratings.length).toFixed(2)
            : 0;

        const card = document.createElement('div');
        card.className = 'teacher-feedback-card';
        card.setAttribute('data-faculty-card', 'true');
        
        // Create stars container with data attribute - now for 1-10 scale
        const starsHtml = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => {
            const count = faculty.ratings.filter(r => Math.round(r) === rating).length;
            const percentage = faculty.ratings.length > 0 ? (count / faculty.ratings.length * 100).toFixed(0) : 0;
            return `
                <div style="text-align: center;">
                    <div style="font-size: 16px; font-weight: bold; color: #667eea;">${count}</div>
                    <div style="font-size: 12px; color: #999;">${rating}</div>
                    <div style="width: 100%; height: 4px; background: #e0e0e0; border-radius: 2px; margin-top: 5px; overflow: hidden;">
                        <div style="height: 100%; background: #667eea; width: ${percentage}%;"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Create comments container with data attribute
        const commentsHtml = faculty.comments.map(comment => `
            <div style="margin-bottom: 8px; padding: 8px; background: white; border-left: 3px solid #667eea; border-radius: 3px; font-size: 13px; color: #555;">
                "${comment}"
            </div>
        `).join('');

        card.innerHTML = `
            <div class="teacher-feedback-header">
                <div>
                    <h4 style="margin: 0; color: #333;" data-faculty-name>👨‍🏫 ${faculty.name}</h4>
                    <small style="color: #999;">${faculty.ratings.length} question${faculty.ratings.length !== 1 ? 's' : ''}</small>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 28px; font-weight: bold; color: #667eea;" data-avg-rating>${avgRating} / 10</div>
                    <div style="color: #999; font-size: 12px;">Average Rating</div>
                </div>
            </div>

            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                <div style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 8px; font-size: 12px;" data-stars-container>
                    ${starsHtml}
                </div>
            </div>

            ${faculty.comments.length > 0 ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                    <h5 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">💬 Comments (${faculty.comments.length})</h5>
                    <div style="max-height: 200px; overflow-y: auto; background: #f9f9f9; padding: 10px; border-radius: 6px;" data-comments-container>
                        ${commentsHtml}
                    </div>
                </div>
            ` : '<div data-comments-container style="display: none;"></div>'}
        `;

        container.appendChild(card);
    });
}

function exportFeedbackData() {
    const year = currentFilters.year;
    const department = currentFilters.department;
    
    if (!year || !department) {
        showAlert('Please select year and department first', 'warning');
        return;
    }

    // Create HTML content for export
    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Faculty Feedback Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
            .header-info { background: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .stat-row { display: flex; gap: 20px; margin-bottom: 15px; }
            .stat-item { background: white; padding: 15px; border-left: 4px solid #667eea; border-radius: 4px; flex: 1; }
            .stat-item h4 { margin: 0 0 5px 0; color: #667eea; }
            .stat-item p { margin: 0; font-size: 24px; font-weight: bold; color: #333; }
            .faculty-card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid; }
            .faculty-name { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .rating-item { display: inline-block; background: #f5f5f5; padding: 8px 12px; margin: 5px; border-radius: 4px; font-size: 13px; }
            .rating-value { font-weight: bold; color: #667eea; }
            .comments { background: #f9f9f9; padding: 10px; border-left: 3px solid #667eea; margin-top: 10px; border-radius: 4px; }
            .comment-item { padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-size: 13px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; font-size: 12px; color: #999; }
            @media print {
                body { margin: 0; }
                .page-break { page-break-after: always; }
            }
        </style>
    </head>
    <body>
        <h1>📋 Faculty Feedback Report</h1>
        <div class="header-info">
            <p><strong>Department:</strong> ${department}</p>
            <p><strong>Year:</strong> ${year}</p>
            <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div class="stat-row">
            <div class="stat-item">
                <h4>Total Responses</h4>
                <p>${document.getElementById('totalFeedbacks').textContent}</p>
            </div>
            <div class="stat-item">
                <h4>Average Rating</h4>
                <p>${document.getElementById('averageRating').textContent}/10</p>
            </div>
            <div class="stat-item">
                <h4>Teachers Evaluated</h4>
                <p>${document.getElementById('teachersEvaluated').textContent}</p>
            </div>
        </div>
    `;

    // Get all faculty cards
    const feedbackCards = document.querySelectorAll('[data-faculty-card]');
    feedbackCards.forEach(card => {
        const facultyName = card.querySelector('[data-faculty-name]')?.textContent || 'N/A';
        const avgRating = card.querySelector('[data-avg-rating]')?.textContent || '0.0';
        const starsDiv = card.querySelector('[data-stars-container]');
        const commentsDiv = card.querySelector('[data-comments-container]');

        htmlContent += `
            <div class="faculty-card">
                <div class="faculty-name">👨‍🏫 ${facultyName}</div>
                <p><strong>Average Rating:</strong> <span class="rating-value">${avgRating}/10</span></p>
                <div style="margin: 10px 0;">
                    <strong>Rating Distribution:</strong>
                    <div>${starsDiv?.innerHTML || 'N/A'}</div>
                </div>
        `;

        if (commentsDiv && commentsDiv.innerHTML.trim()) {
            htmlContent += `
                <div class="comments">
                    <strong>Comments:</strong>
                    <div class="comment-item">${commentsDiv.innerHTML}</div>
                </div>
            `;
        }

        htmlContent += `</div>`;
    });

    htmlContent += `
        <div class="footer">
            <p>This is an automated report generated by the Faculty Feedback System.</p>
        </div>
    </body>
    </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `feedback_${department}_${year}_${new Date().getTime()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('Feedback data exported successfully!', 'success');
}

function printFeedbackData() {
    const year = currentFilters.year;
    const department = currentFilters.department;
    
    if (!year || !department) {
        showAlert('Please select year and department first', 'warning');
        return;
    }

    // Create print content
    let printContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #333; border-bottom: 3px solid #667eea; padding-bottom: 10px; margin-bottom: 20px;">Faculty Feedback Report</h1>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p><strong>Department:</strong> ${department}</p>
                <p><strong>Year:</strong> ${year}</p>
                <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div style="display: flex; gap: 20px; margin-bottom: 15px;">
                <div style="background: white; padding: 15px; border-left: 4px solid #667eea; border-radius: 4px; flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #667eea;">Total Responses</h4>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #333;">${document.getElementById('totalFeedbacks').textContent}</p>
                </div>
                <div style="background: white; padding: 15px; border-left: 4px solid #667eea; border-radius: 4px; flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #667eea;">Average Rating</h4>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #333;">${document.getElementById('averageRating').textContent}/10</p>
                </div>
                <div style="background: white; padding: 15px; border-left: 4px solid #667eea; border-radius: 4px; flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #667eea;">Teachers Evaluated</h4>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #333;">${document.getElementById('teachersEvaluated').textContent}</p>
                </div>
            </div>
    `;

    // Get all faculty cards
    const feedbackCards = document.querySelectorAll('[data-faculty-card]');
    feedbackCards.forEach((card, index) => {
        const facultyName = card.querySelector('[data-faculty-name]')?.textContent || 'N/A';
        const avgRating = card.querySelector('[data-avg-rating]')?.textContent || '0.0';

        printContent += `
            <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid;">
                <div style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px;">👨‍🏫 ${facultyName}</div>
                <p><strong>Average Rating:</strong> <span style="font-weight: bold; color: #667eea;">${avgRating}/10</span></p>
        `;

        const starsDiv = card.querySelector('[data-stars-container]');
        if (starsDiv) {
            printContent += `<div style="margin: 10px 0;"><strong>Rating Distribution:</strong><div>${starsDiv.innerHTML}</div></div>`;
        }

        const commentsDiv = card.querySelector('[data-comments-container]');
        if (commentsDiv && commentsDiv.innerHTML.trim()) {
            printContent += `
                <div style="background: #f9f9f9; padding: 10px; border-left: 3px solid #667eea; margin-top: 10px; border-radius: 4px;">
                    <strong>Comments:</strong>
                    <div>${commentsDiv.innerHTML}</div>
                </div>
            `;
        }

        printContent += `</div>`;
    });

    printContent += `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; font-size: 12px; color: #999;">
                <p>This is an automated report generated by the Faculty Feedback System.</p>
            </div>
        </div>
    `;

    // Open print window
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 250);

    showAlert('Opening print preview...', 'success');
}


function exportToCSV() {
    const year = currentFilters.year;
    const department = currentFilters.department;
    
    if (!year || !department) {
        showAlert('Please select year and department first', 'warning');
        return;
    }

    // Prepare CSV data
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add header
    csvContent += 'Teacher Name,Average Rating,Total Questions Answered,Comments Count\n';
    
    // Get all faculty cards
    const feedbackCards = document.querySelectorAll('[data-faculty-card]');
    feedbackCards.forEach(card => {
        const facultyName = card.querySelector('[data-faculty-name]')?.textContent?.replace('👨‍🏫 ', '') || 'N/A';
        const avgRating = card.querySelector('[data-avg-rating]')?.textContent?.split(' / ')[0] || '0.0';
        const questionsText = card.querySelector('small')?.textContent || '0 questions';
        const questionsCount = questionsText.split(' ')[0];
        const commentsDiv = card.querySelector('[data-comments-container]');
        const commentsCount = commentsDiv ? (commentsDiv.innerHTML.match(/margin-bottom: 8px/g) || []).length : 0;

        // Escape quotes in teacher name
        const escapedName = `"${facultyName.replace(/"/g, '""')}"`;
        csvContent += `${escapedName},${avgRating},${questionsCount},${commentsCount}\n`;
    });

    // Create blob and download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `feedback_${department}_${year}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('Feedback data exported as CSV successfully!', 'success');
}

function showAlert(message, type = 'danger') {
    // Create a temporary alert
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        alertDiv.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
    } else if (type === 'warning') {
        alertDiv.style.background = 'linear-gradient(135deg, #ffa502 0%, #ff6b35 100%)';
    } else {
        alertDiv.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    }
    
    alertDiv.style.color = 'white';
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => document.body.removeChild(alertDiv), 300);
    }, 3000);
}

// ===== Year-wise Faculty Average Functions =====
