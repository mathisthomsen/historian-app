import { useProject } from '../contexts/ProjectContext';

export function useProjectApi() {
  const { selectedProject } = useProject();

  const fetchWithProject = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const body = options.body ? JSON.parse(options.body as string) : {};
    
    // Add project_id to the request body if a project is selected
    if (selectedProject) {
      body.project_id = selectedProject.id;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      body: JSON.stringify(body),
    });

    return response;
  };

  const getWithProject = async (url: string) => {
    const response = await fetch(url);
    return response;
  };

  return {
    fetchWithProject,
    getWithProject,
    selectedProject,
  };
} 