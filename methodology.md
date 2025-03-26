CHAPTER 3: METHODOLOGY 
3.1 Introduction 
This chapter will describe the methodology to be followed in the development of the Smart QR Code Based Attendance System. The methodology will adopt the Agile framework, which is well-suited for iterative development and will allow flexibility to incorporate stakeholder feedback throughout the process. Each phase of development including requirements gathering, system design, development, testing, deployment, and maintenance will be detailed comprehensively. This structured methodology will ensure that the final system will meet user needs, exceed expectations, and address deficiencies identified in existing QR code-based attendance systems, such as proxy attendance and limited student engagement, by delivering a secure, intuitive, and scalable solution.

3.2 Development Methodology 
The development of the proposed system will follow the Agile methodology, emphasizing collaboration, adaptability, and incremental progress. This approach will allow for continuous improvement and regular reassessment of the system’s direction based on input from stakeholders. The following phases will guide the development process, ensuring alignment with the system’s goals of efficiency, security, and user satisfaction.

3.2.1 Agile Phase of Development 
  
Figure 2.1: Agile Flow Diagram
Phase 1: Requirements Gathering 
1.	Identify Stakeholders: 
Key stakeholders, including lecturers, students, and administrators, will be identified through institutional directories and consultation with educational leadership. Their roles (e.g., session managers, attendees, overseers) and expectations (e.g., ease of use, data insights) will shape the system’s requirements. Early engagement via workshops will ensure their priorities will be reflected in the design.
User Personas Definition: 
User personas will be developed for each stakeholder group in order to represent their needs and behaviours: 
•	Lecturers: They will require tools to generate session-specific QR codes, access real-time attendance reports, and review student feedback.
•	Students: They will need to scan QR codes to mark attendance and access their attendance history effortlessly.
•	Administrators: They will need aggregated attendance analytics, user management capabilities (e.g., bulk imports) and tools to manage courses and departments.
2.	Stakeholder Interviews: 
Structured interviews with at least five representatives per group will be conducted, using open-ended questions (e.g., “What frustrates you about current attendance methods?”) to collect functional and non-functional requirements. These discussions will focus on pinpointing pain points in current systems (e.g., inefficiencies, inaccuracies) and gathering expectations for the new system (e.g., usability, reliability). This qualitative data will inform subsequent design and development phases.
1.	Requirement Prioritization and Analysis:
Collected requirements will be prioritized using techniques like MoSCoW (Must have, Should have, Could have, Won’t have) to focus on critical features first. User stories will be drafted in kanban board (e.g., Trello), such as (e.g., “As a student, I want to scan a QR code so I can mark my attendance quickly”, “As a lecturer, I want real-time attendance updates so I can focus on teaching.”), and tools like surveys or focus groups will supplement interviews to ensure comprehensive input.

Phase 2: System Design 
1. System Architecture Design: 
•	The architecture will be three tier to ensure scalability and maintainability: 
•	Frontend: The React.js will be utilized to create a responsive single-page application, leveraging Vite for fast builds and Ant Design for components like Card and Form. React Spring will animate elements (e.g., QR code scaling), and PWA support via VitePWA will enable offline access with service workers caching assets and browser local storage for data persistence.
•	Backend: Express.js running on Node.js will handle RESTful APIs requests, with JWT-based authentication securing user data and enabling real-time updates.
•	Database: MongoDB with Mongoose ODM will store user profiles, session details, and attendance records, supporting efficient data management and retrieval.
•	Proxy prevention will rely on device fingerprinting (combining screen, GPU, canvas, and audio attributes), QR expiration (e.g., 3-minute validity), and session status checks. Rate limiting will cap scan attempts (e.g., 15/minute per device), and composite fingerprints will detect cross-browser consistency.
•	PWA offline capabilities will be designed using service workers for caching and IndexedDB for local data storage, ensuring seamless operation without connectivity.

2. User Interface Prototyping: 
Wireframes for key interfaces such as Wireframes for critical interfaces such as QR code generation, student,lecturer dashboards, and admin panels will be developed using tools like Figma. Prototypes will incorporate animated transitions (e.g., fade-ins, scale effects) and responsive layouts from Ant Design to visualize user interactions and ensure an intuitive experience prior to coding.

3. Database Schema Design: 
MongoDB collections will include: users (e.g., userId, role, deviceFingerprint), sessions (e.g., sessionId, qrCode, expiration, active), attendance (e.g., userId, sessionId, status, compositeFingerprint), feedback (e.g., rating, comment, pace, interactivity, clarity, anonymous), units, courses and departments. Indexes will optimize lookups (e.g., sessionId + userId), and validation will reject duplicate scans or mismatched fingerprints.

Phase 3: Development 
1. Incrementally Develop Core Functionalities: 
1.	QR Code Generation and Scanning: 
•	QR codes will embed session IDs and timestamps, generated with time-based expiration and displayed with React Spring animations (e.g., pulsing frames). Scanning will use a library for camera input, with a dynamic overlay (e.g., corner markers, scanning line) enhancing visibility. Scans will halt after 30 seconds if unsuccessful, prompting a retry option.
•	Proxy prevention will verify QR data against active sessions, rejecting expired or invalid codes with Ant Design alerts (e.g., "QR code expired"). Device fingerprints will be collected on scan, compared to prior records to flag conflicts (e.g., same device marking multiple users).

