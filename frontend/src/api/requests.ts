import { api } from "./client";
import type { PersonRequest, RequestStatus } from "../types";

export async function createRequest(targetPersonName: string): Promise<PersonRequest> {
  const { data } = await api.post<PersonRequest>("/requests", { targetPersonName });
  return data;
}

export async function listRequests(status: RequestStatus = "PENDING"): Promise<PersonRequest[]> {
  const { data } = await api.get<PersonRequest[]>("/requests", { params: { status } });
  return data;
}

export async function updateRequest(id: string, status: "APPROVED" | "REJECTED"): Promise<PersonRequest> {
  const { data } = await api.put<PersonRequest>(`/requests/${id}`, { status });
  return data;
}
