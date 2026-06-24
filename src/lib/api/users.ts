import { apiRequest } from "./client";
import type { CreateUserPayload, User } from "./types";

export function listUsers() {
  return apiRequest<User[]>("/users/", { auth: true });
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
