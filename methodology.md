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

3.3 Justification of Methodology
The Agile methodology was selected for this project due to several key advantages that align with the attendance system's development needs:

1. Iterative Development:
   - The complex nature of anti-spoofing measures and QR code security requires frequent validation and refinement through multiple iterations
   - Enables early detection of technical challenges in fingerprinting and device identification
   - Allows features to be tested with real users early to ensure they meet actual classroom conditions

2. Flexibility and Adaptability:
   - Educational requirements vary between departments, necessitating an approach that can accommodate evolving needs
   - Security measures can be strengthened incrementally as potential vulnerabilities are identified
   - QR code timing and rotation can be calibrated based on real-world testing
   - Anti-spoofing techniques can be refined through multiple iterations

3. Stakeholder Involvement:
   - Regular feedback from lecturers and students ensures user interface is intuitive
   - Administrators can validate reporting capabilities throughout development
   - Continuous engagement leads to higher acceptance and adoption rates
   - Real-world usage patterns inform refinement of device fingerprinting algorithms

4. Risk Mitigation:
   - Early development of core functionality (QR generation, authentication, device tracking)
   - Gradual implementation of more complex features (anti-spoofing, offline capabilities)
   - Regular testing of security features prevents major vulnerabilities at release
   - Allows for technology stack adjustments if performance issues are discovered

5. Efficient Resource Utilization:
   - Development effort focuses on highest-priority features first
   - Critical security features receive appropriate attention early in the process
   - Allows parallel development of frontend and backend components
   - Enables continuous deployment for testing with target user groups

The alternatives considered included Waterfall methodology, which was rejected due to its rigidity and inability to adapt to emerging security requirements, and Spiral methodology, which would have introduced unnecessary complexity given the project scope and timeline.

3.4 Data Collection 
Data collection methods will include both qualitative and quantitative approaches: 
1.	Surveys: During requirements gathering, surveys will be distributed via Google Forms or SurveyMonkey to 10-20 stakeholders (lecturers, students, admins) to quantify preferences for attendance tracking features. Questions will include Likert scales (e.g., "Rate the importance of real-time reporting: 1-5") and multiple-choice options (e.g., "Preferred QR scanning method: Camera / Manual entry"). Topics will cover usability (e.g., speed of current systems), reporting needs (e.g., daily vs. weekly summaries), and pain points (e.g., proxy attendance concerns), with results aggregated for statistical analysis.
2.	Interviews: In depth interviews with key stakeholders which are lecturers, students, and administrators will provide qualitative insights into specific pain points experienced with existing systems. These interviews will explore issues such as ease of use, accessibility concerns, or desired functionalities that are currently lacking. 
3.	Usage Analytics: Post-deployment, analytics tools (e.g. Vercel Analytics and Vercel speed Insights) will track feature usage: QR scan frequency, dashboard views, feedback submissions, and offline mode activations. Metrics will include daily active users, average session duration, and feature-specific interactions (e.g., "Export button clicks: 50/day"), collected via event tracking and visualized in dashboards (e.g., Chart.js graphs). This data will reveal adoption rates and highlight underused features needing promotion or redesign.
4.	System Feedback Mechanisms: The application will include dedicated UI components for collecting development feedback about the system itself (distinct from the academic session feedback). These interfaces will use Ant Design's Form components with dropdowns for categorization (e.g., "Issue type: Bug / Feature request / UI improvement"), severity ratings (1-5), free-text description fields, and optional screenshot attachments. This ongoing feedback loop about the application's performance and usability will help identify software issues, usability challenges, and feature suggestions that drive continuous improvement of the attendance system itself.

3.5 Data Analysis 
Data analysis techniques will involve both qualitative analysis of stakeholder interviews and quantitative analysis from surveys: 
1.	Qualitative Analysis: Thematic analysis of interview transcripts will be conducted using tools like NVivo or manual coding. Transcripts will be reviewed to identify recurring themes (e.g., “Ease of use,” “Security concerns”), sub-themes (e.g., “Slow manual processes”), and direct quotes (e.g., “I need attendance instantly”). These insights will prioritize features (e.g., real-time updates) and pinpoint gaps in existing systems (e.g., lack of proxy attendance prevention), validated through stakeholder workshops.
2.	Quantitative Analysis: Statistical analysis of survey responses will use tools like Excel or SPSS to calculate means, medians, and frequencies (e.g., “80% of lecturers prioritize real-time reporting”). Cross-tabulations will compare preferences across groups (e.g., lecturers vs. students on QR scanning speed), with chi-square tests assessing significance if sample sizes permit. Results will inform post-launch enhancements, focusing on high-demand features (e.g., detailed analytics for admins).
3.	Pattern of Usage Analysis: Post-deployment analytics will be analyzed with Google Analytics or custom dashboards to track interaction patterns over time (e.g., “QR scans peak at 9 AM”). Heatmaps will visualize click activity (e.g., frequent use of export buttons), and cohort analysis will assess retention (e.g., “80% of pilot users return weekly”). Underutilized features (e.g., feedback form with <10% usage) will trigger investigations—potentially needing UI tweaks or training videos.
4.	Feedback Evaluation: User feedback will be evaluated biweekly, categorizing submissions by frequency (e.g., “QR scan errors: 20 mentions”) and severity (e.g., “App crashes impact 50% of users”). A weighted scoring system (e.g., severity × frequency) will prioritize fixes, with qualitative comments analyzed for sentiment (e.g., “Love the speed” vs. “Too complex”). Results will feed into sprint backlogs, ensuring user-driven improvements (e.g., larger QR codes for visibility).

3.6 Chapter Conclusion 
In summary, this chapter has outlined a comprehensive methodology employing the Agile framework to develop the Smart QR Code Based Attendance System. By following a structured lifecycle requirements gathering, system design, development, testing, deployment, and maintenance augmented by robust data collection (surveys, interviews, analytics, feedback) and analytical techniques (thematic, statistical, usage pattern, feedback evaluation), the proposed system will deliver a forward-thinking solution tailored to educational institutions’ needs. This approach will address gaps in existing attendance systems (e.g., proxy vulnerabilities, limited interactivity) through iterative refinement and stakeholder involvement, ensuring continuous improvement based on real-world insights. The methodology positions the system as a scalable, secure, and user-centric tool, leveraging modern technologies and data-driven decision-making to enhance accountability and engagement in academic settings.


