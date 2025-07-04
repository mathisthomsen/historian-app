"use client";
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/api/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return <>{children}</>;
} 