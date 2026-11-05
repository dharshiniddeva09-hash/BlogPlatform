# BlogPlatform — Blog Platform with Comments

A beginner-friendly full-stack blog app using HTML, CSS, JavaScript, Node.js, Express, MongoDB Atlas, JWT, and bcryptjs.

## Features
- Register and login with hashed passwords
- JWT authentication
- Create, edit, and delete your own posts
- View all blog posts
- Add and view comments
- MongoDB Atlas persistence
- Responsive UI

## Requirements
Install Node.js (LTS recommended) and use VS Code.

## 1. Install dependencies
Open a terminal in this project folder and run:

```bash
npm install
```

## 2. Configure MongoDB Atlas
1. Sign in to MongoDB Atlas and create a free cluster if you do not have one.
2. Create a database user and password.
3. In Network Access, allow your current IP address.
4. Open Connect → Drivers and copy the connection string.
5. Copy `.env.example` to a new file named `.env`.
6. Replace the example MONGODB_URI with your Atlas connection string. Replace `<password>` with your database user's password and URL-encode special characters if needed.
7. Set a long random value for `JWT_SECRET`.
8. Do not share `.env` or upload it to GitHub.

Example `.env` structure:

```env
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER.mongodb.net/blogplatform?retryWrites=true&w=majority
JWT_SECRET=your_long_random_secret_here
```

## 3. Start the server
```bash
npm run dev
```
Expected messages:
- `MongoDB connected successfully!`
- `Blog Platform running at http://localhost:5000`

Open **http://localhost:5000** in your browser. Do not open `public/index.html` directly; use the server URL.

## REST API
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Log in | No |
| GET | `/api/posts` | List posts | No |
| GET | `/api/posts/:postId` | Get one post | No |
| POST | `/api/posts` | Create post | Yes |
| PUT | `/api/posts/:postId` | Edit own post | Yes |
| DELETE | `/api/posts/:postId` | Delete own post | Yes |
| GET | `/api/posts/:postId/comments` | List comments | No |
| POST | `/api/posts/:postId/comments` | Add comment | Yes |

Protected requests use `Authorization: Bearer <token>`.

## Project structure
```text
BlogPlatform/
├── middleware/auth.js
├── models/
│   ├── User.js
│   ├── Post.js
│   └── Comment.js
├── routes/
│   ├── authRoutes.js
│   ├── postRoutes.js
│   └── commentRoutes.js
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Troubleshooting
- `MONGODB_URI is missing`: create `.env` by copying `.env.example`.
- `MongoDB connection failed`: verify URI, database username/password, and Atlas Network Access.
- `node is not recognized`: install Node.js, then restart VS Code.
- `EADDRINUSE`: another process may already be using port 5000; stop the other server or change PORT in `.env`.

This is a learning project. Before public production deployment, add rate limiting, stricter validation, security headers, CSRF considerations where applicable, and a more robust token/session strategy.
