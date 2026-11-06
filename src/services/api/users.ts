/** Company users: sellers (username login) and admins. */
import { apiClient } from "@/services/api/client";
import { forget } from "@/services/api/cache";
import type { UserDTO, UserRole } from "@/types/api";

const base = (companyId: string) => `/companies/${companyId}`;

export const usersApi = {
  list: (companyId: string) => apiClient.get<UserDTO[]>(`${base(companyId)}/users?size=100`),
  create: (
    companyId: string,
    body: { full_name: string; username: string; password: string; role: "seller" | "admin" },
  ) => apiClient.post<UserDTO>(`${base(companyId)}/users`, body),
  /** Also clears the cached signed-in user (`useProfile`), in case the change was to oneself. */
  update: async (
    companyId: string,
    userId: string,
    body: { full_name?: string; password?: string; status?: "active" | "disabled" },
  ) => {
    const user = await apiClient.patch<UserDTO>(`${base(companyId)}/users/${userId}`, body);
    forget("/auth/me");
    return user;
  },
  setRole: (companyId: string, userId: string, role: Exclude<UserRole, "owner">) =>
    apiClient.patch<UserDTO>(`${base(companyId)}/users/${userId}/role`, { role }),
};

/** A wrong current password comes back as 400 with a Spanish message, so the shared client handles it. */
export function changeOwnPassword(body: { current_password: string; new_password: string }): Promise<void> {
  return apiClient.patch<void>("/auth/me/password", body);
}
