# Question Storage Debug Guide

## Problem: Newly Added Questions Not Storing in Database

### Root Causes Fixed

1. **Module Loading Race Condition**
   - **Issue**: `manage-questions.js` was executing before Firebase modules loaded
   - **Fix**: Wrapped initialization in `DOMContentLoaded` with delay
   - **Result**: Storage module is now available when needed

2. **Missing Async/Await**
   - **Issue**: Functions weren't waiting for Firestore operations
   - **Fix**: Added `async/await` to all storage operations
   - **Result**: Questions now properly save before UI updates

3. **No Error Handling**
   - **Issue**: Silent failures with no console logs
   - **Fix**: Added comprehensive logging throughout the flow
   - **Result**: Can now see exactly where issues occur

## How to Test

### Method 1: Use the Test Page

1. Open `test-question-storage.html` in your browser
2. Enter a question (must end with `?`)
3. Click "Add Question"
4. Watch the console log for:
   - ✅ Storage module available
   - ✅ Question saved successfully
   - ✅ Verified: Question exists in database

### Method 2: Use Manage Questions Page

1. Open `manage-questions.html`
2. Open browser console (F12)
3. Add a new question
4. Look for these console messages:

```
📝 Creating new question...
Question object created: {id: "...", text: "...", ...}
💾 Attempting to save question: {...}
✅ Question saved successfully to Firestore: [question-id]
✅ Question added successfully!
🔄 Reloading questions list...
📋 Loading questions from Firestore...
✅ Loaded X questions from Firestore
```

### Method 3: Check Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database
4. Look for `questions` collection
5. Verify new questions appear there

## Console Log Meanings

| Log Message | Meaning | Action |
|------------|---------|--------|
| `📝 Creating new question...` | Starting to create question | Normal |
| `💾 Attempting to save question` | Calling Firestore save | Normal |
| `✅ Question saved successfully` | Saved to Firestore | Success! |
| `❌ Error saving question` | Firestore save failed | Check error details |
| `❌ Storage module is NOT available` | Module not loaded | Refresh page |
| `📋 Loading questions from Firestore` | Fetching questions | Normal |
| `✅ Loaded X questions` | Questions retrieved | Success! |

## Common Issues & Solutions

### Issue 1: "Storage is not defined"
**Symptom**: Console error `Storage is not defined`
**Cause**: Module not loaded yet
**Solution**: 
- Refresh the page
- Check that `firebase-storage.js` exists
- Verify Firebase config is correct

### Issue 2: Questions appear but disappear on refresh
**Symptom**: Questions show after adding but gone after refresh
**Cause**: Saving to localStorage instead of Firestore
**Solution**: 
- Verify using `firebase-storage.js` not `storage.js`
- Check HTML imports the correct module

### Issue 3: "Permission denied" error
**Symptom**: Console shows Firestore permission error
**Cause**: Firebase security rules or not authenticated
**Solution**:
- Ensure you're logged in as admin
- Check Firebase security rules allow write access
- Verify authentication is working

### Issue 4: No console logs appear
**Symptom**: No logs when adding questions
**Cause**: JavaScript not executing
**Solution**:
- Check browser console for errors
- Verify all script files are loading
- Check network tab for 404 errors

## Verification Checklist

- [ ] Open browser console (F12)
- [ ] Navigate to Manage Questions page
- [ ] See "📋 Loading questions from Firestore..." log
- [ ] Add a new question
- [ ] See "💾 Attempting to save question" log
- [ ] See "✅ Question saved successfully" log
- [ ] See "✅ Question added successfully!" alert
- [ ] Refresh page
- [ ] Question still appears in list
- [ ] Check Firebase Console - question is there

## Files Modified for This Fix

1. **js/manage-questions.js**
   - Added DOMContentLoaded wrapper
   - Made all functions async
   - Added comprehensive logging
   - Added error handling

2. **js/firebase-storage.js**
   - Enhanced saveQuestion with logging
   - Better error messages

3. **manage-questions.html**
   - Already using firebase-storage.js module
   - Correct import order

4. **js/manage-faculties.js**
   - Same fixes as manage-questions.js

## Testing Commands (Browser Console)

```javascript
// Check if Storage is available
typeof Storage !== 'undefined'

// Get all questions
await Storage.getQuestions()

// Add a test question
await Storage.saveQuestion({
    id: Storage.generateId(),
    text: 'Test question?',
    allowComments: true,
    createdAt: new Date().toISOString()
})

// Check Firebase connection
console.log(window.db)
```

## Expected Behavior

### When Adding a Question:

1. User types question text
2. User clicks "Add Question"
3. Validation runs (length, format, duplicates)
4. Question object created with unique ID
5. `Storage.saveQuestion()` called
6. Firestore `setDoc()` executed
7. Success message shown
8. Form cleared
9. Questions list reloaded
10. New question appears in list
11. Question persists after page refresh

### Console Output (Success):

```
📝 Creating new question...
Question object created: {id: "1738684800000_abc123_1", text: "How is the teaching?", allowComments: true, createdAt: "2026-02-04T..."}
💾 Attempting to save question: {id: "1738684800000_abc123_1", ...}
✅ Question saved successfully to Firestore: 1738684800000_abc123_1
✅ Question added successfully!
🔄 Reloading questions list...
📋 Loading questions from Firestore...
✅ Loaded 11 questions from Firestore
```

## Still Having Issues?

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+F5)
3. **Check Firebase Console** for the question
4. **Try the test page** (`test-question-storage.html`)
5. **Check network tab** for failed requests
6. **Verify Firebase config** in `firebase-config.js`

## Success Indicators

✅ Console shows all log messages
✅ Success alert appears
✅ Question appears in list immediately
✅ Question persists after refresh
✅ Question visible in Firebase Console
✅ No errors in browser console

---

**Last Updated**: February 4, 2026
**Status**: All fixes applied and tested
