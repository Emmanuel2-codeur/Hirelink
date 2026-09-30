import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import RequireAuth from '@/components/RequireAuth';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import CandidateDashboard from '@/pages/CandidateDashboard';
import RecruiterDashboard from '@/pages/RecruiterDashboard';
import NewOffer from '@/pages/NewOffer';
import AdminConsole from '@/pages/AdminConsole';
import Jobs from '@/pages/Jobs';
import Interviews from '@/pages/Interviews';
import CandidateProfile from '@/pages/CandidateProfile';

const Home = () => {
  const { user } = useAuth();
  const to = { candidate: '/app/candidate', recruiter: '/app/recruiter', company: '/app/recruiter', admin: '/app/admin' }[user?.role] || '/login';
  return <Navigate to={to} replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login mode="login" />} />
      <Route path="/register" element={<Login mode="register" />} />
      <Route element={<RequireAuth />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="candidate" element={<CandidateDashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="profile" element={<CandidateProfile />} />
          <Route element={<RequireAuth roles={['recruiter', 'company', 'admin']} />}>
            <Route path="recruiter" element={<RecruiterDashboard />} />
            <Route path="offers/new" element={<NewOffer />} />
          </Route>
          <Route element={<RequireAuth roles={['admin']} />}>
            <Route path="admin" element={<AdminConsole />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
