  
SMART QR CODE BASED STUDENT ATTENDANCE SYSTEM 
 
BY: 
AUSTIN KURIA MAINA 
PA106/G/14998/21 

THE SCHOOL OF PURE AND APPLIED SCIENCES
DEPARTMENT OF PURE AND APPLIED SCIENCE

A Project Proposal Submitted in Partial Fulfilment of The Requirements For
The Degree of Bachelor of Science in Software Engineering at Kirinyaga University
SUPERVISOR: MADAM ROSE MUNYAO

DATE: APRIL 2025 
PRELIMINARY PAGES
DEDICATION 
I dedicate this proposed system to my family for their endless love and support throughout my academic journey. I also dedicate this work to my lecturers, mentors, and friends whose encouragement and valuable feedback have greatly contributed to the success of this proposed system.
ACKNOWLEDGEMENT 
I am grateful for the management of Kirinyaga University for the chance to learn and acquire great skills. I would also like to thank Madam Rose Munyao for supporting and guiding me to do my best even when things get tough. I would like to thank my course mates who have instilled a sense of encouragement and perseverance while carrying out this practical task. 
DECLARATION  
The following project research is my original work and has not been presented for award of a degree or for any similar purpose in any other institution. The following research project has been submitted with my approval as the University project supervisor. 

Signature: ……………………………….     Date: ……………………………………….  
 
SUPERVISOR  
Name: Madam Rose Munyao 
Signature: ……………………………….     Date: ………………………………………. 
ABSTRACT 
The proposed Smart QR Code Based Student Attendance System will address inefficiencies, inaccuracies, high costs, and privacy concerns in attendance monitoring by leveraging QR code technology for real-time tracking. Lecturers will generate unique, session-specific QR codes, enabling students to mark attendance quickly via smartphones, while device tracking and authentication will prevent proxy attendance to ensure data integrity. Developed with the MERN stack (MongoDB, Express.js, React, Node.js) using Agile methodology, the system will incorporate stakeholder feedback to ensure usability, requiring no costly hardware. It will offer offline syncing, feedback forms, and interactive dashboards, delivering streamlined processes, improved accuracy, and enhanced student engagement at minimal cost.

LIST OF FIGURES 
1.	Figure 1.1: Context Diagram
2.	Figure 2.1: Agile Flow Diagram







Table Of Contents 
PRELIMINARY PAGES	i
ACKNOWLEDGEMENT	i
ABSTRACT	ii
LIST OF FIGURES	ii
CHAPTER ONE: INTRODUCTION	1
1.1 Introduction to the Chapter	1
1.2 Background	1
1.3 Current/Existing System	2
1.4 Problem Statement	3
1.5 Proposed System	4
1.6 Purpose of the Study	5
1.7 General Objective	6
1.8 Specific Objectives	6
1.9 Justification	6
1.10 Scope	7
1.11 Limitations	8
1.12 Significance of the Study	8
1.13 Operational Definition of Terms	9
CHAPTER TWO: LITERATURE REVIEW	10
2.1 Introduction	10
2.2 Related Literature Review	11
Gaps/Lacuna	12
2.4 Context Diagram	13
2.5 Chapter Conclusion	15
CHAPTER 3: METHODOLOGY	16
3.1 Introduction	16
3.2 Development Methodology	16
3.2.1 Agile Phase of Development	17
3.3 Data Collection	26
3.4 Data Analysis	28
3.5 Chapter Conclusion	29
CHAPTER 4: SYSTEM DESIGN	29
4.1 Introduction	29
4.2 Requirements	32
4.2.1 Functional Requirements:	32
4.2.2 Non-Functional Requirements:	34
4.3 Context Level Diagram	36
4.4 Input design (User interfaces)	44
4.5 Process Design	44
4.6 Database Design	49
4.7 Output Design (Report Specifications)	57
Chapter Conclusion	61
CHAPTER 5: SYSTEM TESTING AND IMPLEMENTATION	61
5.1 Introduction	61
5.2 Unit Testing	63
5.3 Integration Testing	66
5.4 System Testing	66
5.5 Database Testing	67
5.6 Implementation Requirements	68
5.7 Coding Tools	68
5.8 System Home Page or Other Relevant Pages	69
5.9 Chapter Conclusion	69
CHAPTER 6: CONCLUSION AND RECOMMENDATIONS	71
6.1 Introduction	71
6.2	Conclusion	71
6.3 Recommendation	71
6.4 Future Work	72
REFERENCES	73
Appendices	74

 
 
