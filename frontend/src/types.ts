export type UserRole = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  trustScore: number;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string | null;
}

export interface PersonTag {
  tag: Tag;
}

export interface DataSource {
  id: string;
  name: string;
  baseUrl: string;
  sourceType: "API" | "RSS" | "MANUAL";
}

export interface Reference {
  id: string;
  personId: string;
  dataSourceId: string;
  url: string;
  content?: string | null;
  fetchedAt: string;
  dataSource?: DataSource;
}

export interface Person {
  id: string;
  fullName: string;
  role: string;
  category: string;
  isPublic: boolean;
  biography?: string | null;
  createdAt: string;
  references?: Reference[];
  tags?: PersonTag[];
}

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PersonRequest {
  id: string;
  requesterId: string;
  targetPersonName: string;
  status: RequestStatus;
  createdAt: string;
  reviewedAt?: string | null;
  reviewerId?: string | null;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  personId: string;
  note?: string | null;
  createdAt: string;
  person?: Person;
}
