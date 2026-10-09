# Faculty Feedback System

A web-based faculty feedback management system for Sri Bhuvanendra College, designed to collect, manage, and analyze student feedback on faculty performance.

This project provides separate student and admin workflows for submitting surveys, managing faculties and questions, viewing analytics, and exporting reports.

## Overview

The Faculty Feedback System helps educational institutions digitize student feedback collection and replace paper-based evaluation with a faster digital process.

It includes:
- Student login and registration
- Admin dashboard for managing departments, faculties, classes, and surveys
- Feedback form generation and submission
- Duplicate-submission protection
- Faculty performance analytics and report generation
- Firebase-based authentication and database storage

## Features

### Student Features
- Student registration and login
- View active surveys for their class/department
- Submit anonymous faculty feedback
- Track submitted surveys
- Password reset support

### Admin Features
- Dashboard overview with statistics
- Create and manage surveys
- Add/edit faculties and departments
- Manage question bank
- Assign faculty to classes
- View student responses and feedback reports
- Export aggregated results
- Manage duplicate or reset data utilities

### Technical Features
- Responsive HTML/CSS/JavaScript interface
- Firebase Authentication for user access
- Firestore database for storing survey and feedback data
- Chart-based analytics and report generation
- Secure rules for role-based access control

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- Firebase Authentication
- Firestore Database
- Chart.js
- SheetJS (xlsx)
- Python HTTP server for local development

## Project Structure

```text
.
├── index.html
├── admin-dashboard.html
├── student-login.html
├── student-register.html
├── student-dashboard.html
├── take-survey.html
├── manage-faculties.html
├── manage-questions.html
├── create-survey.html
├── view-feedbacks.html
├── faculty-performance.html
├── submitted-students.html
├── clear-duplicates.html
├── reset-data.html
├── forgot-password.html
├── privacy-policy.html
├── create-admin-with-firebase-auth.html
├── css/
│   ├── perfect-design.css
│   ├── dashboard.css
│   ├── admin.css
│   ├── survey.css
│   └── ...
├── js/
│   ├── firebase-config.js
│   ├── firebase-auth.js
│   ├── firebase-storage.js
│   ├── admin-dashboard.js
│   ├── student-dashboard.js
│   ├── take-survey.js
│   └── ...
├── firestore.rules
├── start-server.bat
├── stop-server.bat
├── deploy-firebase-rules.bat
├── logo.png
├── favicon.ico
├── PROJECT_SYNOPSIS.md
├── FILE_STRUCTURE_REFERENCE.md
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- A modern web browser
- Python 3.x (for local server)
- Firebase project access
- Internet connection for Firebase services

### Local Setup

1. Clone the repository:

```bash
git clone https://github.com/sujnan453/faculty-feedback-system-with-backend-.git
cd faculty-feedback-system-with-backend-
```

2. Start the local server:

On Windows:

```bat
start-server.bat
```

Or use Python directly:

```bash
python -m http.server 8000
```

3. Open the app in your browser:

```text
http://localhost:8000
```

## Firebase Configuration

The project uses Firebase for authentication and database access. The configuration is defined in:

- `js/firebase-config.js`

Important:
- Update the Firebase project configuration if you are using your own Firebase project.
- Make sure `firestore.rules` is deployed to your Firebase project before production use.

## Deploying Firestore Rules

On Windows, you can run:

```bat
deploy-firebase-rules.bat
```

Alternatively, use the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

## Database and Security

The app uses Firestore collections such as:
- `users`
- `surveys`
- `feedbacks`
- `departments`
- `questions`
- `classes`
- `sessions`

Security rules are configured in `firestore.rules` to support controlled access based on user roles and permissions.

## Important Notes

- This project is a frontend-heavy static web app using Firebase.
- It is intended for educational/demo use and can be extended for production deployment.
- Admin credentials and data are managed through the Firebase environment configured in the app.

## Documentation

Additional project documents are included:
- `PROJECT_SYNOPSIS.md` — project summary and requirements
- `FILE_STRUCTURE_REFERENCE.md` — page and module structure reference

## License

This project does not include an explicit license file. If you plan to reuse or distribute it, confirm repository licensing requirements before public use.

## Author

Sri Bhuvanendra College, Karkala

Project Type: Mini Project / Faculty Feedback System

## Contributing

Contributions are welcome. You can improve the UI, add validation, optimize database queries, or extend analytics and reporting features.

## Contact

For project questions or collaboration, use the repository owner or the contact details available in the project documentation.

---

Built for efficient faculty feedback management, student engagement, and institutional reporting.
