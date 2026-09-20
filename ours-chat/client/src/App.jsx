import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPages';
import ChatPage from './pages/ChatPage';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="brand-mark">o</div></div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return <Routes><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route path="/chat" element={<Protected><ChatPage /></Protected>} /><Route path="*" element={<Navigate to="/chat" replace />} /></Routes>;
}
