import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ClientForm } from "./pages/ClientForm";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";

function BackgroundBlobs() {
  return (
    <>
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="bg-blob blob-3" />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/app/truescope">
        <BackgroundBlobs />
        <div className="app-wrapper">
          <Routes>
            <Route path="/" element={<ClientForm />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
