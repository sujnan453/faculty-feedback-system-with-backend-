// Visualization Functionality

let selectedDepartments = [];
let chartInstance = null;
let currentReportData = null; // Store report data for export

// Wait for DOM and Storage to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Storage to be available
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
    // Load available departments into dropdown
    await loadAvailableDepartmentsDropdown();

    // Load departments for faculty report filter
    await loadReportDepartmentFilter();

    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            await loadAvailableDepartmentsDropdown();
            await loadReportDepartmentFilter();
        }
    });
}

async function loadReportDepartmentFilter() {
    try {
        console.log('🔍 loadReportDepartmentFilter called');
        console.log('🔍 Storage object:', window.Storage);

        const departments = await Storage.getDepartments();
        console.log('✅ Report filter - Departments loaded:', departments.length);
        console.log('✅ Report filter - Department names:', departments.map(d => d.name));

        const dropdown = document.getElementById('reportDepartmentFilter');
        console.log('🔍 Report dropdown element:', dropdown);

        if (!dropdown) {
            console.error('❌ Report dropdown not found!');
            return;
        }

        // Clear existing options except "All Departments"
        dropdown.innerHTML = '<option value="">All Departments</option>';

        // Add all departments
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.name;
            option.textContent = dept.name;
            dropdown.appendChild(option);
            console.log('  ➕ Report filter added:', dept.name);
        });

        console.log('✅ Report dropdown populated successfully');
    } catch (error) {
        console.error('❌ Error loading report department filter:', error);
        console.error('❌ Error stack:', error.stack);
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

        // Clear existing options
        dropdown.innerHTML = '<option value="">-- All Departments --</option>';

        // Add all departments to dropdown
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
        // "All Departments" selected
        const allDepts = await Storage.getDepartments();
        selectedDepartments = allDepts.map(d => d.name);
        updateSelectedDisplay();
        updateButtonStates();
        showAlert('All departments selected!', 'success');
        return;
    }

    // Set selected department (single selection)
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

    // VALIDATION: Filter out orphaned feedbacks
    const validFeedbacks = [];
    for (const feedback of allFeedbacks) {
        // Check if survey exists
        const survey = await Storage.getSurveyById(feedback.surveyId);
        if (!survey) continue;

        // Check if department exists
        const department = await Storage.getDepartmentByName(feedback.studentDepartment);
        if (!department) continue;

        // Check if all faculty members still exist
        const departmentFacultyIds = (department.faculties || []).map(f => f.id);
        const invalidFaculty = feedback.selectedTeachers && feedback.selectedTeachers.some(t => !departmentFacultyIds.includes(t.id));
        if (invalidFaculty) continue;

        validFeedbacks.push(feedback);
    }

    allFeedbacks = validFeedbacks;
    console.log('📊 Valid feedbacks after filtering:', allFeedbacks.length);

    // CRITICAL: Only collect data that actually exists - don't pre-initialize empty arrays
    const stats = {};

    // Process feedbacks and ONLY create entries for data that exists
    allFeedbacks.forEach(feedback => {
        const dept = feedback.studentDepartment || feedback.department;

        // Skip if not in selected departments
        if (!selectedDepartments.includes(dept)) {
            return;
        }

        const year = feedback.studentYear;

        // Validate year is a valid number
        if (!year || (year !== 1 && year !== 2 && year !== 3)) {
            console.warn('⚠️ Invalid year in feedback:', year, feedback);
            return;
        }

        const yearLabel = year === 1 ? '1st Year' : year === 2 ? '2nd Year' : '3rd Year';
        const key = `${dept}|${yearLabel}`; // Unique key for dept+year combination

        // Initialize only when we have actual data
        if (!stats[key]) {
            stats[key] = {
                department: dept,
                year: yearLabel,
                ratings: [],
                label: `${dept} - ${yearLabel}`
            };
        }

        // Add ratings from responses
        if (feedback.responses && Array.isArray(feedback.responses)) {
            feedback.responses.forEach(response => {
                const rating = parseFloat(response.rating);
                // Only add valid ratings (1-10)
                if (!isNaN(rating) && rating >= 1 && rating <= 10) {
                    stats[key].ratings.push(rating);
                } else {
                    console.warn('⚠️ Invalid rating value:', response.rating);
                }
            });
        }
    });

    console.log('📊 Stats collected:', Object.keys(stats).length, 'department-year combinations');

    // Calculate averages ONLY for entries with data
    const labels = [];
    const averages = [];
    const colors = [
        '#667eea',
        '#764ba2',
        '#f093fb',
        '#f5576c',
        '#11998e',
        '#38ef7d',
        '#ffa502',
        '#ff6b35',
        '#004e89',
        '#1a7f64'
    ];

    // Sort by department then year for consistent display
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

