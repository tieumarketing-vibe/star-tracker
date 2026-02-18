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

    return (
        <>
            <NavBar />
            <div className="page" style={{ maxWidth: 800 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 className="page-title">⚠️ Quản lý Hình phạt</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>Danh sách vi phạm và mức phạt sao</p>
                    </div>
                    <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn btn-peach">
                        <Plus size={18} /> Thêm hình phạt
                    </button>
                </div>

                {/* Penalty list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>
                    {penalties.map(pen => (
                        <div key={pen.id} className="card" style={{
                            display: "flex", alignItems: "center", gap: "1rem",
                            opacity: pen.is_active ? 1 : 0.5,
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
                            <button onClick={() => { setEditing(pen); setShowForm(true); }} className="btn btn-sm btn-sky">
                                <Edit2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Form modal */}
                {showForm && (
                    <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(null); }}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h2 className="modal-title">{editing ? "Sửa hình phạt" : "Thêm hình phạt mới"}</h2>
                                <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Tên vi phạm</label>
                                    <input name="name" className="input" defaultValue={editing?.name || ""} required />
                                </div>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Mô tả</label>
                                    <input name="description" className="input" defaultValue={editing?.description || ""} />
                                </div>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Icon (emoji)</label>
                                    <input name="icon" className="input" defaultValue={editing?.icon || "⚠️"} />
                                </div>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Số sao bị trừ</label>
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
