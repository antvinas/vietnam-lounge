import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function RequireRole({ roles, children }:{roles: string[]; children: React.ReactElement}) {
  const { user, claims, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const ok = roles.some(r => claims?.roles?.includes(r));
  return ok ? children : <Navigate to="/" replace />;
}

export function requireAdult() {
  const ok = typeof window !== 'undefined' && localStorage.getItem('adult_ok') === '1';
  if (!ok && typeof window !== 'undefined') window.location.href = '/adult-gate';
}
