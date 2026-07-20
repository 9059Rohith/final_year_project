"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { authApi, parentApi } from "@/lib/api";

interface Child {
  id: string;
  name: string;
  age: number;
  avatar_color: string;
  active_programs: number;
  last_session_score?: number;
  mastery_score?: number;
  trend?: string;
}

const AVATAR_EMOJIS = ["🦁", "🐻", "🐼", "🦊", "🐨", "🐯", "🐸", "🐙"];

export default function ChildrenPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newChild, setNewChild] = useState({ name: "", age: "", avatar_color: "#F97316" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const res = await parentApi.dashboard();
      setChildren(res.data.children || []);
    } catch {
      try {
        const res = await authApi.listChildren();
        setChildren(res.data || []);
      } catch {
        toast.error("Failed to load children");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChild.name || !newChild.age) return;
    setAdding(true);
    try {
      await authApi.createChild({
        name: newChild.name,
        age: parseInt(newChild.age),
        avatar_color: newChild.avatar_color,
      });
      toast.success(`${newChild.name} added! 🎉`);
      setShowAdd(false);
      setNewChild({ name: "", age: "", avatar_color: "#F97316" });
      loadChildren();
    } catch {
      toast.error("Failed to add child");
    } finally {
      setAdding(false);
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-calm-bg flex items-center justify-center">
        <div className="text-warm-500 text-xl animate-pulse">Loading... 🤖</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-calm-bg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-warm-700">மித்ரா</h1>
          <p className="text-stone-500">Who is practising today?</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-stone-400 hover:text-warm-600 text-sm font-medium"
        >
          Logout
        </button>
      </div>

      {/* Children Grid — Netflix style */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {children.map((child, i) => (
            <button
              key={child.id}
              onClick={() => router.push(`/children/${child.id}`)}
              className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white border-2 border-warm-100 hover:border-warm-400 hover:shadow-warm transition-all group"
            >
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-md group-hover:scale-110 transition-transform"
                style={{ backgroundColor: child.avatar_color || "#F97316" }}
              >
                {AVATAR_EMOJIS[i % AVATAR_EMOJIS.length]}
              </div>
              <div className="text-center">
                <p className="font-bold text-lg text-stone-800">{child.name}</p>
                <p className="text-stone-400 text-sm">Age {child.age}</p>
              </div>
              {child.mastery_score != null && (
                <div className="flex items-center gap-1 text-sm">
                  <span
                    className={`font-bold ${
                      child.mastery_score >= 80
                        ? "text-accent-green"
                        : child.mastery_score >= 50
                        ? "text-warm-500"
                        : "text-stone-400"
                    }`}
                  >
                    {child.mastery_score.toFixed(0)}%
                  </span>
                  <span className="text-stone-400">mastery</span>
                  {child.trend === "improving" && <span>📈</span>}
                  {child.trend === "declining" && <span>📉</span>}
                </div>
              )}
            </button>
          ))}

          {/* Add Child Button */}
          <button
            onClick={() => setShowAdd(true)}
            className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-warm-50 border-2 border-dashed border-warm-300 hover:border-warm-500 hover:bg-warm-100 transition-all"
          >
            <div className="w-20 h-20 rounded-full bg-warm-100 flex items-center justify-center text-4xl">
              ➕
            </div>
            <p className="font-semibold text-warm-600">Add Child</p>
          </button>
        </div>

        {/* Empty state */}
        {children.length === 0 && (
          <div className="text-center mt-12 text-stone-400">
            <div className="text-6xl mb-4">👨‍👩‍👧</div>
            <p className="text-xl font-medium">No children yet</p>
            <p className="text-sm mt-1">Add your child to get started!</p>
          </div>
        )}
      </div>

      {/* Add Child Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAddChild}
            className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-warm-lg flex flex-col gap-4"
          >
            <h2 className="text-2xl font-bold text-warm-700 text-center">Add Child</h2>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Name</label>
              <input
                type="text"
                value={newChild.name}
                onChange={(e) => setNewChild((n) => ({ ...n, name: e.target.value }))}
                required
                placeholder="Arjun"
                className="w-full border border-warm-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-400 bg-warm-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Age</label>
              <input
                type="number"
                value={newChild.age}
                onChange={(e) => setNewChild((n) => ({ ...n, age: e.target.value }))}
                required
                min={1}
                max={18}
                placeholder="5"
                className="w-full border border-warm-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-400 bg-warm-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Avatar Color</label>
              <input
                type="color"
                value={newChild.avatar_color}
                onChange={(e) => setNewChild((n) => ({ ...n, avatar_color: e.target.value }))}
                className="w-full h-12 rounded-2xl border border-warm-200 cursor-pointer"
              />
            </div>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex-1 py-3 rounded-2xl border border-warm-200 text-stone-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding}
                className="flex-1 py-3 rounded-2xl bg-warm-500 text-white font-semibold disabled:opacity-60"
              >
                {adding ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
