"use client";

import { useState, useRef, useCallback } from "react";
import { Package, Plus, ChevronRight, DollarSign, TrendingUp, Share2, X, Download, CheckCircle2, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import PageHeader from "@/components/layout/PageHeader";
import { AMMO_BRANDS, getModelsForBrand, getSpec, getTierColor, getTierLabel } from "@/lib/ammoCatalog";

export default function InventoryPage() {
  const { ammo, rifles, shots, getShotCountForLot, getLotCost, getLotCostPerRound, getGrade, getSD, getES, getAvgGroup, getAvgVertical, addAmmoLot } = useApp();
  const [reportLotId, setReportLotId] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Add Lot modal state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addState, setAddState] = useState<"form" | "saving" | "done">("form");
  const [lotsAdded, setLotsAdded] = useState(0);
  const [newLot, setNewLot] = useState({
    brand: "", customBrand: "",
    model: "", customModel: "",
    lotNumber: "", nickname: "",
    grainWeight: "40", bulletType: "LRN",
    quantity: "500", pricePerBox: "", roundsPerBox: "50",
  });

  const brandModels = newLot.brand && newLot.brand !== "Other" ? getModelsForBrand(newLot.brand) : [];
  const selectedSpec = newLot.brand && newLot.model ? getSpec(newLot.brand, newLot.model) : undefined;

  const handleBrandChange = (brand: string) => {
    if (brand === "Other") {
      setNewLot({ ...newLot, brand, model: "", customBrand: "", customModel: "" });
    } else {
      const models = getModelsForBrand(brand);
      const first = models[0];
      setNewLot({
        ...newLot, brand, model: first?.model || "", customBrand: "", customModel: "",
        grainWeight: String(first?.grainWeight || 40), bulletType: first?.bulletType || "LRN",
        pricePerBox: String(first?.defaultPricePerBox || ""), roundsPerBox: String(first?.defaultRoundsPerBox || 50),
      });
    }
  };

  const handleModelChange = (model: string) => {
    const spec = getSpec(newLot.brand, model);
    setNewLot({
      ...newLot, model,
      grainWeight: String(spec?.grainWeight || 40), bulletType: spec?.bulletType || "LRN",
      pricePerBox: String(spec?.defaultPricePerBox || ""), roundsPerBox: String(spec?.defaultRoundsPerBox || 50),
    });
  };

  const resetForm = (keepBrandModel = false) => {
    if (keepBrandModel) {
      setNewLot((prev) => ({ ...prev, lotNumber: "", nickname: "" }));
    } else {
      setNewLot({ brand: "", customBrand: "", model: "", customModel: "", lotNumber: "", nickname: "", grainWeight: "40", bulletType: "LRN", quantity: "500", pricePerBox: "", roundsPerBox: "50" });
    }
    setAddState("form");
  };

  const effectiveBrand = newLot.brand === "Other" ? newLot.customBrand : newLot.brand;
  const effectiveModel = newLot.brand === "Other" ? newLot.customModel : newLot.model;

  const handleAddLot = () => {
    if (!effectiveBrand.trim() || !newLot.lotNumber.trim()) return;
    setAddState("saving");
    setTimeout(() => {
      addAmmoLot({
        id: `lot-${Date.now()}`,
        brand: effectiveBrand.trim(),
        model: effectiveModel.trim(),
        lotNumber: newLot.lotNumber.trim(),
        nickname: newLot.nickname.trim() || undefined,
        grainWeight: parseInt(newLot.grainWeight) || 40,
        bulletType: newLot.bulletType || "LRN",
        purchaseDate: new Date().toISOString().split("T")[0],
        quantityPurchased: parseInt(newLot.quantity) || 500,
        quantityRemaining: parseInt(newLot.quantity) || 500,
        pricePerBox: parseFloat(newLot.pricePerBox) || 0,
        roundsPerBox: parseInt(newLot.roundsPerBox) || 50,
      });
      setLotsAdded((n) => n + 1);
      setAddState("done");
    }, 600);
  };

  const handleAddAnother = () => {
    resetForm(true); // keep brand & model, clear lot #
  };

  // Total investment
  const totalInvestment = ammo.reduce((sum, lot) => sum + getLotCost(lot), 0);
  const totalRounds = ammo.reduce((sum, lot) => sum + lot.quantityRemaining, 0);

  const reportLot = ammo.find((a) => a.id === reportLotId);

  const handleShare = useCallback(async () => {
    if (!reportRef.current) return;
    try {
      // Use html-to-canvas alternative: create a text-based share
      const lot = reportLot;
      if (!lot) return;
      const bestGrade = rifles.reduce((best, r) => {
        const g = getGrade(r.id, lot.id);
        return g.score > best.score ? { ...g, rifle: `${r.make} ${r.model}` } : best;
      }, { grade: "N/A", color: "#8E8E93", score: 0, rifle: "" });

      const text = [
        `🎯 LevelUP Lot Report`,
        `━━━━━━━━━━━━━━━━━━━`,
        `${lot.brand} ${lot.model} — Lot #${lot.lotNumber}`,
        ``,
        `Grade: ${bestGrade.grade} (${bestGrade.score}/100)`,
        `Best in: ${bestGrade.rifle}`,
        ``,
        `SD: ${getSD(lot.id)} fps`,
        `ES: ${getES(lot.id)} fps`,
        `Shots Logged: ${getShotCountForLot(lot.id)}`,
        ``,
        `Cost: $${getLotCostPerRound(lot).toFixed(3)}/rd`,
        `Investment: $${getLotCost(lot).toFixed(2)}`,
        `Remaining: ${lot.quantityRemaining} rounds`,
        ``,
        `Generated by LevelUP Precision Platform`,
      ].join("\n");

      if (navigator.share) {
        await navigator.share({
          title: `${lot.brand} ${lot.model} — Lot #${lot.lotNumber}`,
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Report copied to clipboard!");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  }, [reportLot, rifles, getGrade, getSD, getES, getShotCountForLot, getLotCostPerRound, getLotCost]);

  return (
    <main className="p-4 max-w-md mx-auto space-y-6 pt-8 pb-10">
      <header className="flex justify-between items-end mb-6">
        <div>
          <PageHeader title="Inventory" />
          <p className="text-textSecondary text-sm mt-1">
            {ammo.length} lot{ammo.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); resetForm(); }}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 text-black" />
        </button>
      </header>

      {/* Investment Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A]">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-xs text-textSecondary font-medium">Total Invested</span>
          </div>
          <p className="text-2xl font-bold tracking-tight">${totalInvestment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-textSecondary font-medium">Rounds on Hand</span>
          </div>
          <p className="text-2xl font-bold tracking-tight">{totalRounds.toLocaleString()}</p>
        </div>
      </div>

      {/* Lot Cards */}
      <div className="space-y-3">
        {ammo.map((lot) => {
          const shotsFired = getShotCountForLot(lot.id);
          const costPerRound = getLotCostPerRound(lot);
          const totalCost = getLotCost(lot);
          const grades = rifles.map((r) => ({ ...getGrade(r.id, lot.id), rifleId: r.id }));
          const bestGrade = grades.reduce((best, g) =>
            g.score > best.score ? g : best, grades[0]);
          const bestRifle = rifles.find((r) => r.id === bestGrade.rifleId);

          return (
            <div key={lot.id} className="ios-card space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center">
                    <Package className="w-5 h-5 text-textSecondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">
                      {lot.brand} {lot.model}
                    </h3>
                    <p className="text-xs text-textSecondary">
                      Lot #{lot.lotNumber} • {shotsFired} shots logged
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {bestGrade.grade !== "N/A" && (
                    <div
                      className="text-lg font-black w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        color: bestGrade.color,
                        backgroundColor: bestGrade.color + "15",
                      }}
                    >
                      {bestGrade.grade}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between bg-[#0A0A0A] rounded-xl px-3 py-2.5">
                <div className="text-center">
                  <p className="text-sm font-bold">{lot.quantityRemaining.toLocaleString()}</p>
                  <p className="text-[10px] text-textSecondary">rds left</p>
                </div>
                <div className="w-px h-6 bg-[#2C2C2E]" />
                <div className="text-center">
                  <p className="text-sm font-bold">${costPerRound.toFixed(2)}</p>
                  <p className="text-[10px] text-textSecondary">/round</p>
                </div>
                <div className="w-px h-6 bg-[#2C2C2E]" />
                <div className="text-center">
                  <p className="text-sm font-bold">${totalCost.toFixed(0)}</p>
                  <p className="text-[10px] text-textSecondary">invested</p>
                </div>
                <div className="w-px h-6 bg-[#2C2C2E]" />
                <div className="text-center">
                  <p className="text-sm font-bold text-primary">{bestRifle?.make || "—"}</p>
                  <p className="text-[10px] text-textSecondary">best in</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setReportLotId(lot.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2C2C2E] rounded-xl py-2.5 active:scale-95 transition-transform"
                >
                  <Share2 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold">Share Report</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lot Report Modal */}
      {reportLot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setReportLotId(null)}>
          <div className="w-full max-w-sm" ref={reportRef}>
            {/* Report Card */}
            <div className="bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] rounded-2xl border border-[#2C2C2E] overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-black text-xs font-bold uppercase tracking-wider opacity-70">Level<span className="font-black">UP</span> Lot Report</p>
                    <h2 className="text-black text-xl font-black mt-1">
                      {reportLot.brand} {reportLot.model}
                    </h2>
                    <p className="text-black/70 text-sm font-medium">Lot #{reportLot.lotNumber}</p>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const bestGrade = rifles.reduce((best, r) => {
                        const g = getGrade(r.id, reportLot.id);
                        return g.score > best.score ? { ...g, rifle: `${r.make} ${r.model}` } : best;
                      }, { grade: "N/A", color: "#8E8E93", score: 0, rifle: "" });
                      return (
                        <div className="bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                          <p className="text-3xl font-black text-white">{bestGrade.grade}</p>
                          <p className="text-white/70 text-[10px]">{bestGrade.score}/100</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-px bg-[#2C2C2E]">
                <div className="bg-[#1C1C1E] px-4 py-3">
                  <p className="text-[10px] text-textSecondary uppercase tracking-wider">Std Deviation</p>
                  <p className="text-xl font-bold mt-0.5">{getSD(reportLot.id)} <span className="text-xs text-textSecondary">fps</span></p>
                </div>
                <div className="bg-[#1C1C1E] px-4 py-3">
                  <p className="text-[10px] text-textSecondary uppercase tracking-wider">Ext Spread</p>
                  <p className="text-xl font-bold mt-0.5">{getES(reportLot.id)} <span className="text-xs text-textSecondary">fps</span></p>
                </div>
                <div className="bg-[#1C1C1E] px-4 py-3">
                  <p className="text-[10px] text-textSecondary uppercase tracking-wider">Shots Logged</p>
                  <p className="text-xl font-bold mt-0.5">{getShotCountForLot(reportLot.id)}</p>
                </div>
                <div className="bg-[#1C1C1E] px-4 py-3">
                  <p className="text-[10px] text-textSecondary uppercase tracking-wider">Avg Vertical</p>
                  <p className="text-xl font-bold mt-0.5">{getAvgVertical(reportLot.id)} <span className="text-xs text-textSecondary">in</span></p>
                </div>
              </div>

              {/* Cost Section */}
              <div className="border-t border-[#2C2C2E] px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-textSecondary uppercase tracking-wider">Investment</p>
                  <p className="text-lg font-bold">${getLotCost(reportLot).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-textSecondary uppercase tracking-wider">Cost/Round</p>
                  <p className="text-lg font-bold">${getLotCostPerRound(reportLot).toFixed(3)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-textSecondary uppercase tracking-wider">Remaining</p>
                  <p className="text-lg font-bold">{reportLot.quantityRemaining.toLocaleString()}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-[#2C2C2E] px-4 py-2.5 flex justify-between items-center">
                <p className="text-[10px] text-textSecondary">
                  Generated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-[10px] text-textSecondary font-semibold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Level<span className="font-black">UP</span> Precision
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setReportLotId(null)}
                className="flex-1 flex items-center justify-center gap-2 bg-[#2C2C2E] rounded-xl py-3 active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" />
                <span className="text-sm font-semibold">Close</span>
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-black rounded-xl py-3 active:scale-95 transition-transform font-bold"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Share</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lot Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center" onClick={() => { setShowAddForm(false); resetForm(); setLotsAdded(0); }}>
          <div className="w-full max-w-sm bg-[#1C1C1E] rounded-t-3xl sm:rounded-2xl border border-[#2C2C2E] overflow-y-auto max-h-[85vh]" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)" }}>
            {addState === "done" ? (
              <div className="py-12 flex flex-col items-center gap-3 px-5">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-lg font-bold">Lot Added!</p>
                <p className="text-sm text-textSecondary">{effectiveBrand} {effectiveModel} — Lot #{newLot.lotNumber}</p>
                {lotsAdded > 1 && (
                  <p className="text-[10px] text-green-400/60 font-mono">{lotsAdded} lots added this session</p>
                )}
                <div className="flex gap-3 w-full mt-3">
                  <button
                    onClick={handleAddAnother}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-black text-sm font-bold active:scale-95 transition-transform"
                  >
                    + Add Another Lot
                  </button>
                  <button
                    onClick={() => { setShowAddForm(false); resetForm(); setLotsAdded(0); }}
                    className="px-5 py-3 rounded-xl bg-[#2C2C2E] text-sm font-medium text-textSecondary active:scale-95 transition-transform"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#2C2C2E]">
                  <button onClick={() => { setShowAddForm(false); resetForm(); setLotsAdded(0); }} className="text-sm text-textSecondary font-medium">Cancel</button>
                  <h2 className="text-base font-bold">Add Test Lot</h2>
                  <button
                    onClick={handleAddLot}
                    disabled={!effectiveBrand.trim() || !newLot.lotNumber.trim() || addState === "saving"}
                    className="text-sm font-bold text-green-400 disabled:text-textSecondary/30"
                  >
                    {addState === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </button>
                </div>

                {/* Form */}
                <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Brand Dropdown */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider ml-1">Brand *</label>
                    <select
                      value={newLot.brand}
                      onChange={(e) => handleBrandChange(e.target.value)}
                      className="w-full bg-black border border-[#2C2C2E] rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500/50 transition-colors appearance-none"
                    >
                      <option value="">Select Brand...</option>
                      {AMMO_BRANDS.map((b) => (
                        <option key={b.name} value={b.name}>{b.flag} {b.name}{b.origin ? ` — ${b.origin}` : ""}</option>
                      ))}
                    </select>
                  </div>

                  {/* Custom brand input (only if Other) */}
                  {newLot.brand === "Other" && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider ml-1">Custom Brand Name *</label>
                      <input type="text" value={newLot.customBrand} onChange={(e) => setNewLot({ ...newLot, customBrand: e.target.value })} placeholder="Enter brand name" className="w-full bg-black border border-[#2C2C2E] rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500/50 transition-colors placeholder:text-textSecondary/30" />
                    </div>
                  )}

                  {/* Model Dropdown */}
                  {newLot.brand && newLot.brand !== "Other" && brandModels.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider ml-1">Model</label>
                      <select
                        value={newLot.model}
                        onChange={(e) => handleModelChange(e.target.value)}
                        className="w-full bg-black border border-[#2C2C2E] rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500/50 transition-colors appearance-none"
                      >
                        {brandModels.map((m) => (
                          <option key={m.model} value={m.model}>{m.model} — {m.grainWeight}gr {m.bulletType}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Custom model input (only if Other) */}
                  {newLot.brand === "Other" && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider ml-1">Model / Type</label>
                      <input type="text" value={newLot.customModel} onChange={(e) => setNewLot({ ...newLot, customModel: e.target.value })} placeholder="Enter model name" className="w-full bg-black border border-[#2C2C2E] rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500/50 transition-colors placeholder:text-textSecondary/30" />
                    </div>
                  )}

                  {/* Spec Preview Badge */}
                  {selectedSpec && (
                    <div className="bg-[#0A0A0A] rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getTierColor(selectedSpec.tier)} bg-current/10`} style={{ backgroundColor: `${selectedSpec.tier === "elite" ? "rgba(250,204,21,0.1)" : selectedSpec.tier === "match" ? "rgba(74,222,128,0.1)" : selectedSpec.tier === "target" ? "rgba(96,165,250,0.1)" : "rgba(142,142,147,0.1)"}` }}>
                          {getTierLabel(selectedSpec.tier)}
                        </span>
                        <span className="text-xs text-textSecondary">{selectedSpec.grainWeight}gr {selectedSpec.bulletType} • {selectedSpec.origin}</span>
                      </div>
                    </div>
                  )}

                  {/* Lot Number & Nickname */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider ml-1">Lot Number *</label>
                      <input type="text" value={newLot.lotNumber} onChange={(e) => setNewLot({ ...newLot, lotNumber: e.target.value })} placeholder="e.g. 2847" className="w-full bg-black border border-[#2C2C2E] rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500/50 transition-colors placeholder:text-textSecondary/30" autoFocus />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider ml-1">Nickname</label>
                      <input type="text" value={newLot.nickname} onChange={(e) => setNewLot({ ...newLot, nickname: e.target.value })} placeholder="optional" className="w-full bg-black border border-[#2C2C2E] rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500/50 transition-colors placeholder:text-textSecondary/30" />
                    </div>
                  </div>

                  {/* Quantity & Weight */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider ml-1">Quantity (rounds)</label>
                      <input type="number" value={newLot.quantity} onChange={(e) => setNewLot({ ...newLot, quantity: e.target.value })} placeholder="500" className="w-full bg-black border border-[#2C2C2E] rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500/50 transition-colors placeholder:text-textSecondary/30" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider ml-1">Grain Weight</label>
                      <input type="number" value={newLot.grainWeight} onChange={(e) => setNewLot({ ...newLot, grainWeight: e.target.value })} className="w-full bg-black border border-[#2C2C2E] rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500/50 transition-colors placeholder:text-textSecondary/30" />
                    </div>
                  </div>

                  {/* Cost */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider ml-1">Price per Box ($)</label>
                      <input type="number" step="0.01" value={newLot.pricePerBox} onChange={(e) => setNewLot({ ...newLot, pricePerBox: e.target.value })} placeholder="14.99" className="w-full bg-black border border-[#2C2C2E] rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500/50 transition-colors placeholder:text-textSecondary/30" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider ml-1">Rounds per Box</label>
                      <input type="number" value={newLot.roundsPerBox} onChange={(e) => setNewLot({ ...newLot, roundsPerBox: e.target.value })} className="w-full bg-black border border-[#2C2C2E] rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500/50 transition-colors placeholder:text-textSecondary/30" />
                    </div>
                  </div>

                  {/* Cost Preview */}
                  {newLot.pricePerBox && newLot.roundsPerBox && (
                    <div className="bg-[#0A0A0A] rounded-xl p-3 flex items-center justify-between">
                      <span className="text-xs text-textSecondary">Cost per Round</span>
                      <span className="text-sm font-bold font-mono text-green-400">
                        ${(parseFloat(newLot.pricePerBox) / parseInt(newLot.roundsPerBox || "50")).toFixed(3)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
