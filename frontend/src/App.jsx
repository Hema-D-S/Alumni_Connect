import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/dashboard.jsx";
import FindUsers from "./pages/FindUsers.jsx";
import ChatPage from "./pages/ChatPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/find" element={<FindUsers />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  );
}

export default App;
