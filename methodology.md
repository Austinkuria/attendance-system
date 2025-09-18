CHAPTER 3: METHODOLOGY 

3.1 Introduction 
This chapter describes the methodology that was followed in the development of the QRollCall Smart Attendance System. The methodology adopted the Agile framework, which was well-suited for iterative development and allowed flexibility to incorporate stakeholder feedback throughout the process. Each phase of development including requirements gathering, system design, development, testing, deployment, and maintenance was detailed comprehensively. This structured methodology ensured that the final system met user needs, exceeded expectations, and addressed deficiencies identified in existing QR code-based attendance systems, such as proxy attendance and limited student engagement, by delivering a secure, intuitive, and scalable solution.

3.2 Development Methodology 
The development of the system followed the Agile methodology, emphasizing collaboration, adaptability, and incremental progress. This approach allowed for continuous improvement and regular reassessment of the system's direction based on input from stakeholders. The following phases guided the development process, ensuring alignment with the system's goals of efficiency, security, and user satisfaction.

3.2.1 Agile Phase of Development 
  
Figure 2.1: Agile Flow Diagram
Phase 1: Requirements Gathering 
Stakeholders including lecturers, students, and administrators were identified through institutional directories and consultation with educational leadership. Their roles and expectations shaped the system's requirements. Early engagement via workshops ensured their priorities were reflected in the design. User personas were developed for each stakeholder group to represent their needs and behaviors. Lecturers required tools to generate session-specific QR codes, access real-time attendance reports, and review student feedback. Students needed to scan QR codes to mark attendance and access their attendance history effortlessly. Administrators needed aggregated attendance analytics, user management capabilities, and tools to manage courses and departments.

Structured interviews with representatives from each group were conducted using open-ended questions to collect functional and non-functional requirements. These discussions focused on pinpointing pain points in current systems and gathering expectations for the new system. Collected requirements were prioritized using techniques like MoSCoW to focus on critical features first. User stories were drafted in kanban boards, and tools like surveys and focus groups supplemented interviews to ensure comprehensive input.

Phase 2: System Design 
The architecture was designed as a three-tier system to ensure scalability and maintainability. The frontend used React.js to create a responsive single-page application, leveraging Vite for fast builds and Ant Design for components. Animations were added for QR code display, and browser localStorage was used for client-side data persistence with offline capabilities. The backend used Express.js running on Node.js to handle RESTful API requests, with JWT-based authentication securing user data and polling-based data updates every 30 seconds. MongoDB with Mongoose ODM stored user profiles, session details, and attendance records, supporting efficient data management and retrieval. Proxy prevention relied on device fingerprinting, QR expiration (3-minute rotation), IP address tracking, and session status checks. Rate limiting capped scan attempts at 15 requests per minute, and composite fingerprints detected potential device sharing.

Wireframes for critical interfaces such as QR code generation, student and lecturer dashboards, and admin panels were developed using tools like Figma. Prototypes incorporated animated transitions and responsive layouts from Ant Design to visualize user interactions and ensure an intuitive experience prior to coding. MongoDB collections included users, sessions, attendance, feedback, units, courses, and departments. Indexes optimized lookups, and validation rejected duplicate scans or mismatched fingerprints.

Phase 3: Development 
QR codes embedded session IDs and timestamps, generated with 3-minute expiration and displayed with visual countdowns for users. Scanning used a camera library with guidance overlays to enhance usability. Proxy prevention verified QR data against active sessions, rejecting expired or invalid codes with clear user feedback messages. Device fingerprints were collected on scan and compared to prior records to flag conflicts.

Scanned data synced with MongoDB via Express.js APIs, ensuring accurate attendance records. Updates refreshed dashboards using 30-second polling mechanisms. The backend implemented advanced conflict detection techniques including exact device matching, IP address tracking, fingerprint similarity analysis, and time-based heuristics to identify potential proxy attendance attempts. A feedback module was developed using Ant Design's components, enabling students to submit ratings and comments post-session. Data was saved to a feedback collection, with validation ensuring only attendees submitted, and lecturers viewed trends via Chart.js visualizations.

Express.js middleware secured APIs, while JWT validated user identities and prevented unauthorized access. MongoDB stored session schedules and attendance records, with Mongoose ensuring data consistency and validation. Dynamic React components were built for stakeholder dashboards using Ant Design for a polished UI and Chart.js for analytics visualization. Client-side data management focused on localStorage for session persistence and user preferences, with periodic polling to synchronize with server data.

Phase 4: Testing
Individual components and modules were tested to ensure they functioned as expected. Various scenarios were simulated to verify robustness. End-to-end flows were verified, and offline capabilities were validated by toggling network states. Stakeholders participated in UAT sessions, using the system in real-world scenarios to identify usability issues and validate requirements. Specific testing focused on authentication workflows, QR code generation and scanning, device fingerprinting accuracy, and attendance marking flows across different devices and browsers.

The testing approach included:
- Authentication module validation with various credential combinations
- QR code generation and scanning across multiple device types
- Anti-spoofing measures verification through attempted proxy attendance
- Cross-browser compatibility testing on Chrome, Firefox, Safari, and Edge
- Performance assessment under various load conditions
- Security testing including JWT validation and role-based access control
- Database performance and integrity validation

