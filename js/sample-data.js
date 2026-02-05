// Sample Data Initialization Script
// Run this to populate the system with realistic sample data

// Function to initialize the specific 10 questions from the faculty feedback form
async function initializeSpecific10Questions() {
    console.log('📝 Initializing specific 10 faculty feedback questions...');

    // The 10 specific questions from the faculty feedback form
    const questions = [{
            id: Storage.generateId(),
            text: 'Regularity in conducting classes',
            type: 'rating',
            category: 'Professionalism',
            isRequired: true,
            description: 'Faculty\'s consistency in attending and conducting scheduled classes',
            scale: '1-10',
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'Punctuality',
            type: 'rating',
            category: 'Professionalism',
            isRequired: true,
            description: 'Faculty\'s timeliness in starting and ending classes',
            scale: '1-10',
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'Preparation for the class',
            type: 'rating',
            category: 'Teaching Preparation',
            isRequired: true,
            description: 'How well prepared the faculty comes to class',
            scale: '1-10',
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'Completion of the syllabus on time',
            type: 'rating',
            category: 'Syllabus Management',
            isRequired: true,
            description: 'Faculty\'s ability to cover the entire syllabus within the allocated time',
            scale: '1-10',
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'Competency to handle the subject',
            type: 'rating',
            category: 'Subject Knowledge',
            isRequired: true,
            description: 'Faculty\'s expertise and competence in the subject matter',
            scale: '1-10',
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'Presentation skills (Voice, Clarity, Language)',
            type: 'rating',
            category: 'Communication Skills',
            isRequired: true,
            description: 'Faculty\'s ability to present content clearly with good voice and language',
            scale: '1-10',
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'Methodology used to impart the knowledge',
            type: 'rating',
            category: 'Teaching Methods',
            isRequired: true,
            description: 'Teaching techniques and methods used by the faculty',
            scale: '1-10',
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'Interaction with the students',
            type: 'rating',
            category: 'Student Engagement',
            isRequired: true,
            description: 'Faculty\'s engagement and interaction level with students',
            scale: '1-10',
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'Accessibility to the students outside the classroom',
            type: 'rating',
            category: 'Student Support',
            isRequired: true,
            description: 'Faculty\'s availability for student queries and support outside class hours',
            scale: '1-10',
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'Role as mentor',
            type: 'rating',
            category: 'Mentorship',
            isRequired: true,
            description: 'Faculty\'s effectiveness in guiding and mentoring students',
            scale: '1-10',
            createdAt: new Date().toISOString()
        }
    ];

    // Save all questions
    for (const question of questions) {
        await Storage.saveQuestion(question);
    }

    console.log(`✅ Specific 10 questions initialization complete! Added ${questions.length} questions.`);
    return questions.length;
}

