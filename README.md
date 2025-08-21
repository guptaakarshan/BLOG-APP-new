# Blog Project with Google Authentication

A full-stack blog application built with React frontend and Node.js backend, featuring Google OAuth authentication.

## Features

- 🔐 **Google OAuth Authentication** - Sign in with Google accounts
- 📝 **Blog Post Management** - Create, read, update, and delete blog posts
- 💬 **Comment System** - Add comments to blog posts
- 👥 **User Management** - User registration, login, and profile management
- 🛡️ **Role-based Access Control** - Admin and user roles
- 🎨 **Modern UI** - Built with Tailwind CSS and React
- 🚀 **Real-time Updates** - Live comment updates and notifications

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Google Cloud Console account for OAuth credentials

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd BLOG-PROJECT
```

### 2. Backend Setup

```bash
cd backend-1
npm install
```

#### Environment Variables

Create a `.env` file in the `backend-1` directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/blogapp

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set Application Type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:5001`
7. Copy the Client ID and Client Secret to your `.env` file

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

#### Google OAuth Configuration

Update the `clientId` in `src/App.js`:

```javascript
<GoogleOAuthProvider clientId="your-google-client-id-here">
```

### 4. Start the Application

#### Start Backend (Terminal 1)
```bash
cd backend-1
npm run dev
```

#### Start Frontend (Terminal 2)
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth authentication
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `GET /api/auth/verify` - Verify JWT token

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Comments
- `GET /api/comments/:postId` - Get comments for a post
- `POST /api/comments` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/:id` - Update user role (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)

## Project Structure

```
BLOG-PROJECT/
├── backend-1/          # Backend server
│   ├── src/
│   │   ├── config/         # Database and Google OAuth config
│   │   ├── middleware/     # Authentication and rate limiting
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── index.js        # Server entry point
│   └── package.json
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── App.js          # Main app component
│   └── package.json
└── README.md
```

## Authentication Flow

1. **Local Authentication**: Users can register/login with email and password
2. **Google Authentication**: Users can sign in with their Google account
3. **JWT Tokens**: Secure authentication using JSON Web Tokens
4. **Session Management**: Automatic token verification and refresh

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on authentication endpoints
- CORS configuration
- Helmet security middleware
- Input validation and sanitization

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running locally
   - Check connection string in `.env` file
   - The app will fallback to in-memory MongoDB for development

2. **Google OAuth Error**
   - Verify Google Client ID and Secret in `.env`
   - Check authorized redirect URIs in Google Cloud Console
   - Ensure Google+ API is enabled

3. **CORS Error**
   - Verify `FRONTEND_URL` in backend `.env`
   - Check that frontend is running on the correct port

4. **JWT Error**
   - Ensure `JWT_SECRET` is set in `.env`
   - Check token expiration (default: 7 days)

### Development Tips

- Use `npm run dev` for backend development with auto-restart
- Check browser console and terminal for error messages
- Verify all environment variables are set correctly
- Test both local and Google authentication flows

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please open an issue in the repository.