Phase 5: Deployment 
A deployment plan was created, outlining steps for server setup, database configuration, and application deployment. The system utilized a GitHub-based deployment workflow where the frontend was deployed on Vercel, backend on Render.com (free tier), and MongoDB Atlas (M0 free tier) served as the database provider. Environment variables managed configuration across different deployment environments.

The deployment configuration included:
- Frontend: Vercel with continuous deployment from GitHub repository
- Backend: Render.com Web Service with 512MB RAM allocation and shared CPU resources
- Database: MongoDB Atlas M0 free tier with appropriate indexes and access controls
- HTTPS for all communications with TLS 1.3
- Environment variables stored securely in respective platform settings

Phase 6: Maintenance 
Regular updates and patches were released to address bugs, security vulnerabilities, and feature enhancements. User feedback was continuously collected to guide future improvements. System performance was monitored through manual checks and standard logging practices. Security updates were applied promptly to protect against threats. Training materials, including user guides, were provided to support users. System documentation was maintained, covering system architecture, design decisions, and implementation details.

3.3 Justification of Methodology
The Agile methodology was selected for this project due to several key advantages that aligned with the attendance system's development needs. The complex nature of anti-spoofing measures and QR code security required frequent validation and refinement through multiple iterations, enabling early detection of technical challenges in fingerprinting and device identification. Features were tested with real users early to ensure they met actual classroom conditions.

Educational requirements varied between departments, necessitating an approach that could accommodate evolving needs. Security measures were strengthened incrementally as vulnerabilities were identified, while QR code timing and rotation were calibrated based on real-world testing. Anti-spoofing techniques were refined through multiple iterations to improve effectiveness.

Regular feedback from lecturers and students ensured the user interface remained intuitive, while administrators validated reporting capabilities throughout development. Continuous engagement led to higher acceptance rates, and real-world usage patterns informed refinement of device fingerprinting algorithms.

Risk mitigation was achieved through early development of core functionality (QR generation, authentication, device tracking), followed by gradual implementation of more complex features (anti-spoofing, offline capabilities). Regular testing of security features prevented major vulnerabilities at release, allowing for technology stack adjustments when performance issues emerged.

Development efforts focused on highest-priority features first, with critical security features receiving appropriate attention early in the process. The approach allowed parallel development of frontend and backend components and enabled continuous deployment for testing with target user groups.

The alternatives considered included Waterfall methodology, which was rejected due to its rigidity and inability to adapt to emerging security requirements, and Spiral methodology, which would have introduced unnecessary complexity given the project scope and timeline.

3.4 Data Collection 
Data collection methods included both qualitative and quantitative approaches implemented during the development process:

Stakeholder Interviews were conducted with 18 participants (7 lecturers, 9 students, and 2 administrators) from a local university to gather functional and non-functional requirements. These structured interviews used open-ended questions about attendance tracking pain points, revealing issues like manual recording time consumption, verification difficulties, and record-keeping inconsistencies. These insights informed QR-based automation, real-time dashboards, and conflict detection features.

System Usage Analytics collected data via Vercel's deployment insights and custom logging. The system tracked QR scan success rates, completion times, device distribution, peak usage periods, conflict detection triggers, dashboard view frequency, and export function utilization through client-side events and request timestamps.

System Feedback Collection gathered user input through in-app forms, post-session surveys, structured usability testing, and system logs capturing errors and performance issues. This comprehensive approach ensured feedback from multiple user perspectives to guide refinements.

Proxy Prevention Data focused on fingerprint uniqueness analysis, QR code refresh patterns, rejected attendance attempts, IP clustering detection, and geographic anomalies for remote attempts. These metrics were crucial for evaluating and enhancing security measures against proxy attendance.

3.5 Data Analysis 
Data analysis techniques were applied to the collected data to derive actionable insights for system improvement:

Qualitative Feedback Analysis examined interview transcripts, feedback submissions, and usability testing notes for patterns related to feature utility, pain points, interface clarity, and security perceptions. This thematic analysis provided critical insights into user experience and system effectiveness across different stakeholder groups.

Quantitative Performance Analysis evaluated attendance marking completion rates, setup time improvements, API response metrics, scanning success correlations with device types, conflict detection accuracy, and interface preferences. These statistics provided objective measurements of system performance and user behavior patterns.

Usage Pattern Analysis identified departmental differences, feature adoption rates, session timing patterns, device preference trends, and task completion time improvements. These findings informed targeted optimizations for different user groups and usage scenarios throughout the academic environment.

Security Effectiveness Assessment evaluated fingerprinting accuracy, anomaly detection performance, IP tracking precision, QR code expiration effectiveness, and unauthorized access prevention rates. This comprehensive evaluation validated the security approach and guided refinements to anti-spoofing mechanisms.

3.6 Chapter Conclusion 
This chapter has outlined the Agile methodology that was employed to develop the QRollCall Smart Attendance System. The approach incorporated structured phases from requirements gathering through maintenance, emphasizing iterative development and stakeholder feedback.

The system implemented multi-layered security through device fingerprinting, 3-minute QR code rotation, and IP tracking to prevent proxy attendance. Iterative development enabled continuous refinement, ensuring both security effectiveness and usability. Data collection and analysis mechanisms provided evidence for system improvements throughout the development lifecycle.

This methodology provided a practical framework for balancing technical security requirements with user experience needs, particularly suited to addressing the challenges of QR-based attendance systems in educational environments.