CHAPTER ONE: INTRODUCTION 
1.1 Introduction to the Chapter 
This chapter will introduce the Smart QR Code Based Student Attendance System, outlining its rationale, purpose, and significance in addressing persistent attendance management challenges in educational institutions. It will provide a historical and technological context for attendance tracking, highlight gaps in existing systems, and articulate the problem statement. The chapter will conclude with the purpose, objectives, scope, limitations, and significance of the proposed system, setting the foundation for subsequent sections.
1.2 Background 
Effective attendance management is critical in educational institutions to ensure student accountability, comply with academic policies, and maintain accurate records. Historically, schools have depended on manual methods such as roll calls or sign-in sheets. Although these approaches are simple, they are time-consuming and susceptible to errors, such as overlooked names or missing signatures, which compromise the reliability of attendance data (Masalha & Hirzallah, 2014).
With technological advancements, many institutions have adopted digital solutions to enhance this process. Biometric systems utilizing fingerprints or facial recognition, mobile applications for self-check-ins, and RFID-based tracking have improved both accuracy and efficiency compared to traditional methods (Patel et al., 2019). However, these solutions present notable drawbacks. Biometric systems require expensive hardware and raise privacy concerns, mobile applications depend on consistent internet connectivity and may not be accessible to all users, and RFID systems demand significant infrastructure investment (Sharma & Kumar, 2019). These challenges underscore the need for a cost-effective, accessible, and user-friendly alternative.
My proposed Smart QR Code Based Student Attendance System addresses this need with a practical and efficient solution. By generating unique QR codes for each class session, students can scan them using their smartphones to record attendance instantly in a centralized database. This system aims to improve efficiency, ensure accuracy, and increase student engagement, offering a modern approach to attendance management in educational settings.
1.3 Current/Existing System 
Many educational institutions have adopted digital tools to improve attendance tracking, including biometric systems, RFID tags, and QR code-based applications. These technologies offer advantages over manual roll calls, yet they frequently fall short of addressing essential requirements. Biometric systems, which rely on fingerprints or facial recognition, provide high accuracy but involve costly hardware and generate privacy concerns among students (Federal Trade Commission, 2023). RFID systems track attendance via tags, but their implementation requires substantial infrastructure investment, rendering them impractical for many institutions. QR code-based systems, while more affordable and simpler, exhibit limitations that my proposed system seeks to overcome. Many lack robust security features, such as user authentication, enabling proxy attendance where one student scans a code on behalf of another thus undermining data integrity (Pati, S., et al., 2023). For example, some systems verify only the scan itself, not the identity or device of the user, allowing inaccuracies. Others fail to provide real-time updates, resulting in delayed records, or require uninterrupted internet access, limiting their utility in areas with poor connectivity. While some systems offer educators dashboards to monitor attendance trends, these tools are often complex and necessitate technical expertise that not all lecturers possess. Furthermore, existing solutions rarely incorporate features to engage students, such as feedback mechanisms, restricting their role to basic record-keeping rather than enhancing the classroom experience.
The expense and complexity of these systems often discourage adoption. Implementation may involve extensive training or specialized equipment, posing barriers for smaller institutions. Although QR code technology holds promise as a streamlined approach, current implementations frequently fail to deliver on accuracy, usability, and student involvement. My proposed Smart QR Code Based Student Attendance System aims to address these shortcomings by offering an effective, accessible solution with innovative features designed for educational environments.
1.4 Problem Statement 
In most educational institutions, faces significant challenges that demand a better solution. Traditional methods, such as roll calls and sign-in sheets, consume considerable classroom time often 10-15 minutes per session and are prone to errors, such as missed names or unrecorded signatures. Proxy attendance, where one student falsely marks another as present, is a prevalent issue, weakening accountability and trust in the records.
Modern technological solutions attempt to resolve these problems but often prove inadequate. Biometric systems employing fingerprints or facial scans offer precision but are prohibitively expensive and raise privacy concerns, making them unfeasible for many schools. Mobile applications require reliable internet connectivity, which is not universally available, and may pose usability challenges for students unfamiliar with technology. Existing QR code systems provide a simpler alternative, yet most lack sufficient security measures to prevent proxy attendance, real-time data updates to maintain current records, or features to engage students beyond basic check-ins (Pati, S., et al., 2023). These deficiencies leave institutions with options that are either costly, complex, or incomplete.
This ongoing need for an efficient, affordable, and engaging attendance system drives my development of the Smart QR Code Based Student Attendance System as my final-year project. This system will ensure accurate tracking, prevent proxy attendance, and foster stronger connections between students and educators, addressing the limitations of current methods (Student Attendance Information System Using QR Code At ITSNU Kalimantan, 2022; Enhancing attendance tracking using animated QR codes, 2023).
1.5 Proposed System 
The Proposed Smart QR Code Based Attendance System will help alleviate the inefficiency and problems associated with conventional methods of recording attendance. This system The  proposed system will solve the problems of traditional and existing attendance methods by offering a simple, efficient platform built with the MERN stack (MongoDB, Express.js, React, Node.js). This system will make tracking attendance in schools faster, more reliable, and engaging for all users, transforming a routine task into an opportunity for better classroom management and student involvement.
Key Features
The system will bring practical tools to improve attendance management through smart design and technology. Each class session will have its own unique QR code, which students will scan with their smartphones to mark their attendance instantly, with the data saved directly into a MongoDB database for easy access. Updates will happen in real time, meaning attendance records will sync immediately across all devices, so lecturers and administrators always have the latest information without waiting. For areas with poor internet, an offline mode will let students check in without a connection, and the system will sync the data later using browser storage once online again. Security will be a priority, with device tracking and secure logins managed by Express.js and Node.js to verify each student, ensuring no one can mark attendance for someone else. To keep students engaged, the system will offer feedback forms and interactive dashboards built with React, allowing them to share their thoughts after class and giving lecturers a clear view of how sessions went.
Benefits
This system will deliver clear advantages that address current challenges and improve the educational experience. By using QR codes, it will cut down on errors like missed names or forgotten signatures, making attendance records more accurate and trustworthy. Accountability will rise because the secure login and device checks will stop proxy attendance, ensuring only students who are present get marked, which builds responsibility. The process will be faster too, with quick scans saving valuable classroom time that roll calls often waste, letting classes start sooner. Engagement will improve as well, since feedback tools will invite students to participate more and share insights, while giving educators useful data to understand their classes better. Best of all, it will stay affordable and scalable, relying only on smartphones instead of expensive equipment, so schools of any size can use it without breaking their budget. Together, these benefits will create a smoother, more reliable, and interactive way to handle attendance.
1.6 Purpose of the Study 
This study will design and develop the Smart QR Code Based Student Attendance System to transform attendance tracking in educational institutions. By using QR code technology, it will replace slow and error prone manual methods like roll calls that waste time and miss students with a fast, accurate solution built on the MERN stack (MongoDB, Express.js, React, Node.js). The system will tackle key challenges by preventing proxy attendance through secure authentication, delivering real time data to educators, and encouraging student participation with tools like feedback forms and dashboards. This approach will not only streamline daily attendance tasks but also support lecturers with instant insights into class attendance trends and help administrators monitor participation across the school. For students, it will offer a simple way to stay engaged, turning attendance into a step toward better learning experiences. Ultimately, this study aims to create a practical, affordable tool that improves efficiency, builds accountability, and strengthens the connection between teaching and learning.
1.7 General Objective 
To design and implement a robust attendance management system, which utilizes QR code technology in facilitating an efficient attendance process that guarantees accuracy, security, and an improved user experience in an educational setting. 
1.8 Specific Objectives 
1.	To enhance real time attendance accuracy through QR code technology. 
2.	To prevent proxy attendance through device tracking and user authentication. 
3.	Improve student engagement by using post attendance tools like feedback mechanisms. 
1.9 Justification 
The Smart QR Code Based Student Attendance System will be worth implementing because it will reshape how schools manage attendance, offering a practical and affordable alternative to current methods. Manual approaches, like roll calls, are slow and prone to mistakes, while biometric systems, though accurate, come with high costs and privacy concerns that many institutions cannot handle. This proposed system will overcome these issues by providing a scalable solution that works in small classrooms or large universities, using only smartphones instead of expensive equipment.
Beyond fixing these problems, the system will meet a growing need in education for data driven insights, as schools increasingly focus on tracking student engagement and performance. It will give educators real time data to spot participation trends and pinpoint where students or groups need extra help, making attendance more than just a record it will become a tool for improving learning. With its low cost, ease of use, and ability to engage students through feedback, this system will bring clear value to schools seeking efficient, modern solutions.
1.10 Scope 
The Smart QR Code Based Student Attendance System will be designed to transform attendance management in schools by removing the inefficiencies and errors of traditional methods. It will focus on real time tracking with QR codes, where each class session generates a unique code for students to scan with their smartphones, logging attendance instantly into a centralized MongoDB database. This will cut down on administrative work and ensure records are accurate. The system will also sync data in real time using Node.js and Express.js, let students mark attendance offline with browser storage syncing later, and use secure authentication to stop proxy attendance, all built with the MERN stack (MongoDB, Express.js, React, Node.js).
This system will serve three main users that is lecturers, students, and administrators with tailored features. Lecturers will create QR codes for their classes and check attendance live through a React based interface, while students will scan codes to check in and see their history on the same platform. Administrators will get detailed reports and track participation trends across the school, ensuring everyone benefits from an efficient, connected approach. The system will be developed using Agile methodology, involving regular feedback from these users during design and testing phases, followed by pilot tests in selected classrooms to fix any issues before full rollout, supported by training and ongoing help.
The technology will rely on React to create a responsive web app accessible on phones and computers, with Express.js and Node.js handling the backend and MongoDB storing all data securely. This setup will keep the system fast, simple, and affordable, needing no special hardware beyond what users already have. However, it will depend on students having smartphones to scan QR codes, which might not work for everyone, and while offline mode will help, some features will need internet to fully function. The focus will stay on attendance tracking, not broader academic tracking, to keep the system clear and effective.
1.11 Limitations 
The Smart QR Code Based Student Attendance System will offer many improvements over traditional methods, but it will face some challenges. It will rely on students having smartphones to scan QR codes, and not everyone may own a suitable device or have steady internet access at home. This could create gaps, where some students participate less because they lack the right tools, especially in areas with limited technology access. 
Another challenge will come from possible technical problems during setup or daily use—bugs or server issues might disrupt classes if not fixed quickly, so reliable support will be essential. Plus, since the system will collect student data like attendance times and device details, it will need strong security to protect privacy and prevent breaches, adding extra responsibility to keep information safe. These limits will need careful planning to ensure the system works well for all users.
1.12 Significance of the Study  
The Smart QR Code Based Student Attendance System will hold significant value by transforming attendance management into a tool for better educational practices. This study will enhance efficiency in schools, replacing slow manual methods with a fast, accurate system that saves time and reduces errors. It will foster accountability among students by using secure authentication to stop proxy attendance, ensuring records reflect who is truly present. For educators, it will provide real time data and trends through dashboards, offering clear insights into class participation and highlighting where students may need support.
Beyond these immediate gains, the system will boost student engagement across diverse school settings by adding feedback tools that let students share their thoughts after sessions, a feature inspired by modern learning needs. This will turn attendance into more than just a record it will spark interaction between lecturers and students, opening new ways to collaborate and improve learning experiences, as technology can bridge communication gaps (Rikala & Kankaanranta, 2014). By delivering these benefits at a low cost with the MERN stack, this study will offer schools a practical, impactful solution for today and tomorrow.
1.13 Operational Definition of Terms 
1.	Attendance: The act of being present in a scheduled class or session.  
2.	Real Time: Data is processed and updated instantaneously. 
3.	QR Code: A matrix barcode, otherwise known as a two-dimensional barcode, storing information readable through the use of smartphones or other similar devices. 
4.	Attendance Tracking: The monitoring process of the students indicating the presence or absence of students at the class sessions. 
5.	Proxy Attendance: A practice where one student marks another student's attendance without them present. 
6.	User Authentication: The security process that verifies user identity before allowing access to further use of the system.
7.	Feedback: Input or comments students provide after a session, collected through the system to improve engagement.
8.	Dashboard: A visual display of attendance data and trends, accessible to educators and administrators.

