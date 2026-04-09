import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import UploadPage from "./pages/UploadPage";
import ReviewPage from "./pages/ReviewPage";
import ResultPage from "./pages/ResultPage";
import HistoryPage from "./pages/HistoryPage";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
        <Route path="/review/:id" element={<PrivateRoute><ReviewPage /></PrivateRoute>} />
        <Route path="/result/:id" element={<PrivateRoute><ResultPage /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
