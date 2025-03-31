CHAPTER 3: METHODOLOGY 

3.1 Introduction 
This chapter will describe the methodology to be followed in the development of the Smart QR Code Based Attendance System. The methodology will adopt the Agile framework, which is well-suited for iterative development and will allow flexibility to incorporate stakeholder feedback throughout the process. Each phase of development including requirements gathering, system design, development, testing, deployment, and maintenance will be detailed comprehensively. This structured methodology will ensure that the final system will meet user needs, exceed expectations, and address deficiencies identified in existing QR code-based attendance systems, such as proxy attendance and limited student engagement, by delivering a secure, intuitive, and scalable solution.

3.2 Development Methodology 
The development of the proposed system will follow the Agile methodology, emphasizing collaboration, adaptability, and incremental progress. This approach will allow for continuous improvement and regular reassessment of the system’s direction based on input from stakeholders. The following phases will guide the development process, ensuring alignment with the system’s goals of efficiency, security, and user satisfaction.

3.2.1 Agile Phase of Development 
  
Figure 2.1: Agile Flow Diagram
Phase 1: Requirements Gathering 
Stakeholders including lecturers, students, and administrators will be identified through institutional directories and consultation with educational leadership. Their roles and expectations will shape the system’s requirements. Early engagement via workshops will ensure their priorities are reflected in the design. User personas will be developed for each stakeholder group to represent their needs and behaviors. Lecturers will require tools to generate session-specific QR codes, access real-time attendance reports, and review student feedback. Students will need to scan QR codes to mark attendance and access their attendance history effortlessly. Administrators will need aggregated attendance analytics, user management capabilities, and tools to manage courses and departments.

Structured interviews with representatives from each group will be conducted using open-ended questions to collect functional and non-functional requirements. These discussions will focus on pinpointing pain points in current systems and gathering expectations for the new system. Collected requirements will be prioritized using techniques like MoSCoW to focus on critical features first. User stories will be drafted in kanban boards, and tools like surveys or focus groups will supplement interviews to ensure comprehensive input.

Phase 2: System Design 
The architecture will be three-tier to ensure scalability and maintainability. The frontend will use React.js to create a responsive single-page application, leveraging Vite for fast builds and Ant Design for components. Basic animations will be added for QR code display, and browser localStorage will be used for client-side data persistence with minimal offline capabilities. The backend will use Express.js running on Node.js to handle RESTful API requests, with JWT-based authentication securing user data and polling-based data updates. MongoDB with Mongoose ODM will store user profiles, session details, and attendance records, supporting efficient data management and retrieval. Proxy prevention will rely on device fingerprinting, QR expiration, IP address tracking, and session status checks. Rate limiting will cap scan attempts, and composite fingerprints will detect potential device sharing.

Wireframes for critical interfaces such as QR code generation, student and lecturer dashboards, and admin panels will be developed using tools like Figma. Prototypes will incorporate animated transitions and responsive layouts from Ant Design to visualize user interactions and ensure an intuitive experience prior to coding. MongoDB collections will include users, sessions, attendance, feedback, units, courses, and departments. Indexes will optimize lookups, and validation will reject duplicate scans or mismatched fingerprints.

Phase 3: Development 
QR codes will embed session IDs and timestamps, generated with time-based expiration and displayed with visual countdowns for users. Scanning will use a camera library with guidance overlays to enhance usability. Proxy prevention will verify QR data against active sessions, rejecting expired or invalid codes with clear user feedback messages. Device fingerprints will be collected on scan, compared to prior records to flag conflicts.

Scanned data will sync with MongoDB via Express.js APIs, ensuring accurate attendance records. Updates will refresh dashboards using polling mechanisms. The backend will implement advanced conflict detection techniques including exact device matching, IP address tracking, fingerprint similarity analysis, and time-based heuristics to identify potential proxy attendance attempts. A feedback module will be developed using Ant Design's components, enabling students to submit ratings and comments post-session. Data will save to a feedback collection, with validation ensuring only attendees submit, and lecturers will view trends via Chart.js visualizations.

Express.js middleware will secure APIs, while JWT will validate user identities and prevent unauthorized access. MongoDB will store session schedules and attendance records, with Mongoose ensuring data consistency and validation. Dynamic React components will be built for stakeholder dashboards using Ant Design for a polished UI and Chart.js for analytics visualization. Client-side data management will focus on localStorage for session persistence and user preferences, with periodic polling to synchronize with server data.

Phase 4: Testing
Individual components and modules will be tested manually to ensure they function as expected. Various scenarios will be simulated to verify robustness. End-to-end flows will be manually verified, and offline capabilities will be validated by toggling network states. Stakeholders will participate in UAT sessions, using the system in real-world scenarios to identify usability issues and validate requirements.

Phase 5: Deployment 
A deployment plan will be created, outlining steps for server setup, database configuration, and application deployment. The system will utilize a GitHub-based deployment workflow where the frontend will be deployed on Vercel, backend on Render.com, and MongoDB Atlas will serve as the database provider. Environment variables will manage configuration across different deployment environments.

