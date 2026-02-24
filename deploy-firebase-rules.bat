@echo off
echo ========================================
echo Firebase Security Rules Deployment
echo ========================================
echo.
echo This script will deploy the optimized security rules to Firebase.
echo.
echo IMPORTANT: Make sure you have Firebase CLI installed!
echo If not, install it with: npm install -g firebase-tools
echo.
pause

echo.
echo Logging in to Firebase...
call firebase login

echo.
echo Deploying Firestore security rules...
call firebase deploy --only firestore:rules

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Your Firestore security rules have been updated.
echo Test your application to ensure everything works correctly.
echo.
pause
