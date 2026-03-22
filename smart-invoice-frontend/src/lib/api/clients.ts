import { authFetch } from "./authFetch";

export async function deleteClient(id: number) {
  const res = await authFetch(`/clients/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete client");
  return res.json();
}
