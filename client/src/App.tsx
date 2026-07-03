import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useDocumentDirection } from "./hooks/useDocumentDirection";
import { useBootstrapAuth } from "./hooks/useBootstrapAuth";
import { useAuthStore } from "./store/authStore";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import Home from "./pages/Home";
import Trips from "./pages/Trips";
import Packages from "./pages/Packages";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Rules from "./pages/Rules";
import NotFound from "./pages/NotFound";
import NewTrip from "./pages/NewTrip";
import NewPackage from "./pages/NewPackage";
import MessageThread from "./pages/MessageThread";
import AdminDashboard from "./pages/AdminDashboard";
import UserProfile from "./pages/UserProfile";
import ProposeDelivery from "./pages/ProposeDelivery";

function App() {
  const { isLoading } = useAuthStore();
  useDocumentDirection();
  useBootstrapAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-bg">
        <p className="text-brand-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg">
      <Toaster position="top-right" />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/users/:userId" element={<UserProfile />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/new"
            element={
              <ProtectedRoute requireApproved>
                <NewTrip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/packages/new"
            element={
              <ProtectedRoute requireApproved>
                <NewPackage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/packages/:packageId/propose"
            element={
              <ProtectedRoute requireApproved>
                <ProposeDelivery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:userId"
            element={
              <ProtectedRoute requireApproved>
                <MessageThread />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireApproved>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;