📝 Blog App

A full-stack MERN (MongoDB, Express.js, React, Node.js) blogging platform with Google OAuth 2.0 authentication, where users can create, view, and comment on blogs.

🚀 Features

🔐 User Authentication with Google OAuth 2.0

📝 Create, View, Edit, and Delete Blogs

💬 Comment System for discussions

🖼️ Responsive and clean UI with React

🌐 RESTful API built with Express & MongoDB

🔒 Secure password handling with hashing & sessions

🛠️ Tech Stack

Frontend: React, React Router, Tailwind CSS, React Hot Toast, Google OAuth

Backend: Node.js, Express.js, MongoDB, Mongoose

Authentication: Google Identity Services (OAuth 2.0)

Deployment: Vercel

📂 Project Structure
BLOG-APP-new/
│
├── backend/               # Express backend
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   └── index.js           # Entry point
│
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Blog pages (Home, Create, View)
│   │   └── App.js
│   └── public/
│
└── README.md

⚙️ Installation & Setup
1. Clone the Repository
git clone https://github.com/guptaakarshan/BLOG-APP-new.git
cd BLOG-APP-new

2. Backend Setup
cd backend
npm install

Environment Variables

Create a .env file inside the backend folder:

MONGODB_URI=your-mongodb-connection-string
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
PORT=5001


Run the backend:

npm start

3. Frontend Setup
cd frontend
npm install

Environment Variables

Create a .env file inside the frontend folder:

REACT_APP_API_BASE_URL=http://localhost:5001
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id


Run the frontend:

npm start

🔑 API Endpoints
Auth

POST /auth/google → Google login

Blogs

POST /api/blogs → Create blog

GET /api/blogs → Get all blogs

GET /api/blogs/:id → Get blog by ID

PUT /api/blogs/:id → Update blog

DELETE /api/blogs/:id → Delete blog

Comments

POST /api/blogs/:id/comments → Add comment

GET /api/blogs/:id/comments → Get comments for a blog

🔐 Security Features

Passwords stored securely with hashing (bcrypt)

Sessions handled with express-session & MongoDB store

Input validation to prevent SQL/NoSQL injection

CORS properly configured for frontend-backend communication


🧑‍💻 Author

Made with ❤️ by Akarshan Gupta
