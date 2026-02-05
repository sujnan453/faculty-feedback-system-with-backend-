# Debug Survey Filter Guide

## Problem
Available surveys showing as empty even though surveys exist in the database.

## Solution Steps

### Step 1: Open Debug Page
1. Open `debug-survey-filter.html` in your browser
2. Login as a student
3. The page will show:
   - Your current user info (name, department, role)
   - All surveys in the database
   - Filtered surveys that match your department

### Step 2: Check Console Logs
1. Open browser console (F12 → Console tab)
2. Look for these debug messages:

```
=== SURVEY LOADING DEBUG (BEFORE FILTER) ===
Student Department: BCA
Student Department Type: string
Total Surveys in DB: 1
All Surveys: [{id: "...", dept: "BCA", active: true}]

🔍 getSurveysByDepartment - Searching for: BCA
📝 Normalized student dept: bca
📊 Total surveys to check: 1
  Checking survey: ..., dept: "BCA", active: true
    📝 Normalized survey dept: "bca"
    ✅ MATCH: Direct normalized match
✅ Found 1 surveys for: "BCA"

=== SURVEY LOADING DEBUG (AFTER FILTER) ===
Filtered Surveys Count: 1
Matched Surveys: [{id: "...", dept: "BCA", active: true}]
```

### Step 3: Identify the Issue

#### Issue A: Student has no department
**Console shows:**
```
Student Department: undefined
⚠️ Student has no department set!
```

**Fix:** Update the student's profile to include a department

#### Issue B: Department name mismatch
**Console shows:**
```
Student Department: BCA
Survey Department: B.C.A
❌ No match
```

**Fix:** The departments don't match. Check:
- Student department: `BCA`
- Survey department: `B.C.A`
- They should match after normalization

#### Issue C: Survey is inactive
**Console shows:**
```
Checking survey: ..., dept: "BCA", active: false
❌ Survey is inactive
```

**Fix:** Activate the survey in admin dashboard

#### Issue D: No surveys exist
**Console shows:**
```
Total Surveys in DB: 0
```

**Fix:** Create a survey in admin dashboard

### Step 4: Common Fixes

#### Fix 1: Exact Department Match
Make sure the student's department EXACTLY matches the survey's department:
- Student: `BCA` → Survey: `BCA` ✅
- Student: `BCA` → Survey: `B.C.A` ✅ (normalized)
- Student: `BCA` → Survey: `MCA` ❌

#### Fix 2: Check Survey Status
In admin dashboard:
1. Go to "Manage Surveys"
2. Find your survey
3. Make sure it's marked as "Active"

#### Fix 3: Verify Student Department
1. Check the student's registration
2. Make sure department field is filled
3. Department should match one of the survey departments

### Step 5: Test the Fix

1. Go to student dashboard
2. Check if surveys appear
3. Verify the count matches expected surveys
4. Try taking a survey

## Quick Test Commands

Open browser console and run:

```javascript
// Check current user
const user = Storage.getCurrentUser();
console.log('User:', user);

// Check all surveys
const allSurveys = await Storage.getSurveys();
console.log('All Surveys:', allSurveys);

// Check filtered surveys
const filtered = await Storage.getSurveysByDepartment(user.department);
console.log('Filtered:', filtered);
```

## Expected Behavior

### Before Fix
- Student sees ALL surveys from ALL departments
- Survey count shows total surveys (e.g., 6)
- Student can access surveys from other departments

### After Fix
- Student sees ONLY surveys from their department
- Survey count shows department-specific count (e.g., 1 for BCA)
- Student cannot access surveys from other departments
- Empty state shows if no surveys for their department

## Still Not Working?

If surveys still don't appear:

1. **Check browser console** for error messages
2. **Use debug page** (`debug-survey-filter.html`) to see detailed info
3. **Verify data** in Firestore console:
   - Check `surveys` collection
   - Check `users` collection
   - Verify department names match

4. **Clear cache**:
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

5. **Check Firebase connection**:
   - Open `test-firebase-connection.html`
   - Verify connection is successful

## Contact Info

If you need more help, provide:
1. Screenshot of browser console logs
2. Screenshot of debug page output
3. Student department name
4. Survey department name