Phase 6: Maintenance 
Regular updates and patches will be released to address bugs, security vulnerabilities, and feature enhancements. User feedback will be continuously collected to guide future improvements. Basic system performance will be monitored through manual checks and standard logging practices. Security updates will be applied promptly to protect against threats. Training materials, including user guides, will be provided to support users. System documentation will be maintained, covering system architecture, design decisions, and implementation details.

3.3 Justification of Methodology
The Agile methodology will be selected for this project due to several key advantages that align with the attendance system's development needs. The complex nature of anti-spoofing measures and QR code security will require frequent validation and refinement through multiple iterations, enabling early detection of technical challenges in fingerprinting and device identification. Features will be tested with real users early to ensure they meet actual classroom conditions.

Educational requirements vary between departments, necessitating an approach that can accommodate evolving needs. Security measures will be strengthened incrementally as vulnerabilities are identified, while QR code timing and rotation will be calibrated based on real-world testing. Anti-spoofing techniques will be refined through multiple iterations to improve effectiveness.

Regular feedback from lecturers and students will ensure the user interface remains intuitive, while administrators will validate reporting capabilities throughout development. Continuous engagement will lead to higher acceptance rates, and real-world usage patterns will inform refinement of device fingerprinting algorithms.

Risk mitigation will be achieved through early development of core functionality (QR generation, authentication, device tracking), followed by gradual implementation of more complex features (anti-spoofing, offline capabilities). Regular testing of security features will prevent major vulnerabilities at release, allowing for technology stack adjustments if performance issues emerge.

Development efforts will focus on highest-priority features first, with critical security features receiving appropriate attention early in the process. The approach will allow parallel development of frontend and backend components and enable continuous deployment for testing with target user groups.

The alternatives considered will include Waterfall methodology, which will be rejected due to its rigidity and inability to adapt to emerging security requirements, and Spiral methodology, which would introduce unnecessary complexity given the project scope and timeline.

3.4 Data Collection 
Data collection methods will include both qualitative and quantitative approaches that will be implemented during the development process:

Stakeholder Interviews will be conducted with 18 participants (7 lecturers, 9 students, and 2 administrators) from a local university to gather functional and non-functional requirements. These structured interviews will use open-ended questions about attendance tracking pain points, revealing issues like manual recording time consumption, verification difficulties, and record-keeping inconsistencies. These insights will inform QR-based automation, real-time dashboards, and conflict detection features.

System Usage Analytics will collect data via Vercel's free tier deployment insights and custom logging. The system will track QR scan success rates, completion times, device distribution, peak usage periods, conflict detection triggers, dashboard view frequency, and export function utilization through client-side events and request timestamps.

System Feedback Collection will gather user input through in-app forms, post-session surveys, structured usability testing, and system logs capturing errors and performance issues. This comprehensive approach will ensure feedback from multiple user perspectives to guide refinements.

Proxy Prevention Data will focus on fingerprint uniqueness analysis, QR code refresh patterns, rejected attendance attempts, IP clustering detection, and geographic anomalies for remote attempts. These metrics will be crucial for evaluating and enhancing security measures against proxy attendance.

3.5 Data Analysis 
Data analysis techniques will be applied to the collected data to derive actionable insights for system improvement:

Qualitative Feedback Analysis will examine interview transcripts, feedback submissions, and usability testing notes for patterns related to feature utility, pain points, interface clarity, and security perceptions. This thematic analysis will provide critical insights into user experience and system effectiveness across different stakeholder groups.

Quantitative Performance Analysis will evaluate attendance marking completion rates, setup time improvements, API response metrics, scanning success correlations with device types, conflict detection accuracy, and interface preferences. These statistics will provide objective measurements of system performance and user behavior patterns.

Usage Pattern Analysis will identify departmental differences, feature adoption rates, session timing patterns, device preference trends, and task completion time improvements. These findings will inform targeted optimizations for different user groups and usage scenarios throughout the academic environment.

Security Effectiveness Assessment will evaluate fingerprinting accuracy, anomaly detection performance, IP tracking precision, QR code expiration effectiveness, and unauthorized access prevention rates. This comprehensive evaluation will validate the security approach and guide refinements to anti-spoofing mechanisms.

3.6 Chapter Conclusion 
This chapter has outlined the Agile methodology that will be employed to develop the Smart QR Code Based Attendance System. The approach will incorporate structured phases from requirements gathering through maintenance, emphasizing iterative development and stakeholder feedback.

The system will implement multi-layered security through device fingerprinting, QR code rotation, and IP tracking to prevent proxy attendance. Iterative development will enable continuous refinement, ensuring both security effectiveness and usability. Data collection and analysis mechanisms will provide evidence for system improvements throughout the development lifecycle.

This methodology will provide a practical framework for balancing technical security requirements with user experience needs, particularly suited to addressing the challenges of QR-based attendance systems in educational environments.