async function createPieChart() {
    if (selectedDepartments.length === 0) {
        showAlert('Please select at least one department', 'warning');
        return;
    }

    showLoadingSpinner();

    const stats = await calculateDepartmentYearStats();

    if (stats.labels.length === 0) {
        document.getElementById('loadingSpinner').classList.remove('show');
        document.getElementById('chartContainer').classList.remove('show');
        document.getElementById('statsSummary').classList.remove('show');
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('emptyState').innerHTML = `
            <span>📭</span>
            <h3>No Feedback Data Available</h3>
            <p>No feedback has been submitted for the selected department(s): <strong>${selectedDepartments.join(', ')}</strong></p>
            <p style="margin-top: 10px; color: #7c3aed;">Students need to submit surveys before charts can be generated.</p>
        `;
        showAlert('No feedback data available for selected departments', 'warning');
        return;
    }

    // Destroy previous chart if exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    setTimeout(() => {
        const ctx = document.getElementById('myChart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: stats.labels,
                datasets: [{
                    data: stats.data,
                    backgroundColor: stats.colors,
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 13,
                                weight: '600'
                            },
                            padding: 15,
                            color: '#333'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + ' / 10';
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: selectedDepartments.length === Storage.getDepartments().length ?
                            'Average Ratings - All Departments' : 'Average Ratings by Department & Year',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#333',
                        padding: 20
                    }
                }
            }
        });

        hideLoadingSpinner();
        displayStatistics(stats.data);
        enableExportBtn();
        showAlert('Pie chart created successfully!', 'success');
    }, 500);
}

async function createHistogram() {
    if (selectedDepartments.length === 0) {
        showAlert('Please select at least one department', 'warning');
        return;
    }

    showLoadingSpinner();

    const stats = await calculateDepartmentYearStats();

    if (stats.labels.length === 0) {
        document.getElementById('loadingSpinner').classList.remove('show');
        document.getElementById('chartContainer').classList.remove('show');
        document.getElementById('statsSummary').classList.remove('show');
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('emptyState').innerHTML = `
            <span>📭</span>
            <h3>No Feedback Data Available</h3>
            <p>No feedback has been submitted for the selected department(s): <strong>${selectedDepartments.join(', ')}</strong></p>
            <p style="margin-top: 10px; color: #7c3aed;">Students need to submit surveys before charts can be generated.</p>
        `;
        showAlert('No feedback data available for selected departments', 'warning');
        return;
    }

    // Destroy previous chart if exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    setTimeout(() => {
        const ctx = document.getElementById('myChart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stats.labels,
                datasets: [{
                    label: 'Average Rating (out of 10)',
                    data: stats.data,
                    backgroundColor: stats.colors,
                    borderColor: stats.colors.map(c => c.replace(')', ', 0.8)')),
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: {
                                size: 13,
                                weight: '600'
                            },
                            color: '#333'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Average: ' + context.parsed.x + ' / 10';
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: selectedDepartments.length === Storage.getDepartments().length ?
                            'Average Ratings - All Departments' : 'Average Ratings by Department & Year',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#333',
                        padding: 20
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            color: '#666',
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#333',
                            font: {
                                size: 12,
                                weight: '600'
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        hideLoadingSpinner();
        displayStatistics(stats.data);
        enableExportBtn();
        showAlert('Histogram created successfully!', 'success');
    }, 500);
}

function showChart() {
    document.getElementById('chartContainer').classList.add('show');
    document.getElementById('emptyState').style.display = 'none';
}

async function createLineChart() {
    if (selectedDepartments.length === 0) {
        showAlert('Please select at least one department', 'warning');
        return;
    }

    showLoadingSpinner();

    const stats = await calculateDepartmentYearStats();

    if (stats.labels.length === 0) {
        document.getElementById('loadingSpinner').classList.remove('show');
        document.getElementById('chartContainer').classList.remove('show');
        document.getElementById('statsSummary').classList.remove('show');
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('emptyState').innerHTML = `
            <span>📭</span>
            <h3>No Feedback Data Available</h3>
            <p>No feedback has been submitted for the selected department(s): <strong>${selectedDepartments.join(', ')}</strong></p>
            <p style="margin-top: 10px; color: #7c3aed;">Students need to submit surveys before charts can be generated.</p>
        `;
        showAlert('No feedback data available for selected departments', 'warning');
        return;
    }

    // Destroy previous chart if exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    setTimeout(() => {
        const ctx = document.getElementById('myChart').getContext('2d');

        // Create individual datasets for each department
        const departmentDatasets = {};
        const colorMap = {
            0: '#667eea',
            1: '#764ba2',
            2: '#f093fb',
            3: '#f5576c',
            4: '#11998e',
            5: '#38ef7d',
            6: '#ffa502',
            7: '#ff6b35',
            8: '#004e89',
            9: '#1a7f64'
        };

        // Group data by department
        stats.labels.forEach((label, index) => {
            const dept = label.split(' - ')[0];
            const year = label.split(' - ')[1];

            if (!departmentDatasets[dept]) {
                const colorIndex = Object.keys(departmentDatasets).length;
                departmentDatasets[dept] = {
                    label: dept,
                    data: [],
                    labels: [],
                    borderColor: colorMap[colorIndex] || '#667eea',
                    backgroundColor: (colorMap[colorIndex] || '#667eea').replace(')', ', 0.1)').replace('rgb', 'rgba'),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: colorMap[colorIndex] || '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8,
                    pointHoverBorderWidth: 3
                };
            }

            departmentDatasets[dept].labels.push(year);
            departmentDatasets[dept].data.push(stats.data[index]);
        });

        // Convert to array of datasets
        const datasets = Object.values(departmentDatasets);

        // Use the first department's labels as x-axis (or combine all unique years)
        const allYears = ['1st Year', '2nd Year', '3rd Year'];
        const xLabels = allYears.filter(year =>
            stats.labels.some(label => label.includes(year))
        );

        // Align data to x-axis labels
        datasets.forEach(dataset => {
            const alignedData = xLabels.map(year => {
                const index = dataset.labels.indexOf(year);
                return index >= 0 ? dataset.data[index] : null;
            });
            dataset.data = alignedData;
            delete dataset.labels; // Remove temporary labels property
        });

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: xLabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 13,
                                weight: '600'
                            },
                            color: '#333',
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                if (context.parsed.y === null) return null;
                                return context.dataset.label + ': ' + context.parsed.y + ' / 10';
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Average Ratings Trend by Department & Year',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#333',
                        padding: 20
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            color: '#666',
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: true
                        },
                        title: {
                            display: true,
                            text: 'Average Rating (out of 10)',
                            color: '#666',
                            font: {
                                size: 13,
                                weight: '600'
                            }
                        }
                    },
                    x: {
                        ticks: {
                            color: '#333',
                            font: {
                                size: 12,
                                weight: '600'
                            }
                        },
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Academic Year',
                            color: '#666',
                            font: {
                                size: 13,
                                weight: '600'
                            }
                        }
                    }
                }
            }
        });

        hideLoadingSpinner();
        displayStatistics(stats.data.filter(d => d !== null));
        enableExportBtn();
        showAlert('Line chart created successfully!', 'success');
    }, 500);
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

function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('show');
    document.getElementById('chartContainer').classList.remove('show');
    document.getElementById('statsSummary').classList.remove('show');
    document.getElementById('emptyState').style.display = 'none';
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('show');
    document.getElementById('chartContainer').classList.add('show');
}

