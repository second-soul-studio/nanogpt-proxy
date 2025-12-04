import { Route, Routes } from 'react-router';
import LoginLayout from './components/layouts/login-layout.tsx';
import LoginForm from './components/forms/login-form.tsx';
import { AuthGuard } from './guards/auth.guard.tsx';
import AdminLayout from './components/layouts/admin-layout.tsx';

function App() {
  return (
    <Routes>
      {/* Public route(s) */}
      <Route path="/" element={<LoginLayout />}>
        <Route index element={<LoginForm />} />
      </Route>

      {/* Private route(s) */}
      <Route element={<AuthGuard />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<>Admin dashboard to implement</>} />
          <Route path="apikey" element={<>Api keys</>} />
        </Route>
      </Route>

      <Route path="*" element={<>Not Found</>} />
    </Routes>
  );
}

export default App;
