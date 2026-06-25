"use client";
import { useEffect, useState } from "react";
import { PageHeader, EmptyState } from "@/components/UI";
import { useToast } from "@/components/Toast";
import { formatDateTime } from "@/lib/utils";

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "seller", phone: "" });

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (role) params.set("role", role);
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      setUsers(data.users || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [role]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.push({ type: "error", message: "All fields are required." });
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      toast.push({ type: "success", message: "User created" });
      setCreating(false);
      setForm({ name: "", email: "", password: "", role: "seller", phone: "" });
      load();
    } catch (err: any) {
      toast.push({ type: "error", message: err.message });
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.push({ type: "error", message: data.error || "Failed" });
      return;
    }
    toast.push({ type: "success", message: `Status updated to ${status}` });
    load();
  }

  async function deleteUser(id: string) {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.push({ type: "error", message: data.error || "Failed" });
      return;
    }
    toast.push({ type: "success", message: "User removed" });
    load();
  }

  return (
    <>
      <PageHeader
        title="User management"
        subtitle="Approve accounts, manage roles, and review activity."
        actions={<button className="btn-primary" onClick={() => setCreating((v) => !v)}>{creating ? "Close" : "Invite user"}</button>}
      />

      {creating && (
        <form onSubmit={createUser} className="card p-5 mb-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input className="input sm:col-span-1" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input sm:col-span-1" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" className="input sm:col-span-1" placeholder="Initial password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="input sm:col-span-1" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="seller">Seller</option>
            <option value="vendor">Vendor</option>
          </select>
          <button type="submit" className="btn-primary">Create</button>
        </form>
      )}

      <div className="card p-4 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input className="input sm:col-span-2" placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="seller">Seller</option>
            <option value="vendor">Vendor</option>
          </select>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-10 text-center text-ink-400">Loading users…</div>
        ) : users.length === 0 ? (
          <EmptyState title="No users found" message="Invite team members to get started." />
        ) : (
          <div className="table-wrap rounded-xl border-0 shadow-none">
            <table className="w-full text-sm">
              <thead><tr>
                <th className="th">User</th><th className="th">Email</th><th className="th">Role</th><th className="th">Status</th><th className="th">Last login</th><th className="th"></th>
              </tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-ink-50/50">
                    <td className="td"><p className="font-medium text-ink-900">{u.name}</p><p className="text-xs text-ink-500">{u.phone || "—"}</p></td>
                    <td className="td">{u.email}</td>
                    <td className="td"><span className="badge bg-brand-50 text-brand-700 border-brand-200">{u.role}</span></td>
                    <td className="td"><span className={`badge ${u.status === "active" ? "bg-mint-50 text-mint-700 border-mint-200" : u.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-ink-100 text-ink-600 border-ink-200"}`}>{u.status}</span></td>
                    <td className="td">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}</td>
                    <td className="td">
                      <div className="flex items-center gap-2 justify-end">
                        {u.status !== "active" && (
                          <button onClick={() => updateStatus(u._id, "active")} className="text-xs font-medium text-mint-700 hover:underline">Approve</button>
                        )}
                        {u.status === "active" && (
                          <button onClick={() => updateStatus(u._id, "inactive")} className="text-xs font-medium text-amber-700 hover:underline">Deactivate</button>
                        )}
                        {u.role !== "admin" && (
                          <button onClick={() => deleteUser(u._id)} className="text-xs font-medium text-red-600 hover:underline">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
