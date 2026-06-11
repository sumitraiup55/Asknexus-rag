# AskNexus – AI-Powered Company Knowledge Assistant

AskNexus is a full-stack MERN + AI-powered RAG application that allows organizations to upload internal company documents and ask questions based on those documents. It provides accurate AI-generated answers with source citations using document chunking, embeddings, semantic search, and vector database retrieval.

This project is designed as a production-level portfolio project for company knowledge management, internal support, employee assistance, and customer FAQ automation.

---

## Live Links

https://asknexus-rag-frontend.vercel.app 

---

## Project Overview

Companies usually store important information in different documents such as HR policies, salary rules, leave policies, customer FAQs, company guidelines, and internal procedures. Employees and customers may need quick answers, but manually searching through documents takes time.

AskNexus solves this problem by allowing users to upload documents and ask questions through an AI chatbot. The system searches the most relevant document content and generates answers with proper source references.

---

## Key Features

- User authentication using JWT
- Admin, Employee, and Customer role-based access
- Secure login and protected routes
- Document upload and management
- Support for company policy and knowledge documents
- AI chatbot for document-based question answering
- Source citations with every AI-generated answer
- Document chunking for better context retrieval
- Embedding generation using Gemini AI
- Semantic search using Qdrant Vector Database
- Chat session history
- Role-based document access
- Admin document upload and delete functionality
- Responsive frontend design
- REST API-based backend architecture
- MongoDB database integration
- Clean and modular project structure

---

## Tech Stack

### Frontend

- React.js
- JavaScript
- HTML5
- CSS3
- Bootstrap
- Axios
- React Router

### Backend

- Node.js
- Express.js
- REST API Development
- JWT Authentication
- Middleware-based architecture
- Multer for file upload

### Database and Storage

- MongoDB
- MongoDB GridFS
- Mongoose

### AI and Vector Search

- Gemini AI
- Gemini Embeddings
- Qdrant Vector Database
- RAG Pipeline
- Semantic Search

### Tools and Deployment

- Git
- GitHub
- Postman
- VS Code
- Render
- Vercel
- MongoDB Atlas
- Qdrant Cloud

---

## How AskNexus Works

1. Admin uploads a company document.
2. Backend extracts text from the uploaded document.
3. Extracted text is divided into smaller chunks.
4. Gemini AI generates embeddings for each chunk.
5. Embeddings are stored in Qdrant Vector Database.
6. User asks a question from the chatbot.
7. Backend searches relevant chunks using semantic search.
8. Retrieved chunks are passed to Gemini AI as context.
9. Gemini AI generates a final answer.
10. User receives answer with source citations.

---

## User Roles

### Admin

- Login securely
- Upload company documents
- Manage uploaded documents
- Delete documents
- Access all company knowledge
- Ask questions from all documents
- View chatbot answers with citations

### Employee

- Login securely
- Ask questions from employee-accessible documents
- Access department-specific information
- View AI-generated answers
- View source-based responses
- Access chat history

---

## Main Modules

### Authentication Module

- User login
- JWT token generation
- Protected routes
- Role-based authorization
- Current user profile API

### Document Module

- Upload documents
- Store document metadata
- Store original files
- Parse document text
- Split text into chunks
- Generate embeddings
- Store vectors in Qdrant
- Delete document data

### Chat Module

- Ask questions
- Retrieve relevant chunks
- Generate AI answers
- Return source citations
- Store chat messages
- Manage chat sessions
- Continue previous conversations

### RAG Module

- Text extraction
- Chunking
- Embedding generation
- Vector search
- Context building
- AI response generation
- Citation mapping

---

## Project Folder Structure

```bash
AskNexus/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## API Endpoints

### Authentication APIs

```bash
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Document APIs

```bash
POST   /api/v1/documents/upload
GET    /api/v1/documents
DELETE /api/v1/documents/:id
```

### Chat APIs

```bash
POST   /api/v1/chat/ask
GET    /api/v1/chat/sessions
GET    /api/v1/chat/sessions/:sessionId
DELETE /api/v1/chat/sessions/:sessionId
```

---

## Environment Variables

Create a `.env` file inside the backend folder.

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your_gemini_api_key
QDRANT_URL=your_qdrant_cloud_url
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION_NAME=asknexus_documents

