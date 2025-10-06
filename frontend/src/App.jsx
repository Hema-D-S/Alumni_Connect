import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/dashboard.jsx";
import FindUsers from "./pages/FindUsers.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import MentorshipPrograms from "./pages/MentorshipPrograms.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/find" element={<FindUsers />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/mentorshipprograms" element={<MentorshipPrograms />} />
    </Routes>
  );
}

export default App;
