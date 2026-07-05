import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useDocumentDirection } from "./hooks/useDocumentDirection";
import { useBootstrapAuth } from "./hooks/useBootstrapAuth";
import { useAuthStore } from "./store/authStore";
import { useHealthStore } from "./store/healthStore";
import { AlertTriangle } from "lucide-react";
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
import PackageDetail from "./pages/PackageDetail";
import TripDetail from "./pages/TripDetail";

function App() {
  const { isLoading } = useAuthStore();
  const { isHealthy } = useHealthStore();
  useDocumentDirection();
  useBootstrapAuth();

  if (isHealthy === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-bg px-4">
        <div className="max-w-sm text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-brand-danger/10 p-3">
              <AlertTriangle className="h-8 w-8 text-brand-danger" />
            </div>
          </div>
          <h1 className="text-lg font-bold text-brand-primary">
            Service unavailable
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            We're having trouble reaching our servers. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || isHealthy === null) {
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
          <Route path="/trips/:id" element={<TripDetail />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/packages/:id" element={<PackageDetail />} />
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