function calculateStatistics(data) {
    if (!data || data.length === 0) {
        return {
            min: 0,
            max: 0,
            avg: 0,
            median: 0
        };
    }

    const sortedData = [...data].sort((a, b) => a - b);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const avg = (data.reduce((a, b) => a + parseFloat(b), 0) / data.length).toFixed(2);

    let median;
    const mid = Math.floor(sortedData.length / 2);
    if (sortedData.length % 2 !== 0) {
        median = sortedData[mid].toFixed(2);
    } else {
        median = ((parseFloat(sortedData[mid - 1]) + parseFloat(sortedData[mid])) / 2).toFixed(2);
    }

    return {
        min: min.toFixed(2),
        max: max.toFixed(2),
        avg: avg,
        median: median
    };
}

function displayStatistics(data) {
    const stats = calculateStatistics(data);

    document.getElementById('maxRating').textContent = stats.max;
    document.getElementById('minRating').textContent = stats.min;
    document.getElementById('avgRating').textContent = stats.avg;
    document.getElementById('medianRating').textContent = stats.median;

    document.getElementById('statsSummary').classList.add('show');
}

function exportChart() {
    if (!chartInstance) {
        showAlert('No chart to export. Please create a chart first.', 'warning');
        return;
    }

    // Get the canvas and convert to image
    const canvas = document.getElementById('myChart');
    const image = canvas.toDataURL('image/png');

    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = image;
    link.download = `chart_${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('Chart exported successfully!', 'success');
}

function enableExportBtn() {
    document.getElementById('exportBtn').disabled = false;
}

// ===== Faculty Ratings by Year =====
async function displayFacultyRatingsByYear() {
    const allFeedbacks = await Storage.getFeedbacks();
    const container = document.getElementById('facultyRatingsContainer');

    // Get filter values (NO YEAR FILTER)
    const deptFilter = (document.getElementById('reportDepartmentFilter') || {}).value || '';
    const sortOrder = (document.getElementById('reportSortOrder') || {}).value || 'highest';

    console.log(`📊 Generating report - Dept: "${deptFilter || 'All'}", Sort: ${sortOrder}`);
    console.log(`📊 Total feedbacks in database: ${allFeedbacks.length}`);

    if (allFeedbacks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(248, 249, 255, 0.3) 100%); border-radius: 12px; border: 2px dashed #e0e0e0;">
                <span style="font-size: 64px; display: block; margin-bottom: 20px;">📭</span>
                <h3 style="color: #1a202c; margin: 0 0 10px 0; font-size: 20px; font-weight: 700;">No Data Available</h3>
                <p style="color: #718096; margin: 0; font-size: 14px;">No feedback data available. Students need to submit surveys to generate reports.</p>
            </div>
        `;
        return;
    }

    // Organize data by department, then faculty and year
    const departmentData = {};

    allFeedbacks.forEach(feedback => {
        if (feedback.responses && Array.isArray(feedback.responses)) {
            feedback.responses.forEach(response => {
                const facultyId = response.teacherId || 'unknown';
                const facultyName = response.teacherName || 'Unknown Faculty';
                const year = String(feedback.studentYear || '1');
                const department = feedback.studentDepartment || feedback.department || 'Unknown';
                const rating = parseFloat(response.rating);

                // CRITICAL: Apply department filter HERE
                if (deptFilter && department !== deptFilter) {
                    return; // Skip if not matching selected department
                }

                if (isNaN(rating) || rating < 1 || rating > 10) return;

                if (!departmentData[department]) departmentData[department] = {};

                if (!departmentData[department][facultyId]) {
                    departmentData[department][facultyId] = {
                        name: facultyName,
                        id: facultyId,
                        '1': {
                            ratings: [],
                            count: 0
                        },
                        '2': {
                            ratings: [],
                            count: 0
                        },
                        '3': {
                            ratings: [],
                            count: 0
                        },
                        combined: {
                            ratings: [],
                            count: 0
                        }
                    };
                }

                if (departmentData[department][facultyId][year]) {
                    departmentData[department][facultyId][year].ratings.push(rating);
                    departmentData[department][facultyId][year].count++;
                    departmentData[department][facultyId].combined.ratings.push(rating);
                    departmentData[department][facultyId].combined.count++;
                }
            });
        }
    });

    console.log(`📊 Departments with data: ${Object.keys(departmentData).length}`);
    console.log(`📊 Department names:`, Object.keys(departmentData));

    container.innerHTML = '';

    if (Object.keys(departmentData).length === 0) {
        const filterMsg = deptFilter ? ` for ${deptFilter}` : '';
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(248, 249, 255, 0.3) 100%); border-radius: 12px; border: 2px dashed #e0e0e0;">
                <span style="font-size: 64px; display: block; margin-bottom: 20px;">📭</span>
                <h3 style="color: #1a202c; margin: 0 0 10px 0; font-size: 20px; font-weight: 700;">No Faculty Data</h3>
                <p style="color: #718096; margin: 0; font-size: 14px;">No faculty ratings available${filterMsg}.</p>
                <p style="color: #7c3aed; margin: 10px 0 0 0; font-size: 13px;">Try selecting a different department.</p>
            </div>
        `;
        return;
    }

    // Store data for export
    currentReportData = [];

    // Create sections for each department
    Object.keys(departmentData).sort().forEach((department, deptIndex) => {
        const facultyInDept = departmentData[department];

        // Convert to array and sort
        let facultyArray = Object.values(facultyInDept);

        if (sortOrder === 'highest') {
            facultyArray.sort((a, b) => {
                const avgA = a.combined.count > 0 ? a.combined.ratings.reduce((s, r) => s + r, 0) / a.combined.count : 0;
                const avgB = b.combined.count > 0 ? b.combined.ratings.reduce((s, r) => s + r, 0) / b.combined.count : 0;
                return avgB - avgA;
            });
        } else if (sortOrder === 'lowest') {
            facultyArray.sort((a, b) => {
                const avgA = a.combined.count > 0 ? a.combined.ratings.reduce((s, r) => s + r, 0) / a.combined.count : 0;
                const avgB = b.combined.count > 0 ? b.combined.ratings.reduce((s, r) => s + r, 0) / b.combined.count : 0;
                return avgA - avgB;
            });
        } else {
            facultyArray.sort((a, b) => a.name.localeCompare(b.name));
        }

        const totalFaculty = facultyArray.length;
        const avgDeptRating = facultyArray.reduce((sum, f) => {
            if (f.combined.count > 0) {
                return sum + (f.combined.ratings.reduce((s, r) => s + r, 0) / f.combined.count);
            }
            return sum;
        }, 0) / totalFaculty;

        // Department header
        const deptHeader = document.createElement('div');
        deptHeader.style.cssText = `margin-top: ${deptIndex === 0 ? '0' : '40px'}; margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.2);`;
        deptHeader.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;">📚</span>${department} Department
                    </h3>
                    <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.9;">${totalFaculty} ${totalFaculty === 1 ? 'Faculty' : 'Faculties'} • Dept Avg: ${avgDeptRating.toFixed(2)}/10</p>
                </div>
                <div style="background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700;">${avgDeptRating.toFixed(1)}</div>
                    <div style="font-size: 11px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Avg Rating</div>
                </div>
            </div>
        `;
        container.appendChild(deptHeader);

        // Table
        const table = document.createElement('div');
        table.style.cssText = 'overflow-x: auto; margin-bottom: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);';

        let html = `<table style="width: 100%; border-collapse: collapse; background: white;"><thead><tr style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(109, 40, 217, 0.05) 100%); border-bottom: 2px solid #7c3aed;">
            <th style="padding: 16px 20px; text-align: left; font-weight: 700; color: #1a202c; font-size: 14px; text-transform: uppercase;">Rank</th>
            <th style="padding: 16px 20px; text-align: left; font-weight: 700; color: #1a202c; font-size: 14px; text-transform: uppercase;">Faculty Name</th>
            <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #1a202c; font-size: 14px; text-transform: uppercase;">1st Year</th>
            <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #1a202c; font-size: 14px; text-transform: uppercase;">2nd Year</th>
            <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #1a202c; font-size: 14px; text-transform: uppercase;">3rd Year</th>
            <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #1a202c; font-size: 14px; text-transform: uppercase;">Overall</th>
            <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #1a202c; font-size: 14px; text-transform: uppercase;">Total</th>
        </tr></thead><tbody>`;

        facultyArray.forEach((faculty, index) => {
            const y1 = faculty['1'].count > 0 ? (faculty['1'].ratings.reduce((a, b) => a + b, 0) / faculty['1'].count).toFixed(2) : '-';
            const y2 = faculty['2'].count > 0 ? (faculty['2'].ratings.reduce((a, b) => a + b, 0) / faculty['2'].count).toFixed(2) : '-';
            const y3 = faculty['3'].count > 0 ? (faculty['3'].ratings.reduce((a, b) => a + b, 0) / faculty['3'].count).toFixed(2) : '-';
            const avg = faculty.combined.count > 0 ? (faculty.combined.ratings.reduce((a, b) => a + b, 0) / faculty.combined.count).toFixed(2) : '-';

            // Store for export (always use numeric rank for CSV compatibility)
            const numericRank = sortOrder !== 'name' ? index + 1 : '-';
            currentReportData.push({
                department: department,
                rank: numericRank,
                name: faculty.name,
                year1: y1,
                year2: y2,
                year3: y3,
                overall: avg,
                total: faculty.combined.count
            });

            const bg = index % 2 === 0 ? '#ffffff' : '#f8f9ff';
            // Display rank with medals for top 3 in HTML only
            const rank = sortOrder === 'highest' && index < 3 && avg !== '-' ? ['🥇', '🥈', '🥉'][index] : numericRank;

            const getColor = (r) => r === '-' ? '#999' : parseFloat(r) >= 7 ? '#059669' : parseFloat(r) >= 5 ? '#d97706' : '#dc2626';
            const getBg = (r) => r === '-' ? 'rgba(200,200,200,0.1)' : parseFloat(r) >= 7 ? 'rgba(5,150,105,0.1)' : parseFloat(r) >= 5 ? 'rgba(217,119,6,0.1)' : 'rgba(220,38,38,0.1)';

            html += `<tr style="background: ${bg}; border-bottom: 1px solid #e8e8e8;" onmouseover="this.style.background='rgba(124,58,237,0.05)';" onmouseout="this.style.background='${bg}';">
                <td style="padding: 16px 20px; text-align: center; font-weight: 700; color: #7c3aed; font-size: 16px;">${rank}</td>
                <td style="padding: 16px 20px; font-weight: 600; color: #1a202c;">👨‍🏫 ${faculty.name}</td>
                <td style="padding: 16px 12px; text-align: center;"><span style="background: ${getBg(y1)}; color: ${getColor(y1)}; padding: 8px 12px; border-radius: 6px; font-weight: 700; font-size: 13px; min-width: 60px; display: inline-block;">${y1 === '-' ? '-' : y1 + '/10'}</span></td>
                <td style="padding: 16px 12px; text-align: center;"><span style="background: ${getBg(y2)}; color: ${getColor(y2)}; padding: 8px 12px; border-radius: 6px; font-weight: 700; font-size: 13px; min-width: 60px; display: inline-block;">${y2 === '-' ? '-' : y2 + '/10'}</span></td>
                <td style="padding: 16px 12px; text-align: center;"><span style="background: ${getBg(y3)}; color: ${getColor(y3)}; padding: 8px 12px; border-radius: 6px; font-weight: 700; font-size: 13px; min-width: 60px; display: inline-block;">${y3 === '-' ? '-' : y3 + '/10'}</span></td>
                <td style="padding: 16px 12px; text-align: center;"><span style="background: linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(109,40,217,0.1) 100%); color: #7c3aed; padding: 10px 16px; border-radius: 8px; font-weight: 700; font-size: 15px; min-width: 70px; border: 2px solid #7c3aed; display: inline-block;">${avg === '-' ? '-' : avg + '/10'}</span></td>
                <td style="padding: 16px 12px; text-align: center; font-weight: 600; color: #666;">${faculty.combined.count}</td>
            </tr>`;
        });

        html += `</tbody></table>`;
        table.innerHTML = html;
        container.appendChild(table);
    });

    // Enable export buttons
    document.getElementById('exportCSVBtn').disabled = false;
    document.getElementById('exportPDFBtn').disabled = false;

    const filterText = deptFilter ? ` (${deptFilter})` : '';
    showAlert(`Report generated!${filterText}`, 'success');
}


// Export Functions for Faculty Report
function exportReportCSV() {
    if (!currentReportData || currentReportData.length === 0) {
        showAlert('No report data to export. Generate a report first.', 'warning');
        return;
    }

    const deptFilter = (document.getElementById('reportDepartmentFilter') || {}).value || 'All';
    const sortOrder = (document.getElementById('reportSortOrder') || {}).value || 'highest';

    let csv = 'Faculty Ratings Report\n';
    csv += `Department Filter: ${deptFilter}\n`;
    csv += `Sort Order: ${sortOrder}\n\n`;
    csv += 'Department,Rank,Faculty Name,1st Year,2nd Year,3rd Year,Overall Average,Total Responses\n';

    currentReportData.forEach(row => {
        csv += `"${row.department}",${row.rank},"${row.name}",${row.year1},${row.year2},${row.year3},${row.overall},${row.total}\n`;
    });

    const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `faculty_ratings_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('CSV exported successfully!', 'success');
}

function exportReportPDF() {
    if (!currentReportData || currentReportData.length === 0) {
        showAlert('No report data to export. Generate a report first.', 'warning');
        return;
    }

    const deptFilter = (document.getElementById('reportDepartmentFilter') || {}).value || 'All Departments';
    const sortOrder = (document.getElementById('reportSortOrder') || {}).value || 'highest';

    const printWindow = window.open('', '', 'height=800,width=1000');

    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Faculty Ratings Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; }
                .info { margin: 20px 0; padding: 15px; background: #f8f9ff; border-left: 4px solid #7c3aed; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #7c3aed; color: white; padding: 12px; text-align: left; font-weight: bold; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                tr:nth-child(even) { background: #f8f9ff; }
                .rank { font-weight: bold; color: #7c3aed; text-align: center; }
                .rating { text-align: center; font-weight: bold; }
                .high { color: #059669; }
                .medium { color: #d97706; }
                .low { color: #dc2626; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>📊 Faculty Ratings Report</h1>
            <div class="info">
                <strong>Department Filter:</strong> ${deptFilter}<br>
                <strong>Sort Order:</strong> ${sortOrder === 'highest' ? 'Highest Rating First' : sortOrder === 'lowest' ? 'Lowest Rating First' : 'Faculty Name (A-Z)'}<br>
                <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
                <strong>Total Faculty:</strong> ${currentReportData.length}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Department</th>
                        <th style="text-align: center;">Rank</th>
                        <th>Faculty Name</th>
                        <th style="text-align: center;">1st Year</th>
                        <th style="text-align: center;">2nd Year</th>
                        <th style="text-align: center;">3rd Year</th>
                        <th style="text-align: center;">Overall</th>
                        <th style="text-align: center;">Responses</th>
                    </tr>
                </thead>
                <tbody>
    `;

    currentReportData.forEach((row, index) => {
        const getRatingClass = (rating) => {
            if (rating === '-') return '';
            const val = parseFloat(rating);
            if (val >= 7) return 'high';
            if (val >= 5) return 'medium';
            return 'low';
        };

        // For PDF: Use text labels for top 3 instead of emojis
        let displayRank = row.rank;
        if (sortOrder === 'highest' && row.rank !== '-' && row.rank <= 3) {
            displayRank = ['1st', '2nd', '3rd'][row.rank - 1];
        }

        html += `
            <tr>
                <td>${row.department}</td>
                <td class="rank">${displayRank}</td>
                <td>${row.name}</td>
                <td class="rating ${getRatingClass(row.year1)}">${row.year1}</td>
                <td class="rating ${getRatingClass(row.year2)}">${row.year2}</td>
                <td class="rating ${getRatingClass(row.year3)}">${row.year3}</td>
                <td class="rating ${getRatingClass(row.overall)}">${row.overall}</td>
                <td style="text-align: center;">${row.total}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()" style="background: #7c3aed; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;">🖨️ Print / Save as PDF</button>
                <button onclick="window.close()" style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; margin-left: 10px;">✕ Close</button>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    showAlert('PDF preview opened. Use Print to save as PDF.', 'success');
}