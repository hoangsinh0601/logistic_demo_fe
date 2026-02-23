import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { UserManagement } from './pages/UserManagement';
import { AuditHistory } from './pages/AuditHistory';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ProtectedRoute } from './components/templates/ProtectedRoute';
import { MainLayout } from './components/templates/MainLayout';
import { AdminRoute } from './components/templates/AdminRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/history" element={<AuditHistory />} />

                {/* Admin/Manager only routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/users" element={<UserManagement />} />
                </Route>
              </Route>
            </Route>

            {/* Default fallback redirects to dashboard which will handle auth checks */}
            <Route path="*" element={<Navigate to="/inventory" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
