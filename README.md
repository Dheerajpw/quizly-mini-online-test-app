# Quizly — Mini Online Test App (MERN)

Quizly is a responsive online multiple-choice test application built using MongoDB, Express.js, React.js, and Node.js. Students can register, log in, attempt online tests, view their results, and track their previous attempts.

## Live Demo

- **Frontend:** https://quizly-mini-online-test-app-1.onrender.com
- **Backend API:** https://quizly-mini-online-test-app.onrender.com

## Features

- Student signup and login.
- Secure password hashing using bcrypt.
- JWT-based authentication.
- 10 randomly selected MCQs for each test.
- 10-minute countdown timer.
- Automatic test submission when time expires.
- Answers saved on the server.
- Server-side score calculation.
- Correct and incorrect answer review.
- Previous test attempt history.
- Admin login and question management.
- Responsive user interface.

## Tech Stack

**Frontend**
- React.js
- Vite
- CSS

**Backend**
- Node.js
- Express.js
- Mongoose

**Database**
- MongoDB
- MongoDB Atlas

**Authentication**
- bcryptjs
- JSON Web Token (JWT)

**Deployment**
- Render Static Site (Frontend)
- Render Web Service (Backend)

## Project Structure

```text
quizly-mini-online-test-app/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   └── index.html
│
├── .gitignore
└── README.md
```

## Installation and Local Setup

### Prerequisites

- Node.js 18 or above
- MongoDB local installation or MongoDB Atlas account
- Git

### 1. Clone Repository

```bash
git clone https://github.com/Dheerajpw/quizly-mini-online-test-app.git

cd quizly-mini-online-test-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=long_random_secret
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin_email
ADMIN_PASSWORD=admin_password
```

Seed sample questions:

bash
npm run seed


Start backend:

bash
npm run dev


Backend runs at:

text
http://localhost:5000


### 3. Frontend Setup

Open another terminal:

bash
cd frontend
npm install


Create a `.env` file inside the frontend folder:

env
VITE_API_URL=http://localhost:5000/api

Start frontend:

bash
npm run dev


Frontend normally runs at:

text
http://localhost:5173


## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register student |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/tests/start` | Start or resume test |
| PUT | `/api/tests/:id/answer` | Save selected answer |
| GET | `/api/tests/:id` | Get test or result |
| POST | `/api/tests/:id/submit` | Submit test |
| GET | `/api/tests/history/list` | View attempt history |
| POST | `/api/admin/questions` | Add question |
| GET | `/api/admin/questions` | View question bank |

Protected routes require:

```text
Authorization: Bearer <token>
```

## Deployment on Render

Both frontend and backend are deployed on Render.

### Backend Deployment

1. Connect the GitHub repository to Render.
2. Create a new **Web Service**.
3. Set Root Directory to `backend`.
4. Build Command:

```bash
npm install
```

5. Start Command:

```bash
npm start
```

6. Configure environment variables:

```env
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_strong_random_secret
CLIENT_URL=your_render_frontend_url
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_strong_admin_password
```

Render automatically provides the `PORT` environment variable.

### Frontend Deployment

1. Create a new **Static Site** on Render.
2. Connect the same GitHub repository.
3. Set Root Directory to `frontend`.
4. Build Command:

```bash
npm install && npm run build
```

5. Publish Directory:

```text
dist
```

6. Add the environment variable:

```env
VITE_API_URL=https://quizly-mini-online-test-app.onrender.com/api
```

7. Deploy the frontend.
8. Update the backend's `CLIENT_URL` with the deployed frontend URL.

## Admin Access

The backend creates an admin account during startup if the configured admin email does not already exist.

Admin users can add new questions with four options and select the correct answer.

## Security Notes

- Never commit `.env` files.
- Never expose database credentials or JWT secrets.
- Use strong and unique passwords.
- MongoDB Atlas must allow connections from the deployed backend.
- Passwords are hashed before storing them.
- The server calculates the final test score.

## Author

**Dheeraj Kumar**

- GitHub: https://github.com/Dheerajpw
