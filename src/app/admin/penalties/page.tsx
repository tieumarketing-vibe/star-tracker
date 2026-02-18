"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllPenaltyTypes, createPenaltyType, updatePenaltyType } from "@/lib/actions";
import { NavBar } from "@/components/nav-bar";
import { Plus, Edit2, Save, X } from "lucide-react";
import type { PenaltyType } from "@/types";

export default function AdminPenaltiesPage() {
    const [penalties, setPenalties] = useState<PenaltyType[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<PenaltyType | null>(null);
    const [loading, setLoading] = useState(false);
    const [formType, setFormType] = useState<"penalty" | "bonus">("penalty");
    const router = useRouter();

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        const data = await getAllPenaltyTypes();
        setPenalties(data);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.set("type", formType);

        if (editing) {
            await updatePenaltyType(editing.id, formData);
        } else {
            await createPenaltyType(formData);
        }

        setShowForm(false);
        setEditing(null);
        await loadData();
        router.refresh();
        setLoading(false);
    }

    const penaltyItems = penalties.filter(p => p.type !== "bonus");
    const bonusItems = penalties.filter(p => p.type === "bonus");

    return (
        <>
            <NavBar />
            <div className="page" style={{ maxWidth: 800 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 className="page-title">⚖️ Hình phạt & Thưởng thêm</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>
                            Quản lý các mục trừ sao và thưởng sao ngoài hạng mục chính
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => { setEditing(null); setFormType("bonus"); setShowForm(true); }} className="btn btn-mint">
                            <Plus size={18} /> Thêm thưởng
                        </button>
                        <button onClick={() => { setEditing(null); setFormType("penalty"); setShowForm(true); }} className="btn btn-peach">
                            <Plus size={18} /> Thêm phạt
                        </button>
                    </div>
                </div>

                {/* Bonus section */}
                {bonusItems.length > 0 && (
                    <div style={{ marginTop: "1.5rem" }}>
                        <h2 style={{ fontWeight: 800, fontSize: "1rem", color: "var(--mint-dark)", marginBottom: "0.75rem" }}>
                            🌟 Thưởng thêm
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {bonusItems.map(item => (
                                <div key={item.id} className="card" style={{
                                    display: "flex", alignItems: "center", gap: "1rem",
                                    opacity: item.is_active ? 1 : 0.5,
                                    borderLeft: "4px solid var(--mint)",
                                }}>
                                    <span style={{ fontSize: "2rem" }}>{item.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <h3 style={{ fontWeight: 800 }}>{item.name}</h3>
                                            {!item.is_active && <span className="badge badge-penalty">Tắt</span>}
                                        </div>
                                        <p style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>{item.description}</p>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ color: "var(--mint-dark)", fontWeight: 900, fontSize: "1.2rem" }}>+{item.star_deduction}</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>sao</div>
                                    </div>
                                    <button onClick={() => { setEditing(item); setFormType("bonus"); setShowForm(true); }} className="btn btn-sm btn-sky">
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Penalty section */}
                <div style={{ marginTop: "1.5rem" }}>
                    <h2 style={{ fontWeight: 800, fontSize: "1rem", color: "#c44", marginBottom: "0.75rem" }}>
                        ⚠️ Hình phạt
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {penaltyItems.map(pen => (
                            <div key={pen.id} className="card" style={{
                                display: "flex", alignItems: "center", gap: "1rem",
                                opacity: pen.is_active ? 1 : 0.5,
                                borderLeft: "4px solid #FF8A8A",
                            }}>
                                <span style={{ fontSize: "2rem" }}>{pen.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <h3 style={{ fontWeight: 800 }}>{pen.name}</h3>
                                        {!pen.is_active && <span className="badge badge-penalty">Tắt</span>}
                                    </div>
                                    <p style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>{pen.description}</p>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ color: "#c44", fontWeight: 900, fontSize: "1.2rem" }}>-{pen.star_deduction}</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>sao</div>
                                </div>
                                <button onClick={() => { setEditing(pen); setFormType("penalty"); setShowForm(true); }} className="btn btn-sm btn-sky">
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form modal */}
                {showForm && (
                    <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(null); }}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h2 className="modal-title">
                                    {editing
                                        ? (formType === "bonus" ? "Sửa thưởng thêm" : "Sửa hình phạt")
                                        : (formType === "bonus" ? "Thêm thưởng mới" : "Thêm hình phạt mới")
                                    }
                                </h2>
                                <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
                            </div>

                            {/* Type toggle */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
                                <button type="button" onClick={() => setFormType("bonus")} style={{
                                    padding: "0.6rem", borderRadius: "var(--radius-sm)",
                                    border: formType === "bonus" ? "2.5px solid var(--mint-dark)" : "2px solid #eee",
                                    background: formType === "bonus" ? "var(--mint-light)" : "white",
                                    cursor: "pointer", fontFamily: "Nunito", fontWeight: 700, fontSize: "0.85rem",
                                    color: formType === "bonus" ? "var(--mint-dark)" : "var(--text-light)",
                                    transition: "all 0.2s",
                                }}>🌟 Thưởng thêm</button>
                                <button type="button" onClick={() => setFormType("penalty")} style={{
                                    padding: "0.6rem", borderRadius: "var(--radius-sm)",
                                    border: formType === "penalty" ? "2.5px solid #c44" : "2px solid #eee",
                                    background: formType === "penalty" ? "#FFE0E0" : "white",
                                    cursor: "pointer", fontFamily: "Nunito", fontWeight: 700, fontSize: "0.85rem",
                                    color: formType === "penalty" ? "#c44" : "var(--text-light)",
                                    transition: "all 0.2s",
                                }}>⚠️ Hình phạt</button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">
                                        {formType === "bonus" ? "Tên hành vi tốt" : "Tên vi phạm"}
                                    </label>
                                    <input name="name" className="input" defaultValue={editing?.name || ""} required
                                        placeholder={formType === "bonus" ? "vd: Giúp mẹ dọn nhà" : "vd: Đánh nhau"} />
                                </div>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Mô tả</label>
                                    <input name="description" className="input" defaultValue={editing?.description || ""}
                                        placeholder={formType === "bonus" ? "Mô tả hành vi tốt..." : "Mô tả vi phạm..."} />
                                </div>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Icon (emoji)</label>
                                    <input name="icon" className="input" defaultValue={editing?.icon || (formType === "bonus" ? "🌟" : "⚠️")} />
                                </div>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">
                                        {formType === "bonus" ? "Số sao thưởng" : "Số sao bị trừ"}
                                    </label>
                                    <input name="star_deduction" type="number" className="input" defaultValue={editing?.star_deduction || 1} min={1} required />
                                </div>

                                {editing && (
                                    <div style={{ marginBottom: "1rem" }}>
                                        <label className="checkbox-cute">
                                            <input name="is_active" type="checkbox" value="true" defaultChecked={editing.is_active} />
                                            <span style={{ fontWeight: 700 }}>Hoạt động</span>
                                        </label>
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                                    <Save size={16} /> {loading ? "Đang lưu..." : "Lưu"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
