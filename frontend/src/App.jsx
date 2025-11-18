import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { UserProvider } from "./contexts/UserContext.jsx";
import PageLoader from "./components/PageLoader.jsx";

// Lazy load all pages for code splitting and faster initial load
const Home = lazy(() => import("./pages/Home"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/dashboard.jsx"));
const FindUsers = lazy(() => import("./pages/FindUsers.jsx"));
const ChatPage = lazy(() => import("./pages/ChatPage.jsx"));
const MentorshipPrograms = lazy(() => import("./pages/MentorshipPrograms.jsx"));
const AlumniHighlights = lazy(() => import("./pages/AlumniHighlights.jsx"));
const StudentsAchievements = lazy(() => import("./pages/StudentsAchievements.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));

function App() {
  return (
    <UserProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/find" element={<FindUsers />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/mentorshipprograms" element={<MentorshipPrograms />} />
          <Route path="/alumnihighlights" element={<AlumniHighlights />} />
          <Route
            path="/studentsachievements"
            element={<StudentsAchievements />}
          />
        </Routes>
      </Suspense>
    </UserProvider>
  );
}

export default App;