CHAPTER TWO: LITERATURE REVIEW 
2.1 Introduction 
This chapter presents a detailed literature review of QR code-based attendance systems in educational settings, focusing on their functionality and effectiveness. While Chapter one explored various attendance methods including manual roll calls and biometric systems this review narrows to modern QR code solutions, as they balance efficiency and accessibility for the proposed Smart QR Code-Based Student Attendance System. The review examines existing systems, analyzing their strengths, weaknesses, and gaps like real-time accuracy and proxy attendance prevention. By synthesizing findings from studies and tools, it establishes a foundation for understanding their impact on student engagement and administrative efficiency. These insights will justify the proposed system’s innovative design, built on the MERN stack to address these needs in schools.
2.2 Related Literature Review 
The QR code-based attendance systems have advanced recently and introduced innovative approaches to monitoring student presence in educational settings. This section evaluates existing systems and studies, assessing their capabilities and limitations to identify opportunities for improvement that my Smart QR Code Based Student Attendance System will address. Developed using the MERN stack (MongoDB, Express.js, React, Node.js), this system aims to enhance accuracy, security, offline functionality, and student engagement.
Classroom Attendance by QR Code (CATQR) is a free mobile application designed for schools, enabling students to scan class-specific QR codes to record attendance, with optional geolocation verification. While effective, it struggles with real-time updates during internet disruptions, and its geolocation feature may deter privacy-conscious students. My proposed system will mitigate these issues with robust offline capabilities storing data locally and synchronizing it later ensuring reliability and inclusivity. CATQR includes a calendar feature for reviewing attendance history, as noted on its App Store page (App Store), whereas my system will provide automated real-time analytics for greater efficiency.
SEAtS Software enhances attendance and engagement through QR codes, GPS, and real-time notifications. However, it lacks consistent authentication per check-in, increasing the risk of proxy attendance, and its offline mode fails to capture data during connectivity losses. Masalha and Hirzallah (2014) highlight similar authentication weaknesses, reinforcing this concern. My system will incorporate secure logins and offline functionality to address these deficiencies (SEAtS Software, 2023, SEAtS).
OneTap Check-In streamlines attendance with QR codes and NFC across various sectors, including education, yet offers limited engagement features such as optional surveys and requires initial setup for offline use, with additional costs for kiosks. Patel et al. (2019) emphasize the importance of engagement in attendance participation, a gap my system will fill with integrated feedback and cost-effective design.
AccuClass, developed by Engineerica Systems, targets educational institutions with QR code or proximity tracking and mobile app access. It supports customized schedules but delays reporting without internet connectivity, and its offline mode restricts marking to pre-synchronized data, potentially confusing users. My system will ensure seamless offline recording and an intuitive interface to overcome these challenges.
CourseKey serves vocational education with real-time tracking via QR codes, biometrics, and sound-based methods. While it automates administrative tasks, inconsistent authentication permits proxy attendance, and its offline functionality falters without connectivity, compounded by high costs. My proposed system will offer reliable security and affordable offline capabilities, enhancing practicality for educational use.

