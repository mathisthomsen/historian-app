export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  members: ProjectMember[];
}

export interface ProjectMember {
  id: number;
  user_id: string;
  project_id: string;
  role: 'owner' | 'member' | 'editor' | 'viewer';
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateProjectData {
  name: string;
  description?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
}

export interface InviteMemberData {
  email: string;
  role: 'member' | 'editor' | 'viewer';
} 