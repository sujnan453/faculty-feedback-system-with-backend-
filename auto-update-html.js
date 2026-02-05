/**
 * Automatic HTML File Updater for Firebase Migration
 * This script updates all HTML files to use Firebase modules
 * 
 * Run with: node auto-update-html.js
 */

const fs = require('fs');
const path = require('path');

const htmlFiles = [
    'student-login.html',
    'student-register.html',
    'student-dashboard.html',
    'admin-dashboard.html',
    'create-survey.html',
    'take-survey.html',
    'manage-faculties.html',
    'manage-questions.html',
    'faculty-performance.html',
    'visualization.html',
    'student-submissions.html',
    'reset-data.html'
];

const oldScriptPattern = /<script src="js\/storage\.js"><\/script>\s*<script src="js\/auth\.js"><\/script>/g;

const newScriptBlock = `<script type="module">
        import Storage from './js/firebase-storage.js';
        import { checkAuth, logout, showAlert } from './js/firebase-auth.js';
        
        // Make functions globally available
        window.Storage = Storage;
        window.checkAuth = checkAuth;
        window.logout = logout;
        window.showAlert = showAlert;
    </script>`;

console.log('🔥 Starting Firebase Migration - HTML File Updates\n');

let updatedCount = 0;
let errorCount = 0;

htmlFiles.forEach(filename => {
    try {
        const filePath = path.join(__dirname, filename);

        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  ${filename} - File not found, skipping`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');

        // Check if file needs update
        if (!content.includes('js/storage.js')) {
            console.log(`ℹ️  ${filename} - Already updated or doesn't use storage.js`);
            return;
        }

        // Replace old script tags with new module imports
        const updatedContent = content.replace(oldScriptPattern, newScriptBlock);

        // Verify the replacement was made
        if (updatedContent === content) {
            console.log(`⚠️  ${filename} - Pattern not found, manual update required`);
            return;
        }

        // Write updated content back to file
        fs.writeFileSync(filePath, updatedContent, 'utf8');

        console.log(`✅ ${filename} - Updated successfully`);
        updatedCount++;

    } catch (error) {
        console.log(`❌ ${filename} - Error: ${error.message}`);
        errorCount++;
    }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Updated: ${updatedCount} files`);
console.log(`   ❌ Errors: ${errorCount} files`);
console.log(`   📁 Total: ${htmlFiles.length} files`);

if (updatedCount > 0) {
    console.log(`\n🎉 Migration complete! ${updatedCount} HTML files have been updated.`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Open update-to-firebase.html in your browser`);
    console.log(`   2. Click "Start Migration" to migrate your data`);
    console.log(`   3. Test all features to ensure everything works`);
    console.log(`   4. Clear localStorage after verifying Firebase data`);
}

if (errorCount > 0) {
    console.log(`\n⚠️  Some files had errors. Please check and update them manually.`);
}