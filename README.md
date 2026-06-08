# CodeMeet

> A real-time collaborative coding interview platform that connects developers instantly for live problem-solving sessions.

## Overview

CodeMeet is a full-stack web application inspired by modern pair-programming and technical interview platforms. It enables two developers to connect in real time, collaborate on coding challenges, communicate through live chat, and execute code across multiple programming languages.

The platform focuses on improving interview preparation through interactive coding sessions and real-time collaboration.

---

## Features

### Real-Time Collaboration

* Shared Monaco code editor
* Instant code synchronization
* Live language switching
* Real-time participant updates

### Smart Matchmaking

* Random developer pairing
* Waiting room experience
* Automatic room creation
* Seamless session management

### Coding Environment

* Multi-language code execution
* Interactive coding workspace
* Problem statements and examples
* Execution result display

### Communication

* Real-time chat system
* Collaborative problem-solving
* Live participant presence tracking

### Performance & Scalability

* WebSocket-based communication
* Optimized state synchronization
* Fast matchmaking workflow
* Responsive user experience

---

## Tech Stack

### Frontend

* React 18
* Monaco Editor
* Socket.io Client
* Axios

### Backend

* Node.js
* Express.js
* Socket.io

### Database & Infrastructure

* PostgreSQL
* Redis

### Code Execution

* Judge0 API

### DevOps & Deployment

* GitHub Actions
* Vercel
* Railway
* Docker

---

## System Architecture

```text
Browser (React)
    │
    ├── REST API Communication
    │
    └── WebSocket Communication
             │
             ▼
     Node.js + Express
             │
     Socket.io Server
             │
      ┌──────┴──────┐
      ▼             ▼
   PostgreSQL     Redis
      │
      ▼
    Judge0
```

---

## My Contributions

* Designed and developed the complete frontend application
* Implemented real-time collaborative editing
* Built WebSocket-based communication workflows
* Developed matchmaking and room management logic
* Integrated code execution functionality
* Created scalable backend APIs
* Designed database structure and application architecture
* Configured deployment and CI/CD workflows

---

## Key Technical Highlights

* Real-time collaborative editor
* Event-driven architecture
* Multi-user synchronization
* REST API integration
* WebSocket communication
* Scalable backend design
* Containerized development environment
* Automated deployment pipeline

---

## Learning Outcomes

This project strengthened my skills in:

* Full Stack Development
* Real-Time Systems
* React Development
* Node.js Development
* Database Design
* WebSocket Architecture
* Docker & Deployment
* System Design

---

## Disclaimer

This repository is intended for portfolio and educational purposes. Any deployment configurations, credentials, or environment-specific values have been excluded for security reasons.
