// COMPLETE FIXED VERSION - Copy this entire content to js/visualization.js

// Visualization Functionality

let selectedDepartments = [];
let chartInstance = null;
let currentReportData = null; // Store report data for export

// Wait for DOM and Storage to be ready
document.addEventListener('DOMContentLoaded', () => {
    const checkStorageReady = setInterval(() => {
        if (window.Storage && window.checkAuth) {
            clearInterval(checkStorageReady);

            const currentUser = checkAuth('admin');
            if (!currentUser) {
                // User will be redirected by checkAuth function
            } else {
                initializeVisualization();
            }
        }
    }, 50);
});

async function initializeVisualization() {
    await loadAvailableDepartmentsDropdown();
    await loadReportDepartmentFilter();

    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            await loadAvailableDepartmentsDropdown();
            await loadReportDepartmentFilter();
        }
    });
}

async function loadReportDepartmentFilter() {
    try {
        const departments = await Storage.getDepartments();
        const dropdown = document.getElementById('reportDepartmentFilter');

        if (!dropdown) return;

        dropdown.innerHTML = '<option value="">All Departments</option>';

        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.name;
            option.textContent = dept.name;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('❌ Error loading report department filter:', error);
    }
}

async function loadAvailableDepartmentsDropdown() {
    try {
        console.log('📊 Loading departments for dropdown...');
        const departments = await Storage.getDepartments();
        console.log('✅ Departments loaded:', departments.length, departments);

        const dropdown = document.getElementById('departmentDropdown');
        if (!dropdown) {
            console.error('❌ Dropdown element not found!');
            return;
        }

        dropdown.innerHTML = '<option value="">-- All Departments --</option>';

        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.name;
            option.textContent = dept.name;
            dropdown.appendChild(option);
            console.log('  ➕ Added department:', dept.name);
        });

        window.availableDepartments = departments.map(d => d.name);
        console.log('✅ Dropdown populated with', departments.length, 'departments');
    } catch (error) {
        console.error('❌ Error loading departments:', error);
        showAlert('Failed to load departments. Please refresh the page.', 'danger');
    }
}

async function onDepartmentChange() {
    const dropdown = document.getElementById('departmentDropdown');
    const selectedDept = dropdown.value;

    if (!selectedDept) {
        const allDepts = await Storage.getDepartments();
        selectedDepartments = allDepts.map(d => d.name);
        updateSelectedDisplay();
        updateButtonStates();
        showAlert('All departments selected!', 'success');
        return;
    }

    selectedDepartments = [selectedDept];
    updateSelectedDisplay();
    updateButtonStates();
    showAlert(`${selectedDept} selected!`, 'success');
}

function removeDepartment(dept) {
    selectedDepartments = selectedDepartments.filter(d => d !== dept);
    document.getElementById('departmentDropdown').value = '';
    updateSelectedDisplay();
    updateButtonStates();
}

function updateSelectedDisplay() {
    const container = document.getElementById('selectedDepartments');
    container.innerHTML = '';

    selectedDepartments.forEach(dept => {
        const tag = document.createElement('div');
        tag.className = 'selected-tag';
        tag.innerHTML = `
            ${dept}
            <button onclick="removeDepartment('${dept}')">✕</button>
        `;
        container.appendChild(tag);
    });
}

function updateButtonStates() {
    const hasSelection = selectedDepartments.length > 0;
    document.getElementById('piechartBtn').disabled = !hasSelection;
    document.getElementById('histogramBtn').disabled = !hasSelection;
    document.getElementById('linechartBtn').disabled = !hasSelection;
}

async function calculateDepartmentYearStats() {
    console.log('📊 Calculating stats for departments:', selectedDepartments);
    let allFeedbacks = await Storage.getFeedbacks();
    console.log('📊 Total feedbacks from database:', allFeedbacks.length);

    const validFeedbacks = [];
    for (const feedback of allFeedbacks) {
        const survey = await Storage.getSurveyById(feedback.surveyId);
        if (!survey) continue;

        const department = await Storage.getDepartmentByName(feedback.studentDepartment);
        if (!department) continue;

        const departmentFacultyIds = (department.faculties || []).map(f => f.id);
        const invalidFaculty = feedback.selectedTeachers && feedback.selectedTeachers.some(t => !departmentFacultyIds.includes(t.id));
        if (invalidFaculty) continue;

        validFeedbacks.push(feedback);
    }

    allFeedbacks = validFeedbacks;
    console.log('📊 Valid feedbacks after filtering:', allFeedbacks.length);

    const stats = {};

    allFeedbacks.forEach(feedback => {
        const dept = feedback.studentDepartment || feedback.department;

        if (!selectedDepartments.includes(dept)) {
            return;
        }

        const year = feedback.studentYear;

        if (!year || (year !== 1 && year !== 2 && year !== 3)) {
            console.warn('⚠️ Invalid year in feedback:', year, feedback);
            return;
        }

        const yearLabel = year === 1 ? '1st Year' : year === 2 ? '2nd Year' : '3rd Year';
        const key = `${dept}|${yearLabel}`;

        if (!stats[key]) {
            stats[key] = {
                department: dept,
                year: yearLabel,
                ratings: [],
                label: `${dept} - ${yearLabel}`
            };
        }

        if (feedback.responses && Array.isArray(feedback.responses)) {
            feedback.responses.forEach(response => {
                const rating = parseFloat(response.rating);
                if (!isNaN(rating) && rating >= 1 && rating <= 10) {
                    stats[key].ratings.push(rating);
                } else {
                    console.warn('⚠️ Invalid rating value:', response.rating);
                }
            });
        }
    });

    console.log('📊 Stats collected:', Object.keys(stats).length, 'department-year combinations');

    const labels = [];
    const averages = [];
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c', '#11998e',
        '#38ef7d', '#ffa502', '#ff6b35', '#004e89', '#1a7f64'
    ];

    const sortedKeys = Object.keys(stats).sort((a, b) => {
        const [deptA, yearA] = a.split('|');
        const [deptB, yearB] = b.split('|');

        if (deptA !== deptB) return deptA.localeCompare(deptB);

        const yearOrder = {
            '1st Year': 1,
            '2nd Year': 2,
            '3rd Year': 3
        };
        return yearOrder[yearA] - yearOrder[yearB];
    });

    sortedKeys.forEach((key, index) => {
        const stat = stats[key];
        const ratings = stat.ratings;

        if (ratings.length > 0) {
            const average = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2);
            labels.push(stat.label);
            averages.push(parseFloat(average));
            console.log(`  ✅ ${stat.label}: ${average} (from ${ratings.length} ratings)`);
        }
    });

    console.log('📊 Final Chart data - Labels:', labels);
    console.log('📊 Final Chart data - Averages:', averages);

    return {
        labels: labels,
        data: averages,
        colors: colors.slice(0, labels.length)
    };
}

// Continue in next message due to length...