FRONTEND_URL=your_frontend_live_url
```

Create a `.env` file inside the frontend folder.

```env
VITE_API_BASE_URL=your_backend_live_url/api/v1
```

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/asknexus.git
cd asknexus
```

### 2. Backend Setup

```bash
cd backend
npm install
npm start
```

Backend will run on:

```bash
http://localhost:8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on:

```bash
http://localhost:5173
```

---

## Postman Testing Flow

### 1. Register or Login User

```bash
POST http://localhost:8000/api/v1/auth/login
```

### 2. Upload Document

```bash
POST http://localhost:8000/api/v1/documents/upload
```

Use form-data:

```bash
file: upload document file
title: HR Policy
department: hr
accessRoles: admin,employee
```

### 3. Ask Question

```bash
POST http://localhost:8000/api/v1/chat/ask
```

Example body:

```json
{
  "question": "What is the leave policy of the company?"
}
```

### 4. Get Chat Sessions

```bash
GET http://localhost:8000/api/v1/chat/sessions
```

---

## Example Questions

Users can ask questions like:

```bash
What is the company leave policy?
What is the salary policy?
Who can access customer support documents?
What are the employee benefits?
What is the work from home policy?
How many paid leaves are allowed?
What is the document upload process?
```

---

## Example AI Response

```bash
Answer:
Employees are eligible for paid leaves as per the company leave policy. The exact number of leaves depends on the employee category and company rules.

Sources:
1. HR Policy Document
2. Company Leave Policy
```

---

## Security Features

- JWT-based authentication
- Protected backend APIs
- Role-based access control
- Department-based document filtering
- Secure document access
- Token-based frontend authorization
- Admin-only document management
- Environment variable protection
- Error handling middleware

---

## Deployment

### Frontend Deployment

Frontend can be deployed on:

- Vercel
- Netlify

Add this environment variable during deployment:

```env
VITE_API_BASE_URL=your_backend_live_url/api/v1
```

### Backend Deployment

Backend can be deployed on:

- Render
- Railway
- Cyclic
- AWS
- Any Node.js hosting platform

Add backend environment variables in the deployment platform dashboard.

### Database and Vector DB

- MongoDB Atlas is used for database storage.
- Qdrant Cloud is used for vector search.
- Gemini AI is used for answer generation and embeddings.

---

## Resume-Friendly Description

**AskNexus – AI-Powered Company Knowledge Assistant**

- Built MERN-based RAG application for document question answering with accurate source citations.
- Developed secure REST APIs with JWT authentication and role-based access control.
- Integrated Gemini AI, Qdrant vector database, embeddings, semantic search, and chat history.

---

## Technologies Used in Resume Format

```bash
React.js, JavaScript, Node.js, Express.js, MongoDB, JWT Authentication, Gemini AI, Qdrant Vector Database
```

---

## Challenges Solved

- Implemented RAG pipeline using document chunks and embeddings.
- Connected Gemini AI with Qdrant Vector Database.
- Created role-based document access for different users.
- Added source citations for better answer reliability.
- Managed chat sessions and previous conversation history.
- Built secure APIs using JWT authentication.
- Designed full-stack architecture using MERN stack.

---

## Future Improvements

- Add support for more document formats.
- Add document analytics dashboard.
- Add admin activity logs.
- Add multi-organization support.
- Improve AI answer evaluation.
- Add feedback system for AI responses.
- Add document version control.
- Add advanced search filters.
- Add export chat feature.

---

## Screenshots

Add your project screenshots here.

```bash
Screenshot 1: Login Page
Screenshot 2: Dashboard Page
Screenshot 3: Upload Document Page
Screenshot 4: Chatbot Page
Screenshot 5: Document Management Page
```

---

## Author

**Sumit Kumar**

```bash
GitHub: https://github.com/sumitraiup55
LinkedIn: https://www.linkedin.com/in/sumit-kumar-b25a22290/
Email: sumitraiup55@gmail.com
```

---

## License

This project is created for learning, portfolio, and demonstration purposes.

---

## Conclusion

AskNexus is a production-level MERN + AI project that demonstrates full-stack development, authentication, role-based access control, document processing, vector search, and AI-powered question answering. It is useful for organizations that want to convert internal documents into an intelligent knowledge assistant.
