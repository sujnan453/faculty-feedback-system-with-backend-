# Faculty Feedback System - File Structure Reference

## HTML Pages & Their Dependencies

### 1. **index.html** (Landing Page)
- **CSS**: `css/perfect-design.css`
- **JS**: None (static landing page)
- **Purpose**: Main landing page with navigation to student/admin portals

---

### 2. **student-login.html** (Student Login)
- **CSS**: 
  - `css/perfect-design.css`
  - `css/input-selection-fix.css`
- **JS**: 
  - `js/firebase-config.js`
  - `js/firebase-auth.js`
  - `js/force-text-selection-fix.js`
- **Purpose**: Student authentication page

---

### 3. **student-register.html** (Student Registration)
- **CSS**: 
  - `css/input-selection-fix.css`
  - Inline styles
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-auth.js`
  - `js/force-text-selection-fix.js`
- **Purpose**: New student account creation

---

### 4. **student-dashboard.html** (Student Dashboard)
- **CSS**: `css/dashboard.css`
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-auth.js`
  - `js/mobile-nav.js`
  - `js/student-dashboard.js`
- **Purpose**: Student home page showing available surveys

---

### 5. **student-submissions.html** (Student Submissions)
- **CSS**: 
  - `css/dashboard.css`
  - `css/submissions.css`
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-auth.js`
  - `js/mobile-nav.js`
  - Inline JS for submissions display
- **Purpose**: View student's submitted feedback history

---

### 6. **take-survey.html** (Take Survey)
- **CSS**: `css/survey.css`
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-auth.js`
  - `js/take-survey.js`
- **Purpose**: Survey submission interface for students

---

### 7. **admin-dashboard.html** (Admin Dashboard)
- **CSS**: 
  - `css/dashboard.css`
  - `css/admin.css`
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-auth.js`
  - `js/mobile-nav.js`
  - `js/micro-interactions.js`
  - `js/migrate-classes-to-firebase.js`
  - `js/admin-dashboard.js`
- **Purpose**: Admin home page with system statistics

---

### 8. **manage-faculties.html** (Manage Faculties)
- **CSS**: 
  - `css/dashboard.css`
  - `css/admin.css`
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-auth.js`
  - `js/mobile-nav.js`
  - `js/manage-faculties.js`
- **Purpose**: Create/edit departments and faculty members

---

### 9. **manage-questions.html** (Manage Questions)
- **CSS**: 
  - `css/dashboard.css`
  - `css/admin.css`
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-auth.js`
  - `js/mobile-nav.js`
  - `js/manage-questions.js`
- **Purpose**: Create/edit survey questions

---

### 10. **create-survey.html** (Create Survey)
- **CSS**: 
  - `css/dashboard.css`
  - `css/admin.css`
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-auth.js`
  - `js/mobile-nav.js`
  - `js/create-survey.js`
- **Purpose**: Create new surveys with selected faculties and questions

---

### 11. **select-faculties.html** (Class Survey Management)
- **CSS**: 
  - `css/dashboard.css`
  - `css/admin.css`
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-auth.js`
  - `js/mobile-nav.js`
  - Inline JS for class management
- **Purpose**: Create classes and assign faculties from departments

---

### 12. **view-feedbacks.html** (View Feedbacks)
- **CSS**: 
  - `css/dashboard.css`
  - `css/admin.css`
  - `css/feedbacks.css`
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-auth.js`
  - `js/mobile-nav.js`
  - `js/view-feedbacks.js`
- **Purpose**: View and filter student feedback submissions

---

### 13. **faculty-performance.html** (Faculty Performance)
- **CSS**: 
  - `css/dashboard.css`
  - `css/admin.css`
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-auth.js`
  - `js/mobile-nav.js`
  - `js/visualization-faculty-report.js`
  - External: SheetJS (xlsx library)
- **Purpose**: View faculty performance reports and analytics

---

### 14. **submitted-students.html** (Submitted Students)
- **CSS**: 
  - `css/dashboard.css`
  - `css/admin.css`
  - `css/feedbacks.css`
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-auth.js`
  - `js/mobile-nav.js`
  - `js/micro-interactions.js`
  - `js/submitted-students.js`
- **Purpose**: View list of students who submitted feedback

---