function initializeSampleData() {
    console.log('🚀 Initializing sample data...');

    // Clear existing data first (except admin)
    const adminUsers = Storage.getUsers().filter(u => u.role === 'admin');
    localStorage.clear();

    // Restore admin users
    adminUsers.forEach(admin => Storage.saveUser(admin));

    // 1. Create Departments with Faculties
    const departments = [{
            id: Storage.generateId(),
            name: 'Computer Science',
            fullName: 'Department of Computer Science',
            faculties: [{
                    id: Storage.generateId(),
                    name: 'Dr. Sarah Johnson',
                    email: 'sarah.johnson@college.edu',
                    employeeId: 'CS001',
                    designation: 'Professor',
                    subjects: ['Data Structures', 'Algorithms', 'Database Systems']
                },
                {
                    id: Storage.generateId(),
                    name: 'Prof. Michael Chen',
                    email: 'michael.chen@college.edu',
                    employeeId: 'CS002',
                    designation: 'Associate Professor',
                    subjects: ['Web Development', 'Software Engineering', 'Mobile Apps']
                },
                {
                    id: Storage.generateId(),
                    name: 'Dr. Emily Rodriguez',
                    email: 'emily.rodriguez@college.edu',
                    employeeId: 'CS003',
                    designation: 'Assistant Professor',
                    subjects: ['Machine Learning', 'AI', 'Python Programming']
                }
            ]
        },
        {
            id: Storage.generateId(),
            name: 'Mathematics',
            fullName: 'Department of Mathematics',
            faculties: [{
                    id: Storage.generateId(),
                    name: 'Dr. Robert Wilson',
                    email: 'robert.wilson@college.edu',
                    employeeId: 'MATH001',
                    designation: 'Professor',
                    subjects: ['Calculus', 'Linear Algebra', 'Statistics']
                },
                {
                    id: Storage.generateId(),
                    name: 'Prof. Lisa Anderson',
                    email: 'lisa.anderson@college.edu',
                    employeeId: 'MATH002',
                    designation: 'Associate Professor',
                    subjects: ['Discrete Mathematics', 'Probability', 'Number Theory']
                }
            ]
        },
        {
            id: Storage.generateId(),
            name: 'Physics',
            fullName: 'Department of Physics',
            faculties: [{
                    id: Storage.generateId(),
                    name: 'Dr. James Thompson',
                    email: 'james.thompson@college.edu',
                    employeeId: 'PHY001',
                    designation: 'Professor',
                    subjects: ['Quantum Physics', 'Thermodynamics', 'Mechanics']
                },
                {
                    id: Storage.generateId(),
                    name: 'Dr. Maria Garcia',
                    email: 'maria.garcia@college.edu',
                    employeeId: 'PHY002',
                    designation: 'Assistant Professor',
                    subjects: ['Optics', 'Electronics', 'Modern Physics']
                }
            ]
        }
    ];

    departments.forEach(dept => Storage.saveDepartment(dept));

    // 2. Create Sample Students
    const students = [{
            id: Storage.generateId(),
            name: 'John Smith',
            email: 'john.smith@student.edu',
            rollNumber: 'CS2024001',
            department: 'Computer Science',
            year: 3,
            password: 'Student123',
            role: 'student',
            registeredAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            name: 'Emma Davis',
            email: 'emma.davis@student.edu',
            rollNumber: 'CS2024002',
            department: 'Computer Science',
            year: 2,
            password: 'Student123',
            role: 'student',
            registeredAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            name: 'Alex Johnson',
            email: 'alex.johnson@student.edu',
            rollNumber: 'MATH2024001',
            department: 'Mathematics',
            year: 3,
            password: 'Student123',
            role: 'student',
            registeredAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            name: 'Sophie Brown',
            email: 'sophie.brown@student.edu',
            rollNumber: 'PHY2024001',
            department: 'Physics',
            year: 2,
            password: 'Student123',
            role: 'student',
            registeredAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            name: 'David Wilson',
            email: 'david.wilson@student.edu',
            rollNumber: 'CS2024003',
            department: 'Computer Science',
            year: 1,
            password: 'Student123',
            role: 'student',
            registeredAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            name: 'Rachel Green',
            email: 'rachel.green@student.edu',
            rollNumber: 'MATH2024002',
            department: 'Mathematics',
            year: 2,
            password: 'Student123',
            role: 'student',
            registeredAt: new Date().toISOString()
        }
    ];

    students.forEach(student => Storage.saveUser(student));

    // 3. Create Sample Questions
    const questions = [{
            id: Storage.generateId(),
            text: 'How would you rate the faculty\'s knowledge of the subject?',
            type: 'rating',
            category: 'Knowledge',
            isRequired: true,
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'How clear and understandable are the faculty\'s explanations?',
            type: 'rating',
            category: 'Teaching',
            isRequired: true,
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'How would you rate the faculty\'s punctuality and regularity?',
            type: 'rating',
            category: 'Professionalism',
            isRequired: true,
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'How helpful is the faculty in resolving doubts and queries?',
            type: 'rating',
            category: 'Support',
            isRequired: true,
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'How would you rate the faculty\'s use of teaching aids and technology?',
            type: 'rating',
            category: 'Teaching Methods',
            isRequired: true,
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'What did you like most about this faculty\'s teaching?',
            type: 'text',
            category: 'Feedback',
            isRequired: false,
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'What suggestions do you have for improvement?',
            type: 'text',
            category: 'Suggestions',
            isRequired: false,
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            text: 'Would you recommend this faculty to other students?',
            type: 'choice',
            category: 'Recommendation',
            options: ['Definitely Yes', 'Yes', 'Maybe', 'No', 'Definitely No'],
            isRequired: true,
            createdAt: new Date().toISOString()
        }
    ];

    questions.forEach(question => Storage.saveQuestion(question));

    // 4. Create Sample Surveys
    const surveys = [{
            id: Storage.generateId(),
            title: 'Faculty Feedback - Fall 2024',
            description: 'Please provide your feedback on faculty performance for Fall 2024 semester',
            department: 'Computer Science',
            semester: 'Fall',
            year: 2024,
            facultyId: departments[0].faculties[0].id, // Dr. Sarah Johnson
            facultyName: 'Dr. Sarah Johnson',
            subject: 'Data Structures',
            questions: questions.map(q => q.id),
            isActive: true,
            startDate: '2024-11-01',
            endDate: '2024-12-15',
            createdBy: adminUsers[0] ? .id || 'admin',
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            title: 'Faculty Feedback - Fall 2024',
            description: 'Please provide your feedback on faculty performance for Fall 2024 semester',
            department: 'Computer Science',
            semester: 'Fall',
            year: 2024,
            facultyId: departments[0].faculties[1].id, // Prof. Michael Chen
            facultyName: 'Prof. Michael Chen',
            subject: 'Web Development',
            questions: questions.map(q => q.id),
            isActive: true,
            startDate: '2024-11-01',
            endDate: '2024-12-15',
            createdBy: adminUsers[0] ? .id || 'admin',
            createdAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            title: 'Faculty Feedback - Fall 2024',
            description: 'Please provide your feedback on faculty performance for Fall 2024 semester',
            department: 'Mathematics',
            semester: 'Fall',
            year: 2024,
            facultyId: departments[1].faculties[0].id, // Dr. Robert Wilson
            facultyName: 'Dr. Robert Wilson',
            subject: 'Calculus',
            questions: questions.map(q => q.id),
            isActive: true,
            startDate: '2024-11-01',
            endDate: '2024-12-15',
            createdBy: adminUsers[0] ? .id || 'admin',
            createdAt: new Date().toISOString()
        }
    ];

    surveys.forEach(survey => Storage.saveSurvey(survey));

    // 5. Create Sample Feedback Responses
    const feedbacks = [{
            id: Storage.generateId(),
            studentId: students[0].id, // John Smith
            surveyId: surveys[0].id,
            facultyId: departments[0].faculties[0].id,
            facultyName: 'Dr. Sarah Johnson',
            subject: 'Data Structures',
            department: 'Computer Science',
            semester: 'Fall',
            year: 2024,
            responses: {
                [questions[0].id]: 5, // Knowledge rating
                [questions[1].id]: 4, // Teaching clarity
                [questions[2].id]: 5, // Punctuality
                [questions[3].id]: 4, // Helpfulness
                [questions[4].id]: 4, // Teaching methods
                [questions[5].id]: 'Dr. Johnson explains complex concepts very clearly and provides excellent examples.',
                [questions[6].id]: 'More practical coding exercises would be helpful.',
                [questions[7].id]: 'Definitely Yes'
            },
            submittedAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            studentId: students[1].id, // Emma Davis
            surveyId: surveys[1].id,
            facultyId: departments[0].faculties[1].id,
            facultyName: 'Prof. Michael Chen',
            subject: 'Web Development',
            department: 'Computer Science',
            semester: 'Fall',
            year: 2024,
            responses: {
                [questions[0].id]: 5,
                [questions[1].id]: 5,
                [questions[2].id]: 4,
                [questions[3].id]: 5,
                [questions[4].id]: 5,
                [questions[5].id]: 'Prof. Chen makes web development fun and engaging with hands-on projects.',
                [questions[6].id]: 'Maybe include more advanced frameworks in the curriculum.',
                [questions[7].id]: 'Definitely Yes'
            },
            submittedAt: new Date().toISOString()
        },
        {
            id: Storage.generateId(),
            studentId: students[2].id, // Alex Johnson
            surveyId: surveys[2].id,
            facultyId: departments[1].faculties[0].id,
            facultyName: 'Dr. Robert Wilson',
            subject: 'Calculus',
            department: 'Mathematics',
            semester: 'Fall',
            year: 2024,
            responses: {
                [questions[0].id]: 4,
                [questions[1].id]: 4,
                [questions[2].id]: 5,
                [questions[3].id]: 3,
                [questions[4].id]: 3,
                [questions[5].id]: 'Good mathematical foundation and systematic approach.',
                [questions[6].id]: 'More office hours for doubt clearing would be appreciated.',
                [questions[7].id]: 'Yes'
            },
            submittedAt: new Date().toISOString()
        }
    ];

    feedbacks.forEach(feedback => Storage.saveFeedback(feedback));

    console.log('✅ Sample data initialization complete!');
    console.log(`📊 Created:`);
    console.log(`   • ${departments.length} departments with ${departments.reduce((acc, d) => acc + d.faculties.length, 0)} faculties`);
    console.log(`   • ${students.length} students`);
    console.log(`   • ${questions.length} questions`);
    console.log(`   • ${surveys.length} surveys`);
    console.log(`   • ${feedbacks.length} feedback responses`);

    return {
        departments: departments.length,
        faculties: departments.reduce((acc, d) => acc + d.faculties.length, 0),
        students: students.length,
        questions: questions.length,
        surveys: surveys.length,
        feedbacks: feedbacks.length
    };
}

// Auto-initialize if no data exists (DISABLED - use manual initialization)
// if (typeof window !== 'undefined' && Storage.getUsers().filter(u => u.role === 'student').length === 0) {
//     console.log('🔄 No student data found. Initializing sample data...');
//     initializeSampleData();
// }

// Export functions for global use
if (typeof window !== 'undefined') {
    window.SampleData = {
        initializeSampleData,
        initializeSpecific10Questions
    };
}