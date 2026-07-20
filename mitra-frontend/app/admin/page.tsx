"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { adminApi, authApi } from "@/lib/api";

interface Stats {
  total_users: number;
  total_children: number;
  total_sessions: number;
  total_attempts: number;
  active_users_today: number;
  avg_score: number;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminApi.stats(),
        adminApi.users(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || usersRes.data || []);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (!confirm("Seed demo data? This will add test users and content.")) return;
    setSeeding(true);
    try {
      await adminApi.seed();
      toast.success("Demo data seeded!");
      loadData();
    } catch {
      toast.error("Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  const toggleUser = async (id: string, is_active: boolean) => {
    try {
      await adminApi.updateUser(id, { is_active: !is_active });
      toast.success(is_active ? "User deactivated" : "User activated");
      loadData();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/login");
  };

  const filteredUsers = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  if (loading) {
    return (
      <div className="min-h-screen bg-calm-bg flex items-center justify-center">
        <div className="text-warm-500 text-xl animate-pulse">Loading... 🤖</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-calm-bg p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-warm-700">Admin Panel</h1>
            <p className="text-stone-500">Mitra system administration</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="bg-accent-purple hover:opacity-90 disabled:opacity-60 text-white px-4 py-2 rounded-2xl text-sm font-semibold"
            >
              {seeding ? "Seeding..." : "🌱 Seed Demo"}
            </button>
            <button onClick={handleLogout} className="text-stone-400 hover:text-warm-600 text-sm">
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
            {[
              { label: "Users", value: stats.total_users, emoji: "👥" },
              { label: "Children", value: stats.total_children, emoji: "🧒" },
              { label: "Sessions", value: stats.total_sessions, emoji: "📅" },
              { label: "Attempts", value: stats.total_attempts, emoji: "🎙" },
              { label: "Active Today", value: stats.active_users_today, emoji: "🟢" },
              { label: "Avg Score", value: `${stats.avg_score?.toFixed(0) ?? 0}%`, emoji: "🏆" },
            ].map((s) => (
              <div key={s.label} className="card-warm text-center py-3">
                <div className="text-xl mb-1">{s.emoji}</div>
                <div className="text-xl font-bold text-warm-700">{s.value}</div>
                <div className="text-stone-400 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Users Table */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-stone-700">Users</h2>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-warm-200 rounded-xl px-3 py-2 text-sm bg-warm-50 focus:outline-none focus:ring-2 focus:ring-warm-400"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="therapist">Therapist</option>
            <option value="parent">Parent</option>
          </select>
        </div>

        <div className="bg-white rounded-3xl border border-warm-100 overflow-hidden shadow-warm">
          <table className="w-full text-sm">
            <thead className="bg-warm-50 text-stone-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Role</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <tr key={user.id} className={i % 2 === 0 ? "bg-white" : "bg-warm-50/30"}>
                  <td className="px-4 py-3 font-medium text-stone-800">{user.full_name}</td>
                  <td className="px-4 py-3 text-stone-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      user.role === "admin" ? "bg-red-100 text-red-700" :
                      user.role === "therapist" ? "bg-blue-100 text-blue-700" :
                      "bg-warm-100 text-warm-700"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                    }`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleUser(user.id, user.is_active)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${
                        user.is_active
                          ? "bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-700"
                          : "bg-green-100 hover:bg-green-200 text-green-700"
                      }`}
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-400">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
