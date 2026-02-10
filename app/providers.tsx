'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { ProjectProvider } from './contexts/ProjectContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </SessionProvider>
  );
} 