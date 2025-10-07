import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/dashboard.jsx";
import FindUsers from "./pages/FindUsers.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import MentorshipPrograms from "./pages/MentorshipPrograms.jsx";
import AlumniHighlights from "./pages/AlumniHighlights.jsx";
import StudentsAchievements from "./pages/StudentsAchievements.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import { UserProvider } from "./contexts/UserContext.jsx";

function App() {
  return (
    <UserProvider>
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
    </UserProvider>
  );
}

export default App;