Gaps/Lacuna 
Despite advancements in QR code-based attendance systems, significant gaps persist that reduce their effectiveness in educational settings.
Many systems struggle to maintain real-time data accuracy due to connectivity issues or slow synchronization, creating unreliable records that disrupt administrative decisions.
Proxy attendance remains a problem, as most lack strong authentication at each check-in to verify student identity, even with unique QR codes.
Student engagement is often overlooked, with few systems offering tools like feedback to encourage participation beyond tracking, limiting their impact on learning.
Usability suffers too, as some are complex or inaccessible across devices, slowing adoption among students and educators.
High costs for setup or training further make these solutions impractical for smaller schools. The proposed Smart QR Code-Based Student Attendance System will tackle these shortcomings with a practical, innovative design.
2.4 Context Diagram 
Overview 
•	The context level diagram provides a high-level overview of the Smart QR based student Attendance System, illustrating how external actors interact with the system and the flow of information between them based on the actual implementation. The system interfaces with Students, Lecturers, Administrators, and external systems like MongoDB Atlas and file storage.
•	Students interact with the system through JWT authentication, QR code scanning with device fingerprinting validation, attendance history viewing, and feedback submission. As implemented in the student dashboards and API controllers, the system validates attendance with composite fingerprinting and IP checks, provides real-time session status through polling mechanisms, and prompts for session feedback when appropriate.
•	Lecturers use the system to create and manage attendance sessions, generating QR codes that automatically refresh every 3 minutes as implemented in the session controller. They monitor attendance data through real-time updates using polling mechanisms and can export attendance reports in Excel format. The system provides unit-specific analytics visualized with Chart.js components.
•	Administrators manage users, courses, and departments through comprehensive management interfaces. They access system-wide analytics and can generate various reports through the export functionality implemented in the attendance controller.
•	The system interacts with MongoDB Atlas using Mongoose ODM for all data operations and uses file storage for QR code images and attendance export generation. All authentication is handled through JWT tokens with appropriate expiration and refresh mechanisms.
The following diagram illustrates the high-level context of the Smart QR Code based student Attendance System:
Figure 1.1: Context Diagram
 
2.5 Chapter Conclusion 
The review of existing QR code-based attendance systems reveals significant strengths alongside critical limitations. These systems have advanced the efficiency and accuracy of attendance tracking compared to manual methods, yet they often fail to address proxy attendance and lack features to engage students beyond basic presence verification. These shortcomings highlight the need for an innovative, comprehensive solution tailored to modern educational contexts.
The proposed Smart QR Code Based Student Attendance System overcomes these gaps by integrating advanced technology with user-friendly design. It ensures real-time data accuracy through robust authentication mechanisms (e.g., JWT-based security) and time-sensitive QR codes, reducing fraudulent attendance marking. Additionally, the inclusion of a feedback system enhances student engagement, providing lecturers with valuable insights into session effectiveness. Designed with lessons from existing platforms, the system employs a scalable architecture featuring a React.js frontend, Express.js backend, and MongoDB database alongside features like offline Progressive Web App support and role-based access control. By enabling administrators to manage courses and departments while streamlining attendance processes, this solution offers a more effective approach to attendance management in educational institutions, fostering both accountability and interaction.

 	 



