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
•	Frontend: React.js will be utilized to create a responsive single-page application, leveraging Vite for fast builds and Ant Design for components like Card and Form. Basic animations will be added for QR code display, and browser localStorage will be used for client-side data persistence with minimal offline capabilities.
•	Backend: Express.js running on Node.js will handle RESTful APIs requests, with JWT-based authentication securing user data and polling-based data updates.
•	Database: MongoDB with Mongoose ODM will store user profiles, session details, and attendance records, supporting efficient data management and retrieval.
•	Proxy prevention will rely on device fingerprinting (combining screen, GPU, canvas, and audio attributes), QR expiration (every 25-30 seconds), IP address tracking, and session status checks. Rate limiting will cap scan attempts, and composite fingerprints will detect potential device sharing.
•	Basic offline capabilities will be implemented using browser localStorage for temporary data storage, focusing on preserving critical user state during connectivity interruptions.

2. User Interface Prototyping: 
Wireframes for key interfaces such as Wireframes for critical interfaces such as QR code generation, student, lecturer dashboards, and admin panels will be developed using tools like Figma. Prototypes will incorporate animated transitions (e.g., fade-ins, scale effects) and responsive layouts from Ant Design to visualize user interactions and ensure an intuitive experience prior to coding.

3. Database Schema Design: 
MongoDB collections will include: users (e.g., userId, role, deviceFingerprint), sessions (e.g., sessionId, qrCode, expiration, active), attendance (e.g., userId, sessionId, status, compositeFingerprint), feedback (e.g., rating, comment, pace, interactivity, clarity, anonymous), units, courses and departments. Indexes will optimize lookups (e.g., sessionId + userId), and validation will reject duplicate scans or mismatched fingerprints.

Phase 3: Development 
1. Incrementally Develop Core Functionalities: 
1.	QR Code Generation and Scanning: 
•	QR codes will embed session IDs and timestamps, generated with time-based expiration (refreshing every 25-30 seconds) and displayed with visual countdowns for users. Scanning will use a camera library with guidance overlays to enhance usability. Scans will halt after 30 seconds if unsuccessful, prompting a retry option.
•	Proxy prevention will verify QR data against active sessions, rejecting expired or invalid codes with clear user feedback messages. Device fingerprints will be collected on scan, compared to prior records to flag conflicts (e.g., same device marking multiple users).

2. Attendance Management: 
•	Scanned data will sync with MongoDB via Express.js APIs, ensuring accurate attendance records. Updates will refresh dashboards using polling mechanisms every few seconds. Scans will trigger API calls, validating JWT, session status, and fingerprint uniqueness before updating MongoDB with present status. Already-marked attendance or device conflicts will trigger user-friendly error messages.
•	The backend will implement advanced conflict detection techniques including exact device matching, IP address tracking and collision detection, fingerprint similarity analysis, and time-based heuristics to identify potential proxy attendance attempts. The system will record client IP addresses with attendance records to detect when multiple students attempt to mark attendance from the same network location within suspicious timeframes.

2. Feedback System:
•	A feedback module will be developed using Ant Design's Form, Input, and Rate components, enabling students to submit 1–5 star ratings, pace ratings, clarity assessments, and comments post-session. Data will save to a feedback collection ({ sessionId, studentId, unit, course, rating, feedbackText, pace, interactivity, clarity, resources, anonymous }), with validation ensuring only attendees submit (checked via attendance status) and lecturers will view trends via Chart.js visualizations (e.g., average ratings per session).

3. Implement Modular Backend: 
•	Express.js middleware (e.g., CORS) will secure APIs, while JWT will validate user identities and prevent unauthorized access. Standard error handling will track issues like failed scans or authentication attempts.
•	MongoDB will store session schedules and attendance records, with Mongoose ensuring data consistency and validation.

4. Frontend Development: 
•	Dynamic React components will be built for stakeholder dashboards (student, lecturer and admin portals), using Ant Design for a polished UI and Chart.js for analytics visualization, styled with Ant Design and themed via a ThemeContext with light/dark mode support.
•	Client-side data management will focus on localStorage for session persistence and user preferences, with periodic polling to synchronize with server data. The application will provide basic functionality during brief connectivity interruptions.

Phase 4: Testing
1. Manual Testing: 
Individual components and modules will be tested manually to ensure they function as expected. Various scenarios will be simulated (e.g., valid/invalid QR codes, different user roles, device fingerprint conflicts, same IP address multiple requests) to verify robustness. Test cases will focus on critical security features, particularly anti-spoofing mechanisms like device fingerprinting, IP tracking, and QR code expiration.

2. Integration Testing: 
End-to-end flows will be manually verified: a QR scan will trigger an API call, update MongoDB, and refresh dashboards. Offline capabilities will be validated by toggling network states, ensuring browser local storage data synchronizes correctly with MongoDB when connectivity is restored.

3. User Acceptance Testing (UAT): 
Stakeholders will participate in UAT sessions, using the system in real-world scenarios to identify usability issues and validate requirements. Feedback will be collected via surveys and interviews, with critical issues addressed before deployment. UAT will ensure the system meets user expectations and performs reliably in a live environment.

Phase 5: Deployment 
1. Deployment Planning: 
A deployment plan will be created, outlining steps for server setup, database configuration, and application deployment. The plan will include a timeline and resource allocation to ensure a smooth transition to the live environment.

2. Deployment Strategy: 
The system will utilize a GitHub-based deployment workflow where:
- Frontend will be deployed on Vercel, which automatically builds and deploys when changes are pushed to the repository
- Backend will be deployed on Render.com, configured to deploy when updates are detected in the GitHub repository
- MongoDB Atlas will serve as the database provider
- GitHub's security scanning will help identify potential vulnerabilities in the codebase
- Environment variables will manage configuration across different deployment environments
- This approach creates a basic CI/CD pipeline where code pushes trigger automated security checks and deployments

Phase 6: Maintenance 
1. Ongoing Support: 
Regular updates and patches will be released to address bugs, security vulnerabilities, and feature enhancements. User feedback will be continuously collected to guide future improvements.

2. Performance Monitoring: 
Basic system performance will be monitored through manual checks and standard logging practices. Regular performance reviews will identify areas for optimization.

3. Security Management: 
Security will be a priority throughout the system's lifecycle. Best practices for data protection, access control, and input validation will be followed. Security updates will be applied promptly to protect against threats.

4. User Training: 
Training materials, including user guides, will be provided to support users. Basic documentation will help users understand system functionality.

5. Documentation: 
System documentation will be maintained, covering system architecture, design decisions, and implementation details. User guides and API documentation will be provided to support developers and end-users.
