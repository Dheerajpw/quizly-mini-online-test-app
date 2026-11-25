# Quizly — Mini Online Test App (MERN)

A responsive online multiple-choice test app built with **MongoDB, Express, React and Node.js**. Students can register/login, take a 10-question test with a 10-minute countdown, submit answers, review correct/incorrect answers, and see their past attempts. An optional admin area lets an admin add questions.

## Features

- Student signup and login; passwords hashed with bcrypt; JWT-protected API routes.
- Ten questions randomly selected from MongoDB for each attempt (seed includes 12 general knowledge questions).
- 10-minute countdown; answers are saved to the server as they are selected; timer submits automatically.
- Server-side score calculation and answer review. Correct answers are not sent to the student before submission.
- Attempt history with score and submission date.
- Admin-only question creation page.
- Responsive React UI.

## Tech stack

- Frontend: React 18, Vite, CSS
- Backend: Node.js, Express, Mongoose
- Database: MongoDB / MongoDB Atlas
- Authentication: bcryptjs + JSON Web Token

## Run locally

### Requirements

- Node.js 18+ (Node 20 LTS recommended)
- MongoDB running locally, or a MongoDB Atlas connection string

### 1. Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and update values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/mini_online_test
JWT_SECRET=use_a_long_random_secret_here
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!
```

Seed the question bank (run once, or whenever you want to reset the sample questions):

```bash
npm run seed
```

Start the API:

```bash
npm run dev
```

API health check: `http://localhost:5000/api/health`

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the React app:

```bash
npm run dev
```

Open the Vite URL shown in your terminal (normally `http://localhost:5173`). Create a student account to begin.

## Admin access

The backend creates an admin account on startup if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set and that email does not already exist. Log in using those credentials; the Admin menu will appear. Change the sample password before deploying. Admin can add questions with four options and a correct option index (A = 0, B = 1, C = 2, D = 3).

## API overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register student |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current authenticated user |
| POST | `/api/tests/start` | Start/resume a 10-question attempt |
| PUT | `/api/tests/:id/answer` | Save an answer before deadline |
| GET | `/api/tests/:id` | Get attempt or submitted result |
| POST | `/api/tests/:id/submit` | Submit and calculate score |
| GET | `/api/tests/history/list` | Student's submitted attempts |
| POST | `/api/admin/questions` | Add question (admin only) |
| GET | `/api/admin/questions` | List question bank (admin only) |

All protected endpoints require `Authorization: Bearer <token>`.

## Deployment (Render + Vercel)

### Backend on Render

1. Push this repository to GitHub.
2. In Render, create a **Web Service** from the repository and set the root directory to `backend`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables: `MONGO_URI` (MongoDB Atlas URI), `JWT_SECRET` (long random secret), `CLIENT_URL` (your deployed frontend URL), `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD`. Render provides `PORT` automatically.
6. After deployment, open `https://YOUR-API.onrender.com/api/health`.
7. Seed the database from a local terminal using the same Atlas URI: in `backend/.env`, set `MONGO_URI` to Atlas and run `npm run seed`.

### Frontend on Vercel

1. Import the GitHub repository into Vercel.
2. Set the root directory to `frontend` and framework preset to Vite.
3. Add environment variable `VITE_API_URL=https://YOUR-API.onrender.com/api`.
4. Deploy. Set the backend `CLIENT_URL` to the exact deployed frontend origin and redeploy the backend.

You can also host the frontend on Netlify or Render Static Sites. Configure the same `VITE_API_URL` value.

## Notes

- Do not commit `.env` files or real secrets.
- Use a strong, unique admin password and JWT secret in production.
- MongoDB Atlas must allow network access from your deployed backend (prefer restricted IP/network rules where possible).
- The server's deadline is authoritative; the browser timer is for user experience. Student answers are saved to the API during the test.
