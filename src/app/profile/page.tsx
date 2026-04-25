"use client";

import { useState } from "react";
import { User, Settings, LogOut, ChevronRight, Plus, Crosshair, Pencil, Trash2, Check, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import PageHeader from "@/components/layout/PageHeader";
import MicButton from "@/components/MicButton";
import type { RifleProfile } from "@/lib/mockData";

// Common rimfire rifle makes for dropdown
const RIFLE_MAKES = [
  "Vudoo Gun Works", "Anschütz", "Lithgow", "CZ", "Bergara",
  "Tikka", "Ruger", "Savage", "Sako", "Schultz & Larsen",
  "Calfee", "Turbo", "RimX", "Zermatt Arms", "Other",
];

const BARREL_LENGTHS = ['16"', '18"', '20"', '22"', '24"', '26"', '28"'];
const BARREL_TWISTS = ["1:9", "1:10", "1:12", "1:14", "1:15", "1:16", "1:16.5"];
const TUNER_TYPES = ["None", "Harrell's", "EC Tuner", "Borden", "MTU Tuner", "Peterson", "Calfee", "Other"];

interface RifleFormData {
  make: string;
  model: string;
  barrelLength: string;
  barrelTwist: string;
  tunerType: string;
}

const emptyForm: RifleFormData = { make: "", model: "", barrelLength: '20"', barrelTwist: "1:16", tunerType: "None" };

export default function ProfilePage() {
  const { user, rifles, addRifle, updateRifle, deleteRifle } = useApp();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRifle, setEditingRifle] = useState<RifleProfile | null>(null);
  const [form, setForm] = useState<RifleFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setEditingRifle(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (rifle: RifleProfile) => {
    setEditingRifle(rifle);
    setForm({
      make: rifle.make,
      model: rifle.model,
      barrelLength: rifle.barrelLength,
      barrelTwist: rifle.barrelTwist,
      tunerType: rifle.tunerType,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.make.trim() || !form.model.trim()) return;

    if (editingRifle) {
      updateRifle({ ...editingRifle, ...form });
    } else {
      addRifle({
        id: `rifle-${Date.now()}`,
        ...form,
      });
    }
    setShowModal(false);
    setEditingRifle(null);
    setForm(emptyForm);
  };

  const handleDelete = (rifleId: string) => {
    deleteRifle(rifleId);
    setDeleteConfirm(null);
  };

  const setField = (field: keyof RifleFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <main className="p-4 max-w-md mx-auto space-y-6 pt-8 pb-36">
      <header className="mb-6">
        <PageHeader title="Profile" />
      </header>

      {/* User Card */}
      <div className="ios-card flex items-center gap-4 py-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-400 to-emerald-500 flex items-center justify-center">
          <span className="text-2xl font-black text-black">A</span>
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.fullName}</h2>
          <p className="text-sm text-textSecondary">{user.email}</p>
        </div>
      </div>

      {/* Rifles */}
      <div className="space-y-2">
        <div className="flex items-center justify-between ml-1 mr-1 mb-2">
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider">
            My Rifles ({rifles.length})
          </h3>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-gradient-to-r from-green-400 to-emerald-500 text-black text-xs font-bold px-3.5 py-2 rounded-xl active:scale-95 transition-transform shadow-lg shadow-green-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Rifle
          </button>
        </div>

        {rifles.length === 0 ? (
          <div className="ios-card flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#2C2C2E] flex items-center justify-center">
              <Crosshair className="w-7 h-7 text-textSecondary" />
            </div>
            <p className="text-sm text-textSecondary">No rifles added yet</p>
            <button onClick={openAdd} className="text-primary text-sm font-semibold">
              + Add your first rifle
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {rifles.map((rifle) => (
              <div key={rifle.id} className="ios-card">
                <div className="flex items-start gap-3">
                  {/* Rifle Icon */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-500/10 border border-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Crosshair className="w-5 h-5 text-green-400" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[15px] text-white truncate">
                      {rifle.make} {rifle.model}
                    </h4>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                      <span className="text-xs text-textSecondary flex items-center gap-1">
                        <span className="text-white/40">Barrel</span> {rifle.barrelLength}
                      </span>
                      <span className="text-xs text-textSecondary flex items-center gap-1">
                        <span className="text-white/40">Twist</span> {rifle.barrelTwist}
                      </span>
                      {rifle.tunerType !== "None" && (
                        <span className="text-xs text-textSecondary flex items-center gap-1">
                          <span className="text-white/40">Tuner</span> {rifle.tunerType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => openEdit(rifle)}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5 text-white/60" />
                    </button>
                    {deleteConfirm === rifle.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(rifle.id)}
                          className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center active:scale-90 transition-all"
                        >
                          <Check className="w-3.5 h-3.5 text-red-400" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all"
                        >
                          <X className="w-3.5 h-3.5 text-white/40" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(rifle.id)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/10 active:scale-90 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white/40" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="space-y-2 mt-8">
        <div className="ios-card divide-y divide-[#2C2C2E]">
          <button className="w-full flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-textSecondary" />
              <span>App Settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-textSecondary" />
          </button>
          <button className="w-full flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-500" />
              <span className="text-red-500">Log Out</span>
            </div>
          </button>
        </div>
      </div>

      {/* ═══════════ Add/Edit Rifle Modal ═══════════ */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />

          {/* Sheet */}
          <div className="relative w-full max-w-md bg-[#1C1C1E] rounded-t-3xl border-t border-white/10 p-5 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 32px), 32px)" }}>
            {/* Handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                  <Crosshair className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingRifle ? "Edit Rifle" : "Add Rifle"}
                  </h2>
                  <p className="text-[10px] text-textSecondary">
                    {editingRifle ? "Update rifle profile" : "Add a new rifle to your armory"}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Make */}
              <div>
                <label className="text-[11px] font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">
                  Manufacturer
                </label>
                <select
                  value={RIFLE_MAKES.includes(form.make) ? form.make : "Other"}
                  onChange={(e) => setField("make", e.target.value === "Other" ? "" : e.target.value)}
                  className="ios-input w-full text-sm"
                >
                  <option value="" disabled>Select manufacturer</option>
                  {RIFLE_MAKES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {(!RIFLE_MAKES.includes(form.make) || form.make === "Other") && form.make !== "" && (
                  <div className="flex gap-2 mt-2 items-center">
                    <input
                      className="ios-input flex-1 text-sm"
                      placeholder="Custom manufacturer..."
                      value={form.make === "Other" ? "" : form.make}
                      onChange={(e) => setField("make", e.target.value)}
                    />
                    <MicButton onResult={(text) => setField("make", text)} size="sm" />
                  </div>
                )}
              </div>

              {/* Model */}
              <div>
                <label className="text-[11px] font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">
                  Model
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    className="ios-input flex-1 text-sm"
                    placeholder="e.g. V-22, 1710, Rimfire Custom..."
                    value={form.model}
                    onChange={(e) => setField("model", e.target.value)}
                  />
                  <MicButton onResult={(text) => setField("model", text)} size="sm" />
                </div>
              </div>

              {/* Barrel Length + Twist — side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">
                    Barrel Length
                  </label>
                  <select
                    value={form.barrelLength}
                    onChange={(e) => setField("barrelLength", e.target.value)}
                    className="ios-input w-full text-sm"
                  >
                    {BARREL_LENGTHS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">
                    Twist Rate
                  </label>
                  <select
                    value={form.barrelTwist}
                    onChange={(e) => setField("barrelTwist", e.target.value)}
                    className="ios-input w-full text-sm"
                  >
                    {BARREL_TWISTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tuner */}
              <div>
                <label className="text-[11px] font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">
                  Tuner
                </label>
                <select
                  value={form.tunerType}
                  onChange={(e) => setField("tunerType", e.target.value)}
                  className="ios-input w-full text-sm"
                >
                  {TUNER_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!form.make.trim() || !form.model.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-black font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-40 shadow-lg shadow-green-500/20 mt-2"
              >
                {editingRifle ? "Save Changes" : "Add Rifle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
