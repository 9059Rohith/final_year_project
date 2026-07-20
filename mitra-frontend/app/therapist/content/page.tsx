"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { contentApi, therapistApi } from "@/lib/api";

interface Module {
  id: string;
  name: string;
  description?: string;
  difficulty_level: string;
  is_published: boolean;
  item_count: number;
}

interface Child { id: string; name: string; }

export default function ContentPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [newMod, setNewMod] = useState({ name: "", description: "", difficulty_level: "beginner" });
  const [assignData, setAssignData] = useState({ child_id: "", sessions_per_week: "3" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [modRes, childRes] = await Promise.all([
        contentApi.listModules(),
        therapistApi.children(),
      ]);
      setModules(modRes.data.modules || modRes.data || []);
      setChildren(childRes.data.children || childRes.data || []);
    } catch {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const createModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await contentApi.createModule(newMod);
      toast.success("Module created!");
      setShowCreateModule(false);
      setNewMod({ name: "", description: "", difficulty_level: "beginner" });
      loadData();
    } catch {
      toast.error("Failed to create module");
    } finally {
      setSaving(false);
    }
  };

  const publishModule = async (id: string) => {
    try {
      await contentApi.publishModule(id);
      toast.success("Module published!");
      loadData();
    } catch {
      toast.error("Failed to publish");
    }
  };

  const assignProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssign || !assignData.child_id) return;
    setSaving(true);
    try {
      await therapistApi.assignProgram({
        child_id: assignData.child_id,
        module_id: showAssign,
        target_sessions_per_week: parseInt(assignData.sessions_per_week),
      });
      toast.success("Program assigned!");
      setShowAssign(null);
    } catch {
      toast.error("Failed to assign program");
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/therapist/dashboard")} className="text-stone-400 hover:text-warm-600 text-2xl">←</button>
            <div>
              <h1 className="text-2xl font-bold text-warm-700">Content Library</h1>
              <p className="text-stone-500 text-sm">Manage Tamil modules</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModule(true)}
            className="bg-warm-500 hover:bg-warm-600 text-white px-4 py-2 rounded-2xl text-sm font-semibold"
          >
            + New Module
          </button>
        </div>

        {/* Modules */}
        {modules.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <div className="text-5xl mb-3">📚</div>
            <p>No modules yet. Create your first!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {modules.map((mod) => (
              <div key={mod.id} className="card-warm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-800 text-lg">{mod.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        mod.is_published ? "bg-green-100 text-green-700" : "bg-warm-100 text-warm-600"
                      }`}>
                        {mod.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                    {mod.description && <p className="text-stone-500 text-sm mt-0.5">{mod.description}</p>}
                    <p className="text-stone-400 text-xs mt-1 capitalize">
                      {mod.difficulty_level} • {mod.item_count} words
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!mod.is_published && (
                      <button
                        onClick={() => publishModule(mod.id)}
                        className="bg-accent-green text-white px-3 py-1.5 rounded-xl text-xs font-medium"
                      >
                        Publish
                      </button>
                    )}
                    {mod.is_published && (
                      <button
                        onClick={() => setShowAssign(mod.id)}
                        className="bg-accent-purple text-white px-3 py-1.5 rounded-xl text-xs font-medium"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Module Modal */}
      {showCreateModule && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={createModule} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-warm-lg flex flex-col gap-4">
            <h2 className="text-xl font-bold text-warm-700 text-center">New Module</h2>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Name</label>
              <input
                type="text" required
                value={newMod.name}
                onChange={(e) => setNewMod((n) => ({ ...n, name: e.target.value }))}
                placeholder="Animals in Tamil"
                className="w-full border border-warm-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-400 bg-warm-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Description</label>
              <input
                type="text"
                value={newMod.description}
                onChange={(e) => setNewMod((n) => ({ ...n, description: e.target.value }))}
                placeholder="Learn animal names in Tamil"
                className="w-full border border-warm-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-400 bg-warm-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Difficulty</label>
              <select
                value={newMod.difficulty_level}
                onChange={(e) => setNewMod((n) => ({ ...n, difficulty_level: e.target.value }))}
                className="w-full border border-warm-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-400 bg-warm-50"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowCreateModule(false)} className="flex-1 py-3 rounded-2xl border border-warm-200 text-stone-600 font-semibold">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl bg-warm-500 text-white font-semibold disabled:opacity-60">{saving ? "Creating..." : "Create"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Program Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={assignProgram} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-warm-lg flex flex-col gap-4">
            <h2 className="text-xl font-bold text-warm-700 text-center">Assign Program</h2>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Child</label>
              <select
                required
                value={assignData.child_id}
                onChange={(e) => setAssignData((a) => ({ ...a, child_id: e.target.value }))}
                className="w-full border border-warm-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-400 bg-warm-50"
              >
                <option value="">Select child...</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Sessions per week</label>
              <input
                type="number" min={1} max={7}
                value={assignData.sessions_per_week}
                onChange={(e) => setAssignData((a) => ({ ...a, sessions_per_week: e.target.value }))}
                className="w-full border border-warm-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-400 bg-warm-50"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowAssign(null)} className="flex-1 py-3 rounded-2xl border border-warm-200 text-stone-600 font-semibold">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl bg-accent-purple text-white font-semibold disabled:opacity-60">{saving ? "Assigning..." : "Assign"}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
