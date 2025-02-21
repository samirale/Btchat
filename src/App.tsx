import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import Login from './components/Login';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Terms from './components/Terms';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <div className="min-h-screen matrix-bg">
            <header className="p-4 border-b border-green-500/30">
              <div className="container mx-auto flex items-center gap-2">
                <Terminal className="w-8 h-8 text-green-500" />
                <h1 className="text-2xl font-bold glow">BtChat</h1>
              </div>
            </header>

            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/terms" element={<Terms />} />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Chat />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;