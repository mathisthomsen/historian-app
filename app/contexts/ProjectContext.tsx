'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Project } from '../types/project';

interface ProjectContextType {
  selectedProject: Project | null;
  userProjects: Project[];
  isLoading: boolean;
  setSelectedProject: (project: Project | null) => void;
  refreshProjects: () => Promise<void>;
  getUserRole: (projectId?: string) => 'owner' | 'member' | 'editor' | 'viewer' | null;
  canEdit: (projectId?: string) => boolean;
  canDelete: (projectId?: string) => boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    if (!session?.user) {
      setUserProjects([]);
      setSelectedProject(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/projects');
      const data = await response.json();
      
      if (data.projects) {
        setUserProjects(data.projects);
        
        // Auto-select the first project if none is selected or if we have projects but no selection
        if (data.projects.length > 0 && !selectedProject) {
          setSelectedProject(data.projects[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProjects = async () => {
    await fetchProjects();
  };

  // Helper function to get user's role in a project
  const getUserRole = (projectId?: string): 'owner' | 'member' | 'editor' | 'viewer' | null => {
    const targetProjectId = projectId || selectedProject?.id;
    if (!targetProjectId || !session?.user) return null;

    const userId = (session.user as any).id;
    if (!userId) return null;

    const project = userProjects.find(p => p.id === targetProjectId);
    if (!project) return null;

    // Check if user is owner
    if (project.owner_id === userId) return 'owner';

    // Check if user is a member
    const member = project.members.find((m: any) => m.user_id === userId);
    return member ? (member.role as 'owner' | 'member' | 'editor' | 'viewer') : null;
  };

  // Helper function to check if user can edit
  const canEdit = (projectId?: string): boolean => {
    const role = getUserRole(projectId);
    return role === 'owner' || role === 'editor';
  };

  // Helper function to check if user can delete
  const canDelete = (projectId?: string): boolean => {
    const role = getUserRole(projectId);
    return role === 'owner';
  };

  useEffect(() => {
    fetchProjects();
  }, [session?.user]);

  // Persist selected project in localStorage
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('selectedProjectId', selectedProject.id);
    }
  }, [selectedProject]);

  // Restore selected project from localStorage
  useEffect(() => {
    if (userProjects.length > 0) {
      const savedProjectId = localStorage.getItem('selectedProjectId');
      if (savedProjectId) {
        const savedProject = userProjects.find(p => p.id === savedProjectId);
        if (savedProject) {
          setSelectedProject(savedProject);
          return;
        }
      }
      // Fallback to first project if no saved project or saved project not found
      if (!selectedProject) {
        setSelectedProject(userProjects[0]);
      }
    }
  }, [userProjects, selectedProject]);

  return (
    <ProjectContext.Provider value={{
      selectedProject,
      userProjects,
      isLoading,
      setSelectedProject,
      refreshProjects,
      getUserRole,
      canEdit,
      canDelete
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
} 