import { Route, Routes } from 'react-router';
import LoginLayout from './components/layouts/login-layout.tsx';
import LoginForm from './components/forms/login-form.tsx';
import { AuthGuard } from './guards/auth.guard.tsx';
import AdminLayout from './components/layouts/admin-layout.tsx';
import RegistrationForm from './components/forms/registration-form.tsx';
import SettingsForm from './components/forms/settings-form.tsx';
import AdministerForm from './components/forms/administer-form.tsx';

function App() {
  return (
    <Routes>
      {/* Public route(s) */}
      <Route path="/" element={<LoginLayout />}>
        <Route index element={<LoginForm />} />
        <Route path="/registration" element={<RegistrationForm />} />
      </Route>

      {/* Private route(s) */}
      <Route element={<AuthGuard />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdministerForm />} />
          <Route path="apikey" element={<>Api key</>} />
          <Route path="profile" element={<>Profile</>} />
          <Route path="settings" element={<SettingsForm />} />
        </Route>
      </Route>

      <Route path="*" element={<>Not Found</>} />
    </Routes>
  );
}

export default App;
