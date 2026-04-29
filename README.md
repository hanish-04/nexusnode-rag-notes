# NexusNode

NexusNode is a full-stack note-taking and AI assistant app built with React, Vite, Node.js, Express, MongoDB, and Google Gemini. It supports user authentication, protected note pages, and AI conversations that use your own saved notes as context.

## Key Features

- User authentication with JWT and password hashing
- Personal note creation, editing, and deletion
- Multi-chat AI assistant with chat history stored per user
- AI responses generated from note embeddings and retrieval-augmented generation
- Logout functionality and protected application routes

## Repository Structure

- `backend/` - Express API server, MongoDB models, authentication, AI chat services
- `frontend/` - React + Vite app, protected routes, notes UI, chat UI

## Dependencies

### Backend

- `@google/generative-ai`
- `bcryptjs`
- `cors`
- `dotenv`
- `express`
- `jsonwebtoken`
- `mongoose`
- `nodemon` (dev)

### Frontend

- `@tiptap/extension-placeholder`
- `@tiptap/react`
- `@tiptap/starter-kit`
- `axios`
- `lucide-react`
- `react`
- `react-dom`
- `react-router-dom`
- `@tailwindcss/vite`
- `@types/react`
- `@types/react-dom`
- `@vitejs/plugin-react`
- `eslint`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`
- `tailwindcss`
- `vite`

## Requirements

- Node.js 18 or newer
- MongoDB local or remote database
- Google Gemini API key for AI service

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with these variables:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/rag-notes-db
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend server:

```bash
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend is served by Vite, typically at `http://localhost:5173`.

## Usage

1. Register a new user from the login page.
2. Create notes using the note editor.
3. Navigate to the chat page and ask questions based on your saved notes.
4. Use the logout button to sign out of the application.

## Notes

- The frontend automatically attaches the JWT token to API requests via Axios.
- All notes and chats are stored per user and protected by authentication middleware.
- AI responses are generated using the Gemini API and local note embeddings.

## License

This project is provided as-is for learning and prototyping.
