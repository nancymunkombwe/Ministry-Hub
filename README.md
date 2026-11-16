
<div align="center">

# MINISTRY HUB

### Church Management Made Simple.

A modern, full-stack church management system designed specifically for Seventh-day Adventist (SDA) churches.

**Faith. Stewardship. Service.**

![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-REST_API-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens)
![Status](https://img.shields.io/badge/Status-Completed-22C55E?style=for-the-badge)

[Overview](#overview) • [Screenshots](#screenshots) • [Features](#features) • [Architecture](#system-architecture) • [Installation](#installation) • [Roadmap](#roadmap)

</div>

---

## Overview

Ministry Hub is a comprehensive digital church management system designed to streamline administrative and operational activities within Seventh-day Adventist (SDA) churches.

The platform provides pastors, elders, church clerks, treasurers and administrators with a centralised digital workspace for managing membership records, visitors, attendance, church events, tithes and offerings, announcements and administrative reports.

Developed around the organisational and administrative needs of Seventh-day Adventist churches, Ministry Hub promotes efficient administration, responsible financial stewardship and effective communication.

By reducing manual administrative responsibilities, the platform enables church leaders to dedicate more time to spiritual growth, evangelism, fellowship and community service.

---

## Problem Statement

Church administration often involves manual record-keeping, physical registers, spreadsheets and fragmented communication channels.

These approaches can create challenges such as:

- Inconsistent membership records
- Time-consuming administrative processes
- Difficulty monitoring church attendance
- Fragmented financial records
- Inefficient communication
- Difficulty generating administrative reports
- Potential loss of important church records
- Limited access to centralised information

Ministry Hub addresses these challenges by providing an integrated digital platform for church administration.

---

## Project Objectives

- Digitise Seventh-day Adventist church administration.
- Centralise church membership records.
- Improve financial accountability and stewardship.
- Simplify Sabbath service attendance tracking.
- Support visitor engagement and follow-up.
- Improve communication between church leaders and members.
- Simplify church event and programme management.
- Support informed administrative decision-making.
- Reduce reliance on manual record-keeping.
- Provide a foundation for future church digital transformation.

---

## Screenshots

### Landing Page

A welcoming public-facing website introducing Ministry Hub and its purpose.

![Ministry Hub Homepage](screenshots/Home%20Page.png)

### Platform Features

An overview of the platform's core church management capabilities.

![Platform Features](screenshots/Home%20Page%202.png)

### About Ministry Hub

A platform built with ministry work, church administration and stewardship in mind.

![About Ministry Hub](screenshots/Home%20Page%203.png)

### Authentication

A dedicated authentication interface for authorised church personnel.

![Login](screenshots/Login.png)

### Administrative Dashboard

A centralised overview of church operations, membership statistics, attendance and financial information.

![Dashboard](screenshots/Dashboard.png)

### Membership Management

Manage church membership records and access individual member information.

![Members](screenshots/Members.png)

### Member Profile

View individual church member records through a dedicated profile interface.

![Member Profile](screenshots/Member%20Profile.png)

### Visitor Management

Register church visitors and support visitor engagement and follow-up.

![Visitors](screenshots/Visitors.png)

### Attendance Management

Manage attendance sessions and monitor participation in church services and meetings.

![Attendance](screenshots/Attendance.png)

### Church Events

Organise church programmes, events and ministry activities.

![Events](screenshots/Events.png)

### Tithes and Offerings

Record church financial contributions and support responsible financial stewardship.

![Tithes and Offerings](screenshots/Tithe%20and%20offerings.png)

### Church Announcements

Create and manage important church announcements and communications.

![Announcements](screenshots/Announcements.png)

### WhatsApp Communication

A WhatsApp message interface designed to support church communication workflows.

![WhatsApp Communication](screenshots/Announcements%202.png)

### Reports and Analytics

Access administrative reports, financial summaries and operational information.

![Reports](screenshots/Reports.png)

### User Management

Manage system user accounts and administrative access.

![User Management](screenshots/User%20Management.png)

### Church Information

Maintain essential church information and organisational details.

![Church Information](screenshots/Church%20Information.png)

### Church Leadership and Settings

Manage church leadership information and application settings.

![Settings](screenshots/Settings.png)

### Confirmation Dialogs

Interactive confirmation prompts help prevent accidental deletion of important church records.

![Delete Confirmation](screenshots/Delete%20Confirmation.png)

---

## Features

### Administrative Dashboard

- Centralised church administration
- Membership statistics
- Visitor statistics
- Attendance summaries
- Financial summaries
- Operational performance indicators
- Quick access to management modules

### Membership Management

- Church member registration
- Individual member profiles
- Membership record management
- Personal and contact information
- Membership statistics
- Centralised membership database

### Visitor Management

- Visitor registration
- Visitor record management
- Contact information
- Visitor statistics
- Support for evangelism and visitor follow-up

### Attendance Management

- Sabbath service attendance tracking
- Attendance session management
- Church meeting attendance
- Attendance records
- Historical attendance information
- Participation monitoring

### Church Events

- Event creation and management
- Church programme scheduling
- Upcoming event information
- Ministry activity coordination
- Event record management

### Financial Stewardship

- Tithe recording
- Offering recording
- Financial contribution management
- Financial summaries
- Financial record tracking
- Reporting in Zambian Kwacha (ZMW)
- Support for church treasury administration

### Communication

- Church announcements
- Announcement management
- WhatsApp message interface
- Church programme communication
- Centralised administrative communication

### Authentication and User Management

- User authentication
- JWT-based authentication
- Password hashing
- Administrative user management
- Protected application functionality
- Account management

### Church Administration

- Church information management
- Church leadership records
- Organisational information
- Application settings
- Administrative record management
- Interactive confirmation dialogs

### Reporting and Analytics

- Membership summaries
- Attendance reports
- Financial summaries
- Visitor information
- Administrative reports
- Support for informed decision-making

---

## Target Users

Ministry Hub is designed to support the administrative responsibilities of local Seventh-day Adventist churches.

| User | Intended Responsibilities |
|---|---|
| Pastor | Ministry oversight and church administration |
| Church Elder | Church leadership and administrative oversight |
| Church Clerk | Membership and administrative records |
| Church Treasurer | Tithes, offerings and financial records |
| Ministry Leader | Church programmes and ministry activities |
| Administrator | System administration and user management |

These responsibilities represent intended use cases and do not necessarily correspond to separate implemented permission roles.

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| Vite | Frontend development and build tool |
| JavaScript | Application functionality |
| HTML5 | Application structure |
| CSS3 | Styling and responsive layouts |
| React Router | Application navigation |
| Axios | API communication |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Server-side JavaScript runtime |
| Express.js | Backend application framework |
| REST API | Client-server communication |
| JSON Web Tokens | User authentication |
| bcrypt | Password hashing |

### Database and Development

| Technology | Purpose |
|---|---|
| MySQL | Original relational database |
| MySQL Workbench | Database administration |
| PostgreSQL | Planned cloud database migration |
| Supabase | Proposed cloud database hosting |
| Git | Version control |
| GitHub | Source code management |
| Visual Studio Code | Development environment |

---

## Brand Identity

Ministry Hub combines a professional visual identity with a welcoming, ministry-focused user experience.

| Colour | Purpose |
|---|---|
| Navy Blue | Primary branding and navigation |
| Gold | Highlights and primary actions |
| White | Content surfaces |
| Light Grey | Dashboard backgrounds |
| Slate | Secondary text and interface elements |

The visual identity reflects trust, stewardship, organisation, professionalism and community.

**Brand Name:** Ministry Hub

**Tagline:** Church Management Made Simple.

**Core Values:** Faith. Stewardship. Service.

---

## System Architecture

```mermaid
flowchart TD
    A[Pastors and Elders] --> E[React Frontend]
    B[Church Clerks] --> E
    C[Church Treasurers] --> E
    D[Administrators] --> E

    E --> F[REST API]
    F --> G[Node.js and Express Backend]

    G --> H[Authentication]
    G --> I[Membership Management]
    G --> J[Attendance Management]
    G --> K[Financial Management]
    G --> L[Events and Communication]
    G --> M[Reports and Settings]

    H --> N[(Relational Database)]
    I --> N
    J --> N
    K --> N
    L --> N
    M --> N
```

Ministry Hub follows a client-server architecture that separates presentation, application logic and persistent data storage.

This modular architecture provides a foundation for maintainability, scalability and future platform expansion.

---

## Application Modules

```mermaid
flowchart TD
    A[Ministry Hub] --> B[Dashboard]
    A --> C[Members]
    A --> D[Visitors]
    A --> E[Attendance]
    A --> F[Events]
    A --> G[Financial Management]
    A --> H[Announcements]
    A --> I[Reports]
    A --> J[User Management]
    A --> K[Settings]

    G --> L[Tithes]
    G --> M[Offerings]

    K --> N[Church Information]
    K --> O[Church Leadership]
```

---

## Database Architecture

Ministry Hub uses a relational database to organise church records and maintain structured administrative information.

The database supports the following information categories:

| Category | Description |
|---|---|
| Users | System accounts and authentication |
| Members | Church membership information |
| Visitors | Church visitor records |
| Attendance | Attendance sessions and participation |
| Events | Church programmes and activities |
| Financial Records | Tithes and offerings |
| Announcements | Church communication records |
| Church Information | Organisational information |
| Settings | Administrative configurations |

The original application uses MySQL. PostgreSQL and Supabase are intended to support future cloud deployment.

---

## Project Structure

The application is organised around separate frontend and backend components, together with project documentation and screenshots.

```text
ministry-hub/
│
├── frontend/          # React frontend
├── backend/           # Node.js and Express backend
├── screenshots/       # Application screenshots
└── README.md          # Project documentation
```

---

## Installation

### Prerequisites

Ensure the following software is installed:

- Node.js
- npm
- MySQL Server
- MySQL Workbench or phpMyAdmin
- Git
- Visual Studio Code (optional)

### 1. Clone the repository

```bash
git clone https://github.com/nancymunkombwe/ministry-hub.git
cd ministry-hub
```

### 2. Configure the database

Open MySQL Workbench and create the required database.

```sql
CREATE DATABASE IF NOT EXISTS ministry_hub;
```

Import the project's MySQL database schema.

For a PostgreSQL-based deployment, use the corresponding migration scripts and database configuration.

### 3. Configure environment variables

Create the required environment files according to the application's configuration.

Configure the following settings:

- Database host
- Database port
- Database username
- Database password
- Database name
- JWT secret
- Backend port
- Frontend API URL

Never commit real database credentials, JWT secrets or sensitive environment variables to GitHub.

### 4. Install backend dependencies

```bash
cd backend
npm install
```

### 5. Start the backend

```bash
npm run dev
```

### 6. Install frontend dependencies

Open a separate terminal from the project root.

```bash
cd frontend
npm install
```

### 7. Start the frontend

```bash
npm run dev
```

### 8. Access Ministry Hub

Open the local development URL displayed in the frontend terminal.

The default Vite development address is:

```text
http://localhost:5173
```

Ensure the backend and database are running before accessing administrative functionality.

---

## Security and Privacy

Ministry Hub handles potentially sensitive church membership, personal and financial information.

The application incorporates authentication and password hashing, with additional security measures planned before production deployment.

Recommended security practices include:

- Secure password storage
- Protected environment variables
- Restricted administrative access
- Server-side input validation
- HTTPS in production
- Regular database backups
- Protection of membership records
- Protection of confidential financial information
- Responsible handling of personal data
- Administrative audit trails

Public demonstration screenshots and sample databases should contain fictional or anonymised information.

---

## Roadmap

### Phase 1 — Core Development

- [x] Administrative dashboard
- [x] Membership management
- [x] Individual member profiles
- [x] Visitor management
- [x] Attendance management
- [x] Church event management
- [x] Tithes and offerings
- [x] Church announcements
- [x] Reports
- [x] User management
- [x] Church information
- [x] Church leadership settings
- [x] Authentication

### Phase 2 — User Experience and Branding

- [x] Public landing page
- [x] Custom Ministry Hub branding
- [x] Modern administrative dashboard
- [x] Interactive confirmation dialogs
- [x] Dedicated login interface
- [x] WhatsApp message interface
- [x] Project documentation

### Phase 3 — Adventist Ministry Expansion

- [ ] Sabbath School management
- [ ] Sabbath School attendance
- [ ] Church departmental management
- [ ] Adventist Youth Ministries (AYM)
- [ ] Pathfinder Club management
- [ ] Adventurer Club management
- [ ] Personal Ministries management
- [ ] Women's Ministries management
- [ ] Dorcas Society management
- [ ] Baptism records
- [ ] Membership transfer management
- [ ] Church board meeting management
- [ ] Quarterly church reports
- [ ] District and conference reporting

### Phase 4 — Digital Innovation

- [ ] Member self-service portal
- [ ] Online tithes and offerings
- [ ] Mobile money integration
- [ ] Automated financial reporting
- [ ] QR code attendance
- [ ] Automated Sabbath reminders
- [ ] Automated birthday notifications
- [ ] Email notifications
- [ ] Expanded WhatsApp integration
- [ ] Multi-church management
- [ ] Mobile application

### Phase 5 — Cloud Deployment

- [ ] PostgreSQL database migration
- [ ] Supabase cloud database configuration
- [ ] Frontend deployment
- [ ] Backend deployment
- [ ] Custom domain
- [ ] Automated database backups
- [ ] Administrative audit logs
- [ ] Production security testing
- [ ] Public platform launch

---

## Expected Impact

Ministry Hub aims to contribute to the digital transformation of church administration through:

- Improved administrative efficiency
- Reduced manual paperwork
- Improved financial accountability
- Better membership engagement
- More organised church programmes
- Improved communication
- Centralised church information
- Support for responsible stewardship
- Increased availability of administrative information
- More time for ministry and community service

---

## Project Vision

Ministry Hub aims to support the digital transformation of Seventh-day Adventist churches in Zambia and beyond.

The long-term vision is to establish an integrated church management ecosystem connecting local churches, districts and conferences through accessible digital tools.

The platform seeks to strengthen administrative efficiency, financial stewardship, membership engagement and communication while supporting the mission and ministry of the Seventh-day Adventist Church.

By combining technology with ministry-focused administration, Ministry Hub aims to empower church leaders to focus more on people, spiritual development, evangelism and community service.

---

## Academic and Technical Application

Ministry Hub demonstrates the practical application of information systems and software engineering principles within a church administration environment.

The project incorporates concepts from:

- Full-stack web development
- Software engineering
- Relational database design
- REST API development
- Authentication and authorisation
- User interface and experience design
- Information systems management
- Business process digitisation
- Financial information management
- Digital transformation

---

## Project Status

Ministry Hub is currently under active development.

The core application supports church administrative processes, with additional SDA-specific modules, cloud deployment and production security improvements planned for future releases.

---

## Developer

**Nancy Munkombwe**

University of Zambia

[GitHub Profile](https://github.com/nancymunkombwe)

---

## Disclaimer

Ministry Hub is an independently developed church management system designed to support Seventh-day Adventist churches.

It is not presented as an official application of, or as being officially endorsed by, the Seventh-day Adventist Church.

---

<div align="center">

# MINISTRY HUB

### Church Management Made Simple.

**Faith. Stewardship. Service.**

Built with purpose. Designed for ministry.

Designed and developed in Zambia.

Copyright © 2026 Ministry Hub. All rights reserved.

</div>
