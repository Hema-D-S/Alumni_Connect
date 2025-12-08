# Alumni Connect

A comprehensive alumni networking platform built with React and Node.js that connects alumni, facilitates mentorship programs, and enables seamless communication.

##  About Alumni Connect

Alumni Connect is a full-stack web application designed to serves as a dedicated platform for alumni to:

- **Connect & Network**: Build connections with fellow alumni and students
- **Mentorship Programs**: Participate in structured mentorship across various domains
- **Share Achievements**: Showcase accomplishments and milestones
- **Collaborate**: Chat and collaborate in real-time
- **Find People**: Discover connections based on batch year and role

##  Features

### Core Features

1. **User Authentication**
   - Secure sign-up and login
   - Password reset functionality
   - Role-based access (Student/Alumni)

2. **Dashboard**
   - Personalized user profile
   - Feed of posts and updates
   - Create and share posts with images
   - Like and comment on posts
   - Profile modal for editing user information

3. **Find & Connect**
   - Search for users by name
   - View user profiles and connections
   - Send connection requests
   - Accept/Reject pending requests
   - View connection statistics

4. **Mentorship Programs**
   - Browse various mentorship categories:
     - Career Guidance
     - Technical Skills
     - Leadership
     - Entrepreneurship
     - Personal Development
   - View program details and schedules
   - Join mentorship programs
   - Track participation

5. **Chat & Messaging**
   - Real-time chat with connections
   - View online/offline status
   - Message history
   - Connection list sidebar

6. **Alumni Highlights**
   - Showcase alumni achievements
   - Career milestones
   - Success stories

7. **Student Achievements**
   - Track student accomplishments
   - Display academic and extracurricular achievements

## Screenshots

### Landing Page
<img width="1914" height="902" alt="Screenshot 2025-12-09 002417" src="https://github.com/user-attachments/assets/407b1c28-37e0-4d3a-8444-ac463ae262eb" />
*The welcoming homepage for University of Visvesvaraya College of Engineering*

### Sign In Page
<img width="1892" height="887" alt="Screenshot 2025-12-09 002359" src="https://github.com/user-attachments/assets/498ebdf0-5879-4b96-abf1-6127e85901b4" />

*Secure authentication with Google and LinkedIn integration*

### Dashboard
<img width="1919" height="907" alt="Screenshot 2025-12-09 002727" src="https://github.com/user-attachments/assets/b2074cd4-ef38-4d80-9ec4-ca824e0e949b" />

*Main feed where users can view, like, and comment on posts*

### Profile Modal
<img width="1919" height="907" alt="Screenshot 2025-12-09 002901" src="https://github.com/user-attachments/assets/082fe6d1-2159-4832-ade8-5741fc846c1a" />

*Centered profile modal for editing user information and changing profile picture*

### Mentorship Programs
<img width="1919" height="904" alt="Screenshot 2025-12-09 002844" src="https://github.com/user-attachments/assets/8cafd6e2-58a1-4345-876e-6eb8009b95d3" />

*Browse and join various mentorship programs with different focus areas*

### Find & Connect Page
<img width="1919" height="897" alt="Screenshot 2025-12-09 002742" src="https://github.com/user-attachments/assets/674e9215-a924-4c42-adcb-f5adffb22dd8" />

*Discover and connect with other alumni and students*

### Chat Page
<img width="1919" height="895" alt="Screenshot 2025-12-09 002830" src="https://github.com/user-attachments/assets/9ff6823d-907e-443a-8d80-5a29651b8cc3" />

*Real-time messaging with connections*

## Tech Stack

### Frontend
- **React 18.x** - UI framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **React Router** - Navigation
- **React Icons** - Icon library
- **CSS3** - Styling with flexbox and grid

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Multer** - File upload handling
- **Socket.IO** - Real-time communication
- **Bcrypt** - Password hashing

##  Project Structure

```
Alumni_Connect/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── LeftSidebar.jsx
│   │   │   └── ProfileModal.jsx
│   │   ├── pages/
│   │   │   ├── Auth.jsx
│   │   │   ├── dashboard.jsx
│   │   │   ├── FindUsers.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   ├── MentorshipPrograms.jsx
│   │   │   ├── AlumniHighlights.jsx
│   │   │   └── StudentsAchievements.jsx
│   │   ├── styles/
│   │   │   ├── Dashboard.css
│   │   │   ├── FindUsers.css
│   │   │   ├── ChatPage.css
│   │   │   └── ... (other style files)
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── backend/
│   ├── controllers/
│   │   ├── authcontroller.js
│   │   ├── chatController.js
│   │   ├── connectionController.js
│   │   ├── postController.js
│   │   ├── mentorshipController.js
│   │   └── FindUsersController.js
│   ├── routes/
│   │   ├── authroutes.js
│   │   ├── chatRoutes.js
│   │   ├── connectionRoutes.js
│   │   ├── postRoutes.js
│   │   ├── mentorshipRoutes.js
│   │   └── FindUsers.js
│   ├── models/
│   │   ├── user.js
│   │   ├── post.js
│   │   ├── Message.js
│   │   └── MentorshipProgram.js
│   ├── middlewares/
│   │   ├── authmiddleware.js
│   │   ├── postMiddleware.js
│   │   └── multer.js
│   ├── config/
│   │   └── db.js
│   ├── server.js
│   └── package.json
│
└── README.md
```

##  Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Hema-D-S/Alumni_Connect.git
   cd Alumni_Connect
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

#### Backend Setup (.env)
Create a `.env` file in the backend directory:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=development
```

#### Frontend Setup
Update the API configuration in `frontend/src/config/environment.js`:
```javascript
export const getApiUrl = () => 'http://localhost:5000/api';
export const getBaseUrl = () => 'http://localhost:5000';
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

##  Authentication

- Users can sign up with email and password
- JWT tokens are used for session management
- Tokens are stored securely in localStorage
- OAuth integration available (Google, LinkedIn)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/reset-password` - Reset password

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like a post
- `POST /api/posts/:id/comment` - Add comment

### Connections
- `POST /api/connections/send/:userId` - Send connection request
- `POST /api/connections/accept/:userId` - Accept request
- `POST /api/connections/reject/:userId` - Reject request
- `GET /api/connections` - Get user connections

### Chat
- `GET /api/chat/:userId` - Get chat history
- `POST /api/chat` - Send message
- WebSocket events for real-time messaging

### Mentorship
- `GET /api/mentorship` - Get all programs
- `POST /api/mentorship` - Create program
- `PUT /api/mentorship/:id` - Update program
- `POST /api/mentorship/:id/join` - Join program

##  Design Features

- **Centered Profile Images**: All profile images in modals and cards are perfectly centered
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface with alumni red (#a30027) accent color
- **Smooth Animations**: Transitions and hover effects for better UX
- **Accessibility**: Semantic HTML and ARIA labels for screen readers

##  Responsive Breakpoints

- **Desktop**: 1024px and above
- **Tablet**: 768px - 1023px
- **Mobile**: Below 768px

##  Real-time Features

- **Socket.IO Integration**: Real-time chat and notifications
- **Connection Status**: See who's online/offline
- **Live Updates**: Posts and comments update in real-time
- **Instant Notifications**: Connection requests and messages

##  Git Workflow

```bash
# Create a new branch for features
git checkout -b feature/your-feature-name

# Commit changes
git add .
git commit -m "Add your commit message"

# Push to GitHub
git push origin feature/your-feature-name

# Create a pull request on GitHub
```

- **Live Demo**: [Alumni Connect](https://alumni-connect.vercel.app)
