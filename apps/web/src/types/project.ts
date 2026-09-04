export type ProjectRole = "OWNER" | "MEMBER";

export interface ProjectOwner {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface ProjectBoard {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: ProjectOwner;
  board: ProjectBoard | null;
  _count: { members: number };
  currentUserRole: ProjectRole;
}

export interface ProjectInput {
  name: string;
  description?: string | null;
}
