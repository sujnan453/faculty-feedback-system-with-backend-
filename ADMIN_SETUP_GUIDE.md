# Admin Setup Guide - Department Management

## Quick Start: Setting Up Your System

### Step 1: Create Departments First ⚠️ IMPORTANT

Before students can register, you MUST create departments:

1. **Login as Admin**
   - Email: `superadmin@system.edu`
   - Password: `SuperAdmin2024!`

2. **Go to "Manage Faculties"**
   - Click on "Manage Faculties" in the sidebar

3. **Create New Department**
   - Click "➕ Create New Department"
   - Enter Department Name (e.g., "BCA", "MCA", "B.Com")
   - Enter Full Name (optional, e.g., "Bachelor of Computer Applications")
   - Click "Create Department"

4. **Add Faculty Members**
   - In each department card, enter faculty name
   - Click "Add Faculty"
   - Repeat for all faculty members

### Step 2: Create Surveys

Once departments and faculty are set up:

1. **Go to "Create Survey"**
2. **Select Department** (or "ALL Departments")
3. **Select Questions** from the question bank
4. **Submit** to create the survey

### Step 3: Students Can Now Register

After departments are created:
- Students can visit the registration page
- They will see only the departments you created
- They can complete their registration

## Why This Order Matters

### ❌ Wrong Order:
1. Students register first
2. Admin creates departments later
3. **Result**: Students registered with non-existent departments, causing data inconsistency

### ✅ Correct Order:
1. Admin creates departments first
2. Admin adds faculty to departments
3. Students register and select from existing departments
4. **Result**: Clean, consistent data

## Common Issues & Solutions

### Issue 1: Students Can't Register
**Symptom**: Department dropdown shows "No departments available - Contact admin"

**Solution**: 
- Login as admin
- Go to "Manage Faculties"
- Create at least one department
- Students can now register

### Issue 2: Department Not Showing in Dropdown
**Symptom**: You created a department but it doesn't appear in student registration

**Solution**:
- Refresh the registration page
- Check if department was actually saved (go to "Manage Faculties")
- Check browser console for errors

### Issue 3: Can't Create Survey
**Symptom**: "No faculties available for this department"

**Solution**:
- Go to "Manage Faculties"
- Find the department
- Add at least one faculty member
- Try creating survey again

## Best Practices

### 1. Consistent Naming
Use consistent department names:
- ✅ Good: "BCA", "MCA", "B.Com"
- ❌ Bad: "BCA", "B.C.A", "BCA Department" (creates confusion)

### 2. Complete Setup Before Launch
Before allowing students to use the system:
1. Create all departments
2. Add all faculty members
3. Create question bank
4. Test with a dummy student account

### 3. Regular Maintenance
- Review departments monthly
- Remove inactive faculty
- Update faculty lists as needed
- Clean up old surveys

## Department Management Tips

### Adding a New Department
1. Go to "Manage Faculties"
2. Click "➕ Create New Department"
3. Fill in details
4. Add faculty members immediately
5. Create surveys for the new department

### Editing a Department
1. Go to "Manage Faculties"
2. Find the department card
3. Click "✏️ Edit" button
4. Update name or full name
5. Click "Update Department"

### Deleting a Department
⚠️ **Warning**: This will delete all faculty in the department

1. Go to "Manage Faculties"
2. Find the department card
3. Click "🗑️ Delete" button
4. Confirm deletion

**Note**: Existing students registered with this department will still have it in their profile, but they won't be able to see surveys for it.

## Troubleshooting

### Check What Departments Exist
Open browser console (F12) and run:
```javascript
const departments = await Storage.getDepartments();
console.log('Departments:', departments);
```

### Check Student Departments
```javascript
const users = await Storage.getUsers();
const studentDepts = users.filter(u => u.role === 'student').map(u => u.department);
console.log('Student departments:', [...new Set(studentDepts)]);
```

### Verify Department-Student Match
```javascript
const departments = await Storage.getDepartments();
const users = await Storage.getUsers();
const deptNames = departments.map(d => d.name);
const studentDepts = [...new Set(users.filter(u => u.role === 'student').map(u => u.department))];
const orphaned = studentDepts.filter(sd => !deptNames.includes(sd));
console.log('Orphaned student departments:', orphaned);
```

If you see orphaned departments, create them in "Manage Faculties".

## Need Help?

1. Check browser console (F12) for error messages
2. Review this guide
3. Check DEPARTMENT_AUTO_CREATION_FIX.md for technical details
4. Contact support with console logs
