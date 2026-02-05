// Manage Faculties Functionality

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
    console.log('🔄 Initializing Manage Faculties...');

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
        // User will be redirected
    } else {
        console.log('✅ Authenticated as:', currentUser.email);
        initializeManageFaculties();
    }
})();

async function initializeManageFaculties() {
    console.log('🚀 Starting initialization...');
    await loadDepartments();
    setupModalHandlers();
    console.log('✅ Initialization complete');
}

function setupModalHandlers() {
    // Close modal when clicking outside
    const modal = document.getElementById('createDeptModal');
    window.onclick = function(event) {
        if (event.target == modal) {
            closeCreateDeptModal();
        }
    };
}

function openCreateDeptModal() {
    document.getElementById('createDeptModal').style.display = 'block';
    document.getElementById('deptName').focus();
}

function closeCreateDeptModal() {
    document.getElementById('createDeptModal').style.display = 'none';
    document.getElementById('createDeptForm').reset();
}

async function submitCreateDept(event) {
    event.preventDefault();

    const deptNameInput = document.getElementById('deptName');
    const deptFullNameInput = document.getElementById('deptFullName');
    const deptName = deptNameInput.value.trim();
    const deptFullName = deptFullNameInput.value.trim();
    const editingId = document.getElementById('createDeptForm').dataset.editingId;

    // Clear previous errors
    clearFieldErrors();

    // Validation
    const errors = {};

    if (!deptName) {
        errors.deptName = '❌ Department name is required';
    } else if (deptName.length < 2) {
        errors.deptName = '❌ Department name must be at least 2 characters';
    } else if (deptName.length > 50) {
        errors.deptName = '❌ Department name must not exceed 50 characters';
    } else if (!/^[a-zA-Z0-9\s\-]+$/.test(deptName)) {
        errors.deptName = '❌ Department name can only contain letters, numbers, spaces, and hyphens';
    }

    if (deptFullName && deptFullName.length > 100) {
        errors.deptFullName = '❌ Full name must not exceed 100 characters';
    }

    // Check if department already exists (only if not editing)
    if (!editingId) {
        const existingDept = await Storage.getDepartmentByName(deptName);
        if (existingDept) {
            errors.deptName = '❌ Department already exists!';
        }
    }

    // Display errors if any
    if (Object.keys(errors).length > 0) {
        displayFieldErrors(errors);
        showAlert('Please fix the errors below', 'danger');
        return;
    }

    if (editingId) {
        // Update existing department
        const department = await Storage.getDepartmentById(editingId);
        if (department) {
            department.name = deptName;
            department.fullName = deptFullName || deptName;
            await Storage.saveDepartment(department);
            showAlert(`✅ Department "${deptName}" updated successfully!`, 'success');
        }
    } else {
        // Create new department
        const newDept = {
            id: Storage.generateId(),
            name: deptName,
            fullName: deptFullName || deptName,
            faculties: []
        };

        await Storage.saveDepartment(newDept);
        showAlert(`✅ Department "${deptName}" created successfully!`, 'success');
    }

    // Close modal and reload
    closeCreateDeptModal();
    await loadDepartments();
}

function clearFieldErrors() {
    document.querySelectorAll('.field-error-message').forEach(el => el.remove());
    document.querySelectorAll('.form-group input').forEach(el => el.style.borderColor = '');
}

function displayFieldErrors(errors) {
    Object.keys(errors).forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = '#dc3545';
            const errorMsg = document.createElement('div');
            errorMsg.className = 'field-error-message';
            errorMsg.textContent = errors[fieldId];
            errorMsg.style.color = '#dc3545';
            errorMsg.style.fontSize = '12px';
            errorMsg.style.marginTop = '5px';
            errorMsg.style.display = 'block';
            field.parentNode.appendChild(errorMsg);
        }
    });
}

async function loadDepartments() {
    const departments = await Storage.getDepartments();
    const container = document.getElementById('departmentsContainer');

    if (departments.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1; padding: 40px;">No departments available. Click "Create New Department" to add one.</p>';
        return;
    }

    container.innerHTML = '';

    departments.forEach(department => {
        const card = createDepartmentCard(department);
        container.appendChild(card);
    });
}

function createDepartmentCard(department) {
    const card = document.createElement('div');
    card.className = 'department-card';
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', `${department.name} department with ${department.faculties ? department.faculties.length : 0} faculties`);

    const header = document.createElement('div');
    header.className = 'department-header';
    header.innerHTML = `
        <div class="department-info">
            <h2 class="department-name">${department.name}</h2>
            <p>${department.fullName}</p>
        </div>
        <div style="display: flex; gap: 8px;">
            <button class="btn-edit" onclick="editDepartment('${department.id}', '${department.name}', '${department.fullName}')" title="Edit Department" aria-label="Edit ${department.name} department">✏️</button>
            <button class="btn-remove" onclick="deleteDepartment('${department.id}', '${department.name}')" title="Delete Department" aria-label="Delete ${department.name} department">🗑️</button>
        </div>
    `;

    card.appendChild(header);

    // Faculty list
    const facultyList = document.createElement('div');
    facultyList.className = 'faculty-list';
    facultyList.setAttribute('role', 'list');
    facultyList.setAttribute('aria-label', `Faculties in ${department.name} department`);

    if (!department.faculties || department.faculties.length === 0) {
        facultyList.innerHTML = '<div class="empty-faculty" role="status" aria-live="polite">📭 No faculties added yet</div>';
    } else {
        department.faculties.forEach((faculty, index) => {
            const item = document.createElement('div');
            item.className = 'faculty-item';
            item.setAttribute('role', 'listitem');
            item.setAttribute('aria-label', `Faculty ${index + 1}: ${faculty.name}`);
            item.innerHTML = `
                <div class="faculty-info">
                    <div class="faculty-name">👨‍🏫 ${faculty.name}</div>
                </div>
                <div class="faculty-actions">
                    <button class="btn-remove" onclick="removeFaculty('${department.id}', '${faculty.id}')" aria-label="Remove ${faculty.name} from ${department.name}">Delete</button>
                </div>
            `;
            facultyList.appendChild(item);
        });
    }

    card.appendChild(facultyList);

    // Add faculty form
    const form = document.createElement('div');
    form.className = 'add-faculty-form';
    form.setAttribute('role', 'region');
    form.setAttribute('aria-label', `Add faculty to ${department.name} department`);
    form.innerHTML = `
        <div class="form-row">
            <input type="text" id="facultyName-${department.id}" placeholder="👨‍🏫 Faculty Name" aria-label="Faculty name input for ${department.name}" aria-describedby="facultyNameHelp-${department.id}" />
            <span id="facultyNameHelp-${department.id}" class="sr-only">Enter the name of the faculty member to add to this department</span>
            <button class="btn-add-faculty" onclick="addFacultyToDept('${department.id}')" aria-label="Add faculty to ${department.name} department">Add Faculty</button>
        </div>
    `;

    card.appendChild(form);

    return card;
}

async function addFacultyToDept(departmentId) {
    const nameInput = document.getElementById(`facultyName-${departmentId}`);
    const name = nameInput.value.trim();

    // Validation
    if (!name) {
        showAlert('❌ Please enter faculty name', 'danger');
        nameInput.style.borderColor = '#dc3545';
        return;
    }

    if (name.length < 2) {
        showAlert('❌ Faculty name must be at least 2 characters', 'danger');
        nameInput.style.borderColor = '#dc3545';
        return;
    }

    if (name.length > 100) {
        showAlert('❌ Faculty name must not exceed 100 characters', 'danger');
        nameInput.style.borderColor = '#dc3545';
        return;
    }

    if (!/^[a-zA-Z\s\.\-']+$/.test(name)) {
        showAlert('❌ Faculty name can only contain letters, spaces, dots, hyphens, and apostrophes', 'danger');
        nameInput.style.borderColor = '#dc3545';
        return;
    }

    // Check for duplicate faculty in this department
    const department = await Storage.getDepartmentById(departmentId);
    if (department && department.faculties) {
        const isDuplicate = department.faculties.some(f => f.name.toLowerCase() === name.toLowerCase());
        if (isDuplicate) {
            showAlert('❌ This faculty already exists in this department', 'danger');
            nameInput.style.borderColor = '#dc3545';
            return;
        }
    }

    const faculty = {
        id: Storage.generateId(),
        name: name
    };

    await Storage.addFacultyToDepartment(departmentId, faculty);

    // Clear inputs and reset style
    nameInput.value = '';
    nameInput.style.borderColor = '';

    // Reload departments
    await loadDepartments();

    showAlert(`✅ Faculty "${name}" added successfully!`, 'success');
}

async function removeFaculty(departmentId, facultyId) {
    const confirmed = await showConfirmDialog(
        'Remove Faculty',
        'Are you sure you want to remove this faculty?',
        'Remove',
        'Cancel'
    );

    if (confirmed) {
        await Storage.removeFacultyFromDepartment(departmentId, facultyId);
        await loadDepartments();
        showAlert('Faculty removed successfully!', 'success');
    }
}

async function deleteDepartment(departmentId, deptName) {
    const confirmed = await showConfirmDialog(
        'Delete Department',
        `Are you sure you want to delete the "${deptName}" department? All faculties in this department will also be deleted.`,
        'Delete',
        'Cancel'
    );

    if (confirmed) {
        await Storage.deleteDepartment(departmentId);
        await loadDepartments();
        showAlert(`Department "${deptName}" deleted successfully!`, 'success');
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


// Edit Department Function
function editDepartment(departmentId, deptName, deptFullName) {
    // Pre-fill the form with current values
    document.getElementById('deptName').value = deptName;
    document.getElementById('deptFullName').value = deptFullName;

    // Store the department ID for update
    document.getElementById('createDeptForm').dataset.editingId = departmentId;

    // Change button text and form title
    const formTitle = document.querySelector('#createDeptModal .modal-header h2');
    formTitle.textContent = '✏️ Edit Department';

    const submitBtn = document.querySelector('#createDeptForm .btn-submit');
    submitBtn.textContent = 'Update Department';

    // Open modal
    openCreateDeptModal();
}

// Override closeCreateDeptModal to reset form state
const originalCloseCreateDeptModal = closeCreateDeptModal;
closeCreateDeptModal = function() {
    // Reset form title and button
    const formTitle = document.querySelector('#createDeptModal .modal-header h2');
    formTitle.textContent = '➕ Create New Department';

    const submitBtn = document.querySelector('#createDeptForm .btn-submit');
    submitBtn.textContent = 'Create Department';

    // Clear editing ID
    delete document.getElementById('createDeptForm').dataset.editingId;

    // Call original function
    originalCloseCreateDeptModal();
};