console.log('Clear Duplicates Loading');
let currentUser = null;
let duplicatesMap = new Map();

function waitForModules() {
    return new Promise((resolve) => {
        let attempts = 0;
        const checkModules = () => {
            attempts++;
            if (typeof window.Storage !== 'undefined' && typeof window.checkAuth !== 'undefined') {
                console.log('Modules ready');
                resolve();
            } else if (attempts > 50) {
                console.error('Timeout');
                resolve();
            } else {
                setTimeout(checkModules, 100);
            }
        };
        checkModules();
    });
}

function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const tab = document.getElementById(tabName);
    if (tab) {
        tab.classList.add('active');
        console.log('Tab activated:', tabName);
    } else {
        console.error('Tab not found:', tabName);
    }
    const btn = document.querySelector(`[data-tab="${tabName}"]`);
    if (btn) {
        btn.classList.add('active');
        console.log('Button activated');
    } else {
        console.error('Button not found for tab:', tabName);
    }
}

async function refreshStatus() {
    try {
        const departments = await window.Storage.getDepartments();
        let totalFaculties = 0;
        const deptNames = new Map();
        departments.forEach(dept => {
            if (dept.faculties) totalFaculties += dept.faculties.length;
            const norm = normalizeName(dept.name);
            deptNames.set(norm, (deptNames.get(norm) || 0) + 1);
        });
        let duplicateCount = 0;
        deptNames.forEach(count => {
            if (count > 1) duplicateCount += (count - 1);
        });
        document.getElementById('statFaculties').textContent = totalFaculties;
        document.getElementById('statDepartments').textContent = departments.length;
        document.getElementById('statDuplicates').textContent = duplicateCount;
    } catch (error) {
        console.error('Error refreshing status:', error);
    }
}

function normalizeName(name) {
    return name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[()]/g, '').replace(/\./g, '').replace(/_/g, ' ');
}

function showStatusMessage(elementId, type, title, message) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.className = `status-box ${type}`;
    element.innerHTML = `<div class="status-title">${title}</div><div class="status-message">${message}</div>`;
}

async function autoCreateDepartments() {
    const btn = document.querySelector('button[onclick*="autoCreateDepartments"]');
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"><span class="spinner"></span><span>Creating...</span></span>';
        }
        const departments = await window.Storage.getDepartments();
        const departmentNames = new Set();
        departments.forEach(dept => {
            if (dept.faculties) dept.faculties.forEach(() => departmentNames.add(dept.name));
            if (dept.name) departmentNames.add(dept.name);
        });
        if (departmentNames.size === 0) {
            showStatusMessage('autoCreateStatus', 'warning', 'No Departments Found', 'No departments in system.');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span>Auto Create</span>';
            }
            return;
        }
        const existingDepts = await window.Storage.getDepartments();
        const existingNames = new Set(existingDepts.map(d => normalizeName(d.name)));
        let created = 0, skipped = 0;
        const createdDepts = [];
        for (const deptName of departmentNames) {
            if (existingNames.has(normalizeName(deptName))) {
                skipped++;
                continue;
            }
            try {
                let facultyCount = 0;
                departments.forEach(dept => {
                    if (dept.name === deptName && dept.faculties) facultyCount += dept.faculties.length;
                });
                const newDept = {
                    name: deptName,
                    fullName: deptName,
                    createdAt: new Date().toISOString(),
                    faculties: [],
                    facultyCount
                };
                await window.Storage.saveDepartment(newDept);
                created++;
                createdDepts.push(newDept);
            } catch (error) {
                console.error('Error creating dept:', error);
            }
        }
        showStatusMessage('autoCreateStatus', 'success', 'Complete', `Created ${created}, skipped ${skipped}`);
        if (createdDepts.length > 0) {
            const list = document.getElementById('createdDepts');
            let html = '';
            createdDepts.forEach(dept => {
                html += `<div class="dept-item"><div class="dept-info"><div class="dept-name">${dept.name}</div><div class="dept-details">Faculties: ${dept.facultyCount} | Created: ${new Date(dept.createdAt).toLocaleDateString()}</div></div><div class="dept-status unique"><span>Created</span></div></div>`;
            });
            list.innerHTML = html;
            document.getElementById('createdDeptsList').style.display = 'block';
        }
        await refreshStatus();
    } catch (error) {
        console.error('Error:', error);
        showStatusMessage('autoCreateStatus', 'error', 'Error', 'An error occurred');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>Auto Create</span>';
        }
    }
}

