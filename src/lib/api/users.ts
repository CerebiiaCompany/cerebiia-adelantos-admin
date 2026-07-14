import { apiRequest } from "./client";
import type { CreateUserPayload, ListUsersParams, User } from "./types";

function buildUsersQuery(params?: ListUsersParams): string {
  if (!params?.role) return "";
  return `?role=${encodeURIComponent(params.role)}`;
}

export function listUsers(params?: ListUsersParams) {
  return apiRequest<User[]>(`/users/${buildUsersQuery(params)}`, { auth: true });
}

export function getUser(userId: string) {
  return apiRequest<User>(`/users/${userId}/`, { auth: true });
}

export function createUser(payload: CreateUserPayload) {
  return apiRequest<User>("/users/", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function deactivateUser(userId: string) {
  return apiRequest<void>(`/users/${userId}/`, {
    method: "DELETE",
    auth: true,
  });
}
