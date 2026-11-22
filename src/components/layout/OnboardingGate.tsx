import type React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { useOrganizationModules } from '../../hooks/useOrganizationModules.js';

interface Props {
  children: React.ReactNode;
}

export function OnboardingGate({ children }: Props) {
  const { isAdmin } = useAuth();
  const { isPendingOnboarding, isLoading } = useOrganizationModules();
  const location = useLocation();

  if (isLoading || isPendingOnboarding === null) {
    return null; // Espera terminar o loading
  }

  // Se o onboarding está pendente e o usuário é ADMIN, força ir pro setup (a menos que já esteja lá)
  if (isPendingOnboarding && isAdmin && !location.pathname.startsWith('/setup')) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}