async function findDuplicates() {
    const btn = document.querySelector('button[onclick*="findDuplicates"]');
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"><span class="spinner"></span><span>Scanning...</span></span>';
        }
        console.log('Finding duplicates...');
        const departments = await window.Storage.getDepartments();
        console.log('Loaded departments:', departments.length);
        if (departments.length === 0) {
            showStatusMessage('duplicateStatus', 'warning', 'No Departments', 'No departments in system.');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span>Find Duplicates</span>';
            }
            return;
        }
        duplicatesMap.clear();
        const normMap = new Map();
        departments.forEach(dept => {
            const norm = normalizeName(dept.name);
            if (!normMap.has(norm)) normMap.set(norm, []);
            normMap.get(norm).push(dept);
        });
        const duplicates = [];
        normMap.forEach((group, norm) => {
            if (group.length > 1) {
                duplicates.push({ normalized: norm, departments: group });
                group.forEach(dept => duplicatesMap.set(dept.id, { group, normalized: norm }));
            }
        });
        console.log('Found duplicate groups:', duplicates.length);
        if (duplicates.length === 0) {
            showStatusMessage('duplicateStatus', 'success', 'No Duplicates', 'No duplicate departments found.');
            document.getElementById('duplicateList').style.display = 'none';
            document.getElementById('deleteBtn').style.display = 'none';
            document.getElementById('selectAllDeptsBtn').style.display = 'none';
        } else {
            showStatusMessage('duplicateStatus', 'warning', `Found ${duplicates.length} Duplicate Groups`, `${duplicates.length} duplicate groups found.`);
            const container = document.getElementById('duplicateList');
            let html = '';
            duplicates.forEach((group, index) => {
                html += `<div style="margin-bottom:25px;padding:15px;background:#fef2f2;border-radius:8px;border:2px solid #fecaca;"><h4 style="margin:0 0 15px 0;color:#991b1b;font-size:16px;">Duplicate Group ${index + 1}: "${group.normalized}"</h4><div style="display:flex;flex-direction:column;gap:10px;">`;
                group.departments.forEach((dept, deptIndex) => {
                    html += `<label style="display:flex;align-items:center;gap:12px;padding:10px;background:white;border-radius:6px;cursor:pointer;border:2px solid #e5e7eb;"><input type="checkbox" class="duplicate-checkbox" data-dept-id="${dept.id}" data-group-index="${index}" data-dept-index="${deptIndex}" style="width:18px;height:18px;cursor:pointer;"><div style="flex:1;"><div style="font-weight:600;color:#1a202c;">${dept.name}</div><div style="font-size:12px;color:#6b7280;">ID: ${dept.id} | ${dept.faculties ? dept.faculties.length : 0} Faculties</div></div></label>`;
                });
                html += `</div></div>`;
            });
            container.innerHTML = html;
            container.style.display = 'block';
            document.getElementById('selectAllDeptsBtn').style.display = 'flex';
            document.querySelectorAll('.duplicate-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', updateDeleteButtonState);
            });
            document.getElementById('deleteBtn').style.display = 'flex';
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>Find Duplicates</span>';
        }
    } catch (error) {
        console.error('Error finding duplicates:', error);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>Find Duplicates</span>';
        }
    }
}

function updateDeleteButtonState() {
    const count = document.querySelectorAll('.duplicate-checkbox:checked').length;
    const btn = document.getElementById('deleteBtn');
    btn.disabled = count === 0;
    btn.innerHTML = count > 0 ? `<span>Delete ${count} Department${count !== 1 ? 's' : ''}</span>` : '<span>Delete Selected</span>';
}

async function deleteDuplicates() {
    const selected = document.querySelectorAll('.duplicate-checkbox:checked');
    if (selected.length === 0) {
        alert('Please select departments to delete');
        return;
    }
    const ids = Array.from(selected).map(cb => cb.getAttribute('data-dept-id'));
    if (!confirm(`Delete ${ids.length} department${ids.length !== 1 ? 's' : ''}?`)) return;
    const btn = document.getElementById('deleteBtn');
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"><span class="spinner"></span><span>Deleting...</span></span>';
        }
        let deleted = 0;
        for (const id of ids) {
            try {
                await window.Storage.deleteDepartment(id);
                deleted++;
            } catch (error) {
                console.error('Error deleting:', error);
            }
        }
        showStatusMessage('duplicateStatus', 'success', 'Complete', `Deleted ${deleted} department${deleted !== 1 ? 's' : ''}.`);
        await findDuplicates();
    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>Delete Selected</span>';
        }
    }
}

function selectAllDuplicateDepts() {
    const checkboxes = document.querySelectorAll('.duplicate-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    updateDeleteButtonState();
    const btn = document.getElementById('selectAllDeptsBtn');
    btn.innerHTML = allChecked ? '<span>Select All</span>' : '<span>Deselect All</span>';
}

async function loadAllDepartments() {
    const btn = document.querySelector('button[onclick*="loadAllDepartments"]');
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"><span class="spinner"></span><span>Loading...</span></span>';
        }
        console.log('Loading all departments...');
        const departments = await window.Storage.getDepartments();
        console.log('Loaded departments:', departments.length);
        document.getElementById('totalDeptCount').textContent = departments.length;
        if (departments.length === 0) {
            document.getElementById('allDeptsList').innerHTML = '<div class="status-box warning"><div class="status-title">No Departments</div></div>';
        } else {
            const container = document.getElementById('allDeptsList');
            let html = '';
            departments.forEach(dept => {
                const date = dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : 'N/A';
                html += `<div class="dept-item"><div class="dept-info"><div class="dept-name">${dept.name}</div><div class="dept-details">ID: ${dept.id} | Faculties: ${dept.faculties ? dept.faculties.length : 0} | Created: ${date}</div></div><div class="dept-status unique"><span>Active</span></div></div>`;
            });
            container.innerHTML = html;
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>Reload</span>';
        }
    } catch (error) {
        console.error('Error loading departments:', error);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>Reload</span>';
        }
    }
}

async function findDuplicateQuestions() {
    const btn = document.querySelector('button[onclick*="findDuplicateQuestions"]');
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"><span class="spinner"></span><span>Scanning...</span></span>';
        }
        console.log('Finding duplicate questions...');
        const questions = await window.Storage.getQuestions();
        console.log('Loaded questions:', questions.length);
        document.getElementById('totalQuestionsCount').textContent = questions.length;
        if (questions.length === 0) {
            showStatusMessage('duplicateQuestionsStatus', 'warning', 'No Questions', 'No questions in system.');
            document.getElementById('duplicateQuestionsList').style.display = 'none';
            document.getElementById('deleteQuestionsBtn').style.display = 'none';
            document.getElementById('selectAllQuestionsBtn').style.display = 'none';
            document.getElementById('duplicateQuestionsCount').textContent = '0';
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span>Find Duplicates</span>';
            }
            return;
        }
        const normMap = new Map();
        questions.forEach(q => {
            const norm = q.text.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[?.!,;:]/g, '');
            if (!normMap.has(norm)) normMap.set(norm, []);
            normMap.get(norm).push(q);
        });
        const duplicates = [];
        let totalDups = 0;
        normMap.forEach((group, norm) => {
            if (group.length > 1) {
                duplicates.push({ normalized: norm, questions: group });
                totalDups += (group.length - 1);
            }
        });
        console.log('Found duplicate question groups:', duplicates.length);
        document.getElementById('duplicateQuestionsCount').textContent = totalDups;
        if (duplicates.length === 0) {
            showStatusMessage('duplicateQuestionsStatus', 'success', 'No Duplicates', 'No duplicate questions found.');
            document.getElementById('duplicateQuestionsList').style.display = 'none';
            document.getElementById('deleteQuestionsBtn').style.display = 'none';
            document.getElementById('selectAllQuestionsBtn').style.display = 'none';
        } else {
            showStatusMessage('duplicateQuestionsStatus', 'warning', `Found ${duplicates.length} Duplicate Groups`, `${duplicates.length} duplicate groups (${totalDups} total).`);
            const container = document.getElementById('duplicateQuestionsList');
            let html = '';
            duplicates.forEach((group, index) => {
                html += `<div style="margin-bottom:25px;padding:15px;background:#fef2f2;border-radius:8px;border:2px solid #fecaca;"><h4 style="margin:0 0 15px 0;color:#991b1b;font-size:16px;">Duplicate Group ${index + 1}</h4><div style="display:flex;flex-direction:column;gap:10px;">`;
                group.questions.forEach((q, qIndex) => {
                    const typeLabel = q.type === 'rating' ? 'Rating' : 'Text';
                    html += `<label style="display:flex;align-items:start;gap:12px;padding:12px;background:white;border-radius:6px;cursor:pointer;border:2px solid #e5e7eb;"><input type="checkbox" class="duplicate-question-checkbox" data-question-id="${q.id}" data-group-index="${index}" data-question-index="${qIndex}" style="width:18px;height:18px;cursor:pointer;margin-top:4px;flex-shrink:0;"><div style="flex:1;"><div style="font-weight:600;color:#1a202c;margin-bottom:6px;">${q.text}</div><div style="font-size:12px;color:#6b7280;">${typeLabel} | ID: ${q.id}</div></div></label>`;
                });
                html += `</div></div>`;
            });
            container.innerHTML = html;
            container.style.display = 'block';
            document.querySelectorAll('.duplicate-question-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', updateDeleteQuestionsButtonState);
            });
            document.getElementById('deleteQuestionsBtn').style.display = 'flex';
            document.getElementById('selectAllQuestionsBtn').style.display = 'flex';
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>Find Duplicates</span>';
        }
    } catch (error) {
        console.error('Error finding duplicate questions:', error);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>Find Duplicates</span>';
        }
    }
}

function updateDeleteQuestionsButtonState() {
    const count = document.querySelectorAll('.duplicate-question-checkbox:checked').length;
    const btn = document.getElementById('deleteQuestionsBtn');
    btn.disabled = count === 0;
    btn.innerHTML = count > 0 ? `<span>Delete ${count} Question${count !== 1 ? 's' : ''}</span>` : '<span>Delete Selected</span>';
}

async function deleteDuplicateQuestions() {
    const selected = document.querySelectorAll('.duplicate-question-checkbox:checked');
    if (selected.length === 0) {
        alert('Please select questions to delete');
        return;
    }
    const ids = Array.from(selected).map(cb => cb.getAttribute('data-question-id'));
    if (!confirm(`Delete ${ids.length} question${ids.length !== 1 ? 's' : ''}?`)) return;
    const btn = document.getElementById('deleteQuestionsBtn');
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"><span class="spinner"></span><span>Deleting...</span></span>';
        }
        let deleted = 0;
        for (const id of ids) {
            try {
                await window.Storage.deleteQuestion(id);
                deleted++;
            } catch (error) {
                console.error('Error deleting:', error);
            }
        }
        showStatusMessage('duplicateQuestionsStatus', 'success', 'Complete', `Deleted ${deleted} question${deleted !== 1 ? 's' : ''}.`);
        await findDuplicateQuestions();
    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>Delete Selected</span>';
        }
    }
}

function selectAllDuplicateQuestions() {
    const checkboxes = document.querySelectorAll('.duplicate-question-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    updateDeleteQuestionsButtonState();
    const btn = document.getElementById('selectAllQuestionsBtn');
    btn.innerHTML = allChecked ? '<span>Select All</span>' : '<span>Deselect All</span>';
}

window.autoCreateDepartments = autoCreateDepartments;
window.refreshStatus = refreshStatus;
window.findDuplicates = findDuplicates;
window.deleteDuplicates = deleteDuplicates;
window.selectAllDuplicateDepts = selectAllDuplicateDepts;
window.loadAllDepartments = loadAllDepartments;
window.findDuplicateQuestions = findDuplicateQuestions;
window.deleteDuplicateQuestions = deleteDuplicateQuestions;
window.selectAllDuplicateQuestions = selectAllDuplicateQuestions;
window.switchTab = switchTab;

console.log('All functions exported');

(async function() {
    console.log('Initializing');
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }
    await waitForModules();
    if (!window.Storage || !window.checkAuth) {
        console.error('Modules not available');
        return;
    }
    currentUser = await window.checkAuth('admin');
    if (!currentUser) {
        console.log('Not authenticated');
        return;
    }
    console.log('Authenticated:', currentUser.email);
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });
    const initialsEl = document.getElementById('userInitials');
    if (initialsEl && currentUser.name) {
        initialsEl.textContent = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    await refreshStatus();
    console.log('Init complete');
})();