### 15. **clear-duplicates.html** (Clear Duplicates)
- **CSS**: 
  - `css/dashboard.css`
  - `css/admin.css`
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-auth.js`
  - `js/mobile-nav.js`
  - `js/micro-interactions.js`
  - `js/clear-duplicates.js`
- **Purpose**: Auto-create departments and remove duplicate entries

---

### 16. **reset-data.html** (Reset Data)
- **CSS**: Inline styles
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-auth.js`
  - Inline JS for reset functionality
- **Purpose**: Reset system data (delete students, surveys, feedbacks)

---

### 17. **forgot-password.html** (Forgot Password)
- **CSS**: 
  - `css/perfect-design.css`
  - `css/input-selection-fix.css`
- **JS**: 
  - `js/firebase-storage.js`
  - `js/force-text-selection-fix.js`
- **Purpose**: Password recovery for students

---

### 18. **privacy-policy.html** (Privacy Policy)
- **CSS**: `css/perfect-design.css`
- **JS**: None (static content page)
- **Purpose**: Privacy policy and terms

---

### 19. **create-admin-with-firebase-auth.html** (Create Admin)
- **CSS**: `css/perfect-design.css`
- **JS**: 
  - `js/firebase-storage.js`
  - `js/firebase-config.js`
- **Purpose**: Create new admin accounts with Firebase Authentication

---

## CSS Files

### Core Stylesheets
1. **css/perfect-design.css** - Main design system with gradients, animations
2. **css/dashboard.css** - Dashboard layout and components
3. **css/admin.css** - Admin-specific styling
4. **css/auth.css** - Authentication pages styling
5. **css/survey.css** - Survey taking interface
6. **css/submissions.css** - Submissions page styling
7. **css/feedbacks.css** - Feedback viewing interface
8. **css/input-selection-fix.css** - Fix for text selection in inputs

---

## JavaScript Files

### Core Modules
1. **js/firebase-config.js** - Firebase initialization and configuration
2. **js/firebase-storage.js** - Firestore database operations
3. **js/firebase-auth.js** - Authentication functions
4. **js/error-handler.js** - Global error handling

### Feature Modules
5. **js/admin-dashboard.js** - Admin dashboard functionality
6. **js/student-dashboard.js** - Student dashboard functionality
7. **js/create-survey.js** - Survey creation logic
8. **js/take-survey.js** - Survey submission logic
9. **js/manage-faculties.js** - Faculty management
10. **js/manage-questions.js** - Question management
11. **js/view-feedbacks.js** - Feedback viewing and filtering
12. **js/submitted-students.js** - Submitted students list
13. **js/clear-duplicates.js** - Duplicate management
14. **js/migrate-classes-to-firebase.js** - Class migration utility

### Visualization & Reports
15. **js/visualization-faculty-report.js** - Faculty performance reports
16. **js/visualization-export-functions.js** - Export functionality
17. **js/visualization-complete-fix.js** - Visualization fixes
18. **js/visualization-faculty-fixed.js** - Faculty visualization
19. **js/visualization.js** - Main visualization module

### Utility Modules
20. **js/mobile-nav.js** - Mobile navigation
21. **js/micro-interactions.js** - UI micro-interactions
22. **js/force-text-selection-fix.js** - Text selection fix
23. **js/password-validator.js** - Password validation
24. **js/validation.js** - Form validation
25. **js/utils.js** - General utilities
26. **js/storage.js** - Local storage operations

---

## Configuration Files
- **firestore.rules** - Firestore security rules
- **deploy-firebase-rules.bat** - Deploy rules script
- **start-server.bat** - Start local server
- **stop-server.bat** - Stop local server

---

## Assets
- **logo.png** - College logo
- **favicon.ico** - Website favicon

---

## Summary by Page Type

### Student Pages (5)
- student-login.html
- student-register.html
- student-dashboard.html
- student-submissions.html
- take-survey.html

### Admin Pages (10)
- admin-dashboard.html
- manage-faculties.html
- manage-questions.html
- create-survey.html
- select-faculties.html
- view-feedbacks.html
- faculty-performance.html
- submitted-students.html
- clear-duplicates.html
- reset-data.html

### Public Pages (4)
- index.html
- forgot-password.html
- privacy-policy.html
- create-admin-with-firebase-auth.html

---

## Key Dependencies

### All Pages Use:
- Firebase (Firestore, Authentication)
- Modern CSS with gradients and animations
- Responsive design (mobile-friendly)

### Admin Pages Additionally Use:
- Data visualization libraries
- Export functionality (CSV, PDF)
- Advanced filtering and search

### Student Pages Additionally Use:
- Survey submission forms
- Rating systems
- Submission history tracking
