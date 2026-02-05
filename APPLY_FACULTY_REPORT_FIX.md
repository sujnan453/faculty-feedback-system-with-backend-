# How to Apply Faculty Report Fix

## Quick Instructions

The faculty report function needs to be replaced with the improved version that includes filtering and sorting.

### Step 1: Open the files

1. Open `js/visualization-faculty-report.js` (the new improved version)
2. Open `js/visualization.js` (the file to update)

### Step 2: Find and Replace

1. In `js/visualization.js`, find this line (around line 772):
   ```javascript
   // ===== Faculty Ratings by Year =====
   async function displayFacultyRatingsByYear() {
   ```

2. Delete everything from that line to the end of the function (the closing `}`)

3. Copy the ENTIRE `displayFacultyRatingsByYear()` function from `js/visualization-faculty-report.js`

4. Paste it in place of the old function

5. Save the file

### Step 3: Test

1. Open `visualization.html` in your browser
2. Scroll to "Faculty Ratings Report" section
3. You should see 3 filter dropdowns:
   - Filter by Department
   - Filter by Year  
   - Sort By
4. Click "Generate Report"
5. Verify:
   - ✅ Report shows with rankings
   - ✅ Top 3 have medal icons (🥇🥈🥉)
   - ✅ Filters work when you change them
   - ✅ Sorting works

## What's Already Done

✅ visualization.html - Updated with filter controls
✅ Line chart - Fixed in visualization.js
✅ Filter initialization - Added to visualization.js
✅ New faculty function - Created in visualization-faculty-report.js

## What You Need to Do

❌ Replace the old `displayFacultyRatingsByYear()` function with the new one

## Alternative: Use the Command

If you're comfortable with command line, you can use this PowerShell command to do it automatically:

```powershell
# Backup first
Copy-Item "js/visualization.js" "js/visualization.js.backup"

# Then manually replace the function as described above
```

## Verification

After applying the fix, check the browser console when you click "Generate Report":

You should see:
```
📊 Report - Dept: All, Year: All, Sort: highest
📊 Filtered: X of X feedbacks
```

## If Something Goes Wrong

1. Restore from backup: `js/visualization.js.backup`
2. Or re-download the original file
3. Try again following the steps carefully

## Summary

The new faculty report function adds:
- ✅ Department filter
- ✅ Year filter  
- ✅ Sort by highest/lowest/name
- ✅ Ranking with medals
- ✅ Department averages
- ✅ Response counts
- ✅ Better empty states

All other functionality remains unchanged!
