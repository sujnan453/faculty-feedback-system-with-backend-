/**
 * Migration Utility: Move Classes from localStorage to Firebase
 * Run this once to migrate existing class data to Firestore
 */

import Storage from './firebase-storage.js';

async function migrateClassesToFirebase() {
    try {
        console.log('🔄 Starting class migration from localStorage to Firebase...');

        // Get classes from localStorage
        const raw = localStorage.getItem('ffs_classes');
        if (!raw) {
            console.log('ℹ️ No classes found in localStorage. Nothing to migrate.');
            return {
                success: true,
                migrated: 0,
                skipped: 0,
                errors: 0
            };
        }

        const localClasses = JSON.parse(raw);
        console.log(`📊 Found ${localClasses.length} classes in localStorage`);

        // Get existing classes from Firebase
        const firebaseClasses = await Storage.getClasses();
        console.log(`📊 Found ${firebaseClasses.length} classes in Firebase`);

        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        // Migrate each class
        for (const localClass of localClasses) {
            try {
                // Check if class already exists in Firebase
                const exists = firebaseClasses.find(fc =>
                    fc.id === localClass.id ||
                    fc.name.toLowerCase().trim() === localClass.name.toLowerCase().trim()
                );

                if (exists) {
                    console.log(`⏭️ Skipping "${localClass.name}" - already exists in Firebase`);
                    skipped++;
                    continue;
                }

                // Migrate class to Firebase
                const classData = {
                    id: localClass.id,
                    name: localClass.name,
                    faculties: localClass.faculties || [],
                    createdAt: localClass.createdAt || new Date().toISOString(),
                    migratedFrom: 'localStorage',
                    migratedAt: new Date().toISOString()
                };

                await Storage.saveClass(classData);
                console.log(`✅ Migrated "${localClass.name}" to Firebase`);
                migrated++;
            } catch (error) {
                console.error(`❌ Error migrating class "${localClass.name}":`, error);
                errors++;
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Migrated: ${migrated}`);
        console.log(`   ⏭️ Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log(`   📦 Total: ${localClasses.length}`);

        if (errors === 0) {
            console.log('\n✅ Migration completed successfully!');
            console.log('ℹ️ localStorage data is preserved for backward compatibility.');
        } else {
            console.warn('\n⚠️ Migration completed with errors. Please review the logs.');
        }

        return {
            success: errors === 0,
            migrated,
            skipped,
            errors
        };
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Auto-run migration on page load (only once)
(async () => {
    const migrationKey = 'ffs_classes_migrated';
    const alreadyMigrated = localStorage.getItem(migrationKey);

    if (alreadyMigrated) {
        console.log('ℹ️ Classes already migrated to Firebase. Skipping migration.');
        return;
    }

    console.log('🚀 Auto-running class migration...');
    const result = await migrateClassesToFirebase();

    if (result.success) {
        // Mark migration as complete
        localStorage.setItem(migrationKey, new Date().toISOString());
        console.log('✅ Migration flag set. Future page loads will skip migration.');
    }
})();

// Export for manual use
window.migrateClassesToFirebase = migrateClassesToFirebase;
export default migrateClassesToFirebase;