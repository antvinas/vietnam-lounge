import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../store/adult.store';
import AdultGate from '../components/common/AdultGate';

export const AuthGuard = () => {
  const { isAgeVerified, isNightlife } = useStore();

  if (!isNightlife) {
    return <AdultGate />;
  }

  if (!isAgeVerified) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};