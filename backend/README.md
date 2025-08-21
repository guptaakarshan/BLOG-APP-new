# Blog Application API

This is a simple blog application built with Express.js and MongoDB. It provides a RESTful API for managing blog posts, allowing users to create, read, update, and delete posts.

## Project Structure

```
backend
├── src
│   ├── index.js          # Entry point of the application
│   ├── models
│   │   └── Post.js       # Mongoose schema and model for blog posts
│   ├── routes
│   │   └── posts.js      # Route handlers for blog posts API
│   └── config
│       └── db.js         # Database connection configuration
├── package.json           # npm configuration file
└── README.md              # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Set up MongoDB:**
   - Ensure you have a MongoDB instance running. You can use a local MongoDB server or a cloud service like MongoDB Atlas.
   - Update the connection string in `src/config/db.js` to point to your MongoDB instance.

4. **Run the application:**
   ```
   npm start
   ```
   The server will start on `http://localhost:5001`.

## API Endpoints

### Posts

- **GET /api/posts**
  - Retrieves all blog posts.

- **GET /api/posts/:id**
  - Retrieves a single blog post by ID.

- **POST /api/posts**
  - Creates a new blog post. Requires a JSON body with `title`, `content`, and `author`.

- **PUT /api/posts/:id**
  - Updates an existing blog post by ID. Accepts a JSON body with fields to update.

- **DELETE /api/posts/:id**
  - Deletes a blog post by ID.

## Usage

You can use tools like Postman or cURL to interact with the API endpoints. Make sure to set the appropriate HTTP method and headers when making requests.

## License

This project is licensed under the MIT License.