2. Attendance Management: 
•	Scanned data will sync in real-time with MongoDB via Express.js APIs, ensuring accurate and up-to-date records across stakeholders. Real-time updates will refresh dashboards with polling or WebSocket connections. Scans will trigger API calls to Render, validating JWT, session status, and fingerprint uniqueness before updating MongoDB with present status. Already-marked attendance or device conflicts will trigger errors (e.g., "Attendance already recorded").
•	Logic will be coded to classify attendance as "present" or "absent" based on successful QR code scans within the session's active timeframe, with error handling for expired sessions. Edge cases (e.g., duplicate scans) will trigger error logs via Winston and user notifications.

2. Feedback System:
•	A feedback module will be developed using Ant Design's Form, Input, and Rate components, enabling students to submit 1–5 star ratings, pace ratings, clarity assessments, and comments post-session. Data will save to a feedback collection ({ sessionId, studentId, unit, course, rating, feedbackText, pace, interactivity, clarity, resources, anonymous }), with validation ensuring only attendees submit (checked via attendance status) and lecturers will view trends via Chart.js visualizations (e.g., average ratings per session).

3. Implement Modular Backend: 
•	Express.js middleware (e.g., Helmet, CORS) will secure APIs, while JWT will validate user identities and prevent unauthorized access. Error logging with Winston will track issues like failed scans or authentication attempts.
•	MongoDB will store session schedules and attendance records, with Mongoose ensuring data consistency and validation.

4. Frontend Development: 
•	Dynamic React components will be built for stakeholder dashboards (student, lecturer and admin portals), using Ant Design for a polished UI and Chart.js for analytics visualization and styled with Ant Design and themed via a ThemeContext with light/dark mode support.
•	Offline mode will cache assets with service workers (via VitePWA) and store offline data in browser local storage, syncing via a queue system when online, with Axios retry logic for failed requests.

Phase 4: Testing
1. Unit Testing: 
Individual components and modules will be tested using Jest and Enzyme for frontend, and Mocha and Chai for backend. Mock data will simulate various scenarios (e.g., valid/invalid QR codes, different user roles) to ensure robustness. Test coverage tools (e.g., Istanbul) will track code coverage, aiming for at least 80% coverage across the codebase.

2. Integration Testing: 
End-to-end flows will be simulated: a QR scan will trigger an API call, update MongoDB, and refresh dashboards, tested with Vitest for frontend interactions and Mocha for backend responses. Offline sync will be validated by toggling network states, ensuring browser local storage data merges correctly with MongoDB. Mock servers (e.g., MSW for frontend) will mimic backend behavior.

3. User Acceptance Testing (UAT): 
Stakeholders will participate in UAT sessions, using the system in real-world scenarios to identify usability issues and validate requirements. Feedback will be collected via surveys and interviews, with critical issues addressed before deployment. UAT will ensure the system meets user expectations and performs reliably in a live environment.

Phase 5: Deployment 
1. Deployment Planning: 
A detailed deployment plan will be created, outlining steps for server setup, database migration, and application deployment. Rollback procedures will be defined to handle potential issues during deployment. The plan will include a timeline, resource allocation, and communication strategy to ensure a smooth transition to the live environment.

2. Continuous Deployment: 
The system will be deployed using a CI/CD pipeline, automating the build, test, and deployment processes. Tools like GitHub Actions, Docker, and Kubernetes will be used to manage the pipeline, ensuring consistent and reliable deployments. Monitoring tools (e.g., Prometheus, Grafana) will track system performance and alert on issues.

Phase 6: Maintenance 
1. Ongoing Support: 
A support plan will be established, including a helpdesk for user inquiries and a ticketing system for issue tracking. Regular updates and patches will be released to address bugs, security vulnerabilities, and feature enhancements. User feedback will be continuously collected to guide future improvements.

2. Performance Monitoring: 
System performance will be monitored using tools like New Relic and Datadog, tracking metrics such as response times, error rates, and resource usage. Alerts will be configured to notify the development team of any performance issues, ensuring timely resolution. Regular performance reviews will identify areas for optimization and scaling.

3. Security Management: 
Security will be a priority throughout the system's lifecycle. Regular security audits will be conducted to identify and address vulnerabilities. Best practices for data protection, access control, and incident response will be followed. Security updates will be applied promptly to protect against emerging threats.

4. User Training: 
Training sessions will be conducted for stakeholders to ensure they are familiar with the system's features and functionality. Training materials, including user manuals and video tutorials, will be provided to support ongoing learning. Regular training updates will be offered as new features are introduced.

5. Documentation: 
Comprehensive documentation will be maintained, covering system architecture, design decisions, and implementation details. User guides and API documentation will be provided to support developers and end-users. Documentation will be regularly updated to reflect changes and new features.
