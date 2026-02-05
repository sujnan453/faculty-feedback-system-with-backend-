# 🚀 Firebase Migration - Quick Reference

## 📌 Most Common Changes

### HTML Script Tags

**Before:**
```html
<script src="js/storage.js"></script>
<script src="js/auth.js"></script>
```

**After:**
```html
<script type="module">
    import Storage from './js/firebase-storage.js';
    import { checkAuth, logout, showAlert } from './js/firebase-auth.js';
    window.Storage = Storage;
    window.checkAuth = checkAuth;
    window.logout = logout;
    window.showAlert = showAlert;
</script>
```

---

### JavaScript Functions

**Before:**
```javascript
function loadData() {
    const users = Storage.getUsers();
    const surveys = Storage.getSurveys();
    // ...
}
```

**After:**
```javascript
async function loadData() {
    const users = await Storage.getUsers();
    const surveys = await Storage.getSurveys();
    // ...
}
```

---

### Event Listeners

**Before:**
```javascript
button.addEventListener('click', function() {
    const data = Storage.getData();
    // ...
});
```

**After:**
```javascript
button.addEventListener('click', async function() {
    const data = await Storage.getData();
    // ...
});
```

---

### Form Submissions

**Before:**
```javascript
form.addEventListener('submit', function(e) {
    e.preventDefault();
    const user = Storage.findUserByEmail(email);
    Storage.saveUser(newUser);
});
```

**After:**
```javascript
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const user = await Storage.findUserByEmail(email);
    await Storage.saveUser(newUser);
});
```

---

## 📋 Storage API Reference

All methods now return Promises and require `await`:

### Users
```javascript
await Storage.getUsers()
await Storage.saveUser(user)
await Storage.findUserByEmail(email)
await Storage.findUserByUsername(username)
await Storage.findUserById(id)
```

### Sessions
```javascript
await Storage.setCurrentUser(user, rememberMe)
await Storage.getCurrentUser()
await Storage.logout()
await Storage.isLoggedIn()
```

### Surveys
```javascript
await Storage.getSurveys()
await Storage.saveSurvey(survey)
await Storage.getSurveyById(id)
await Storage.getSurveysByDepartment(dept)
await Storage.updateSurvey(id, data)
await Storage.deleteSurvey(id)
```

### Feedbacks
```javascript
await Storage.getFeedbacks()
await Storage.saveFeedback(feedback)
await Storage.getFeedbacksByStudentId(id)
await Storage.getFeedbacksBySurveyId(id)
await Storage.getFeedbacksByFilter(filters)
await Storage.hasSubmittedFeedback(studentId, surveyId)
```

### Departments
```javascript
await Storage.getDepartments()
await Storage.saveDepartment(dept)
await Storage.getDepartmentById(id)
await Storage.getDepartmentByName(name)
await Storage.addFacultyToDepartment(deptId, faculty)
await Storage.removeFacultyFromDepartment(deptId, facultyId)
await Storage.getFacultiesByDepartment(deptId)
await Storage.deleteDepartment(id)
```

### Questions
```javascript
await Storage.getQuestions()
await Storage.saveQuestion(question)
await Storage.getQuestionById(id)
await Storage.deleteQuestion(id)
```

### Utilities
```javascript
Storage.generateId()
await Storage.resetStudentData()
await Storage.resetPreserveStudents()
```

---

## 🔥 Firebase Console

**URL:** https://console.firebase.google.com/
**Project:** faculty-feedback-system-f4a83
**Database:** https://faculty-feedback-system-f4a83-default-rtdb.firebaseio.com

### Quick Actions:
1. View data: Realtime Database → Data
2. Update rules: Realtime Database → Rules
3. Monitor usage: Realtime Database → Usage
4. View logs: Realtime Database → Logs

---

## 🐛 Common Errors & Fixes

### Error: "Storage is not defined"
```javascript
// Add this to HTML:
<script type="module">
    import Storage from './js/firebase-storage.js';
    window.Storage = Storage;
</script>
```

### Error: "Cannot use import outside module"
```html
<!-- Change script tag: -->
<script type="module">
    // your imports here
</script>
```

### Error: "Cannot read property 'then' of undefined"
```javascript
// Add await:
const data = await Storage.getData(); // ✅
const data = Storage.getData(); // ❌
```

### Error: "Permission denied"
```json
// Update Firebase rules:
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Error: "CORS policy"
```
// Run from web server, not file://
// Use: python -m http.server 8000
// Or: Live Server extension in VS Code
```

---

## ⚡ Quick Commands

### Clear Browser Data
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Check Firebase Connection
```javascript
import { database } from './js/firebase-config.js';
console.log('Firebase:', database);
```

### Test Storage
```javascript
const users = await Storage.getUsers();
console.log('Users:', users);
```

### Verify Migration
```javascript
const users = await Storage.getUsers();
const surveys = await Storage.getSurveys();
const feedbacks = await Storage.getFeedbacks();
console.log(`Users: ${users.length}, Surveys: ${surveys.length}, Feedbacks: ${feedbacks.length}`);
```

---

## 📱 Testing URLs

### Local Development
```
http://localhost:8000/student-login.html
http://localhost:8000/admin-dashboard.html
http://localhost:8000/update-to-firebase.html
```

### Migration Tool
```
http://localhost:8000/update-to-firebase.html
```

---

## 🔐 Default Credentials

### Super Admin
```
Email: superadmin@system.edu
Password: SuperAdmin2024!
```

### Admin Secret Code
```
Code: ADMIN2024
```

---

## 📊 Firebase Data Structure

```
Root
├── users/{userId}
├── surveys/{surveyId}
├── feedbacks/{feedbackId}
├── departments/{deptId}
├── questions/{questionId}
└── sessions/{userId}
```

---

## ✅ Quick Test Checklist

- [ ] Open update-to-firebase.html
- [ ] Click "Start Migration"
- [ ] Wait for completion
- [ ] Open student-login.html
- [ ] Login as student
- [ ] Check if surveys load
- [ ] Open admin-dashboard.html
- [ ] Login as admin
- [ ] Check if stats load
- [ ] Open Firebase Console
- [ ] Verify data exists

---

## 🆘 Emergency Rollback

If something goes wrong:

1. **Restore from backup:**
   ```javascript
   // If you saved backup:
   localStorage.setItem('users', backupData.users);
   localStorage.setItem('surveys', backupData.surveys);
   // etc...
   ```

2. **Revert HTML files:**
   ```html
   <!-- Change back to: -->
   <script src="js/storage.js"></script>
   <script src="js/auth.js"></script>
   ```

3. **Clear Firebase data:**
   - Go to Firebase Console
   - Realtime Database → Data
   - Click "..." → Delete

---

## 📞 Support Resources

- **Migration Guide:** FIREBASE_MIGRATION_GUIDE.md
- **Deployment Guide:** DEPLOYMENT_INSTRUCTIONS.md
- **Full Summary:** MIGRATION_SUMMARY.md
- **Checklist:** MIGRATION_CHECKLIST.md
- **Firebase Docs:** https://firebase.google.com/docs/database

---

## 💡 Pro Tips

1. **Always use await** with Storage methods
2. **Test in console first** before updating code
3. **Check Firebase Console** to verify data
4. **Use browser DevTools** to debug
5. **Update one file at a time** and test
6. **Keep backup** of working code
7. **Read error messages** carefully
8. **Check network tab** for failed requests

---

**Last Updated:** February 2026
**Version:** 1.0
**Status:** Ready for Migration
