"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllActivityTypes, createActivityType, updateActivityType } from "@/lib/actions";
import { NavBar } from "@/components/nav-bar";
import { Plus, Edit2, Save, X, Star } from "lucide-react";
import type { ActivityType } from "@/types";

export default function AdminActivitiesPage() {
    const [activities, setActivities] = useState<ActivityType[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<ActivityType | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        const data = await getAllActivityTypes();
        setActivities(data);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        if (editing) {
            await updateActivityType(editing.id, formData);
        } else {
            await createActivityType(formData);
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
                        <h1 className="page-title">📚 Quản lý Hoạt động</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>Thiết lập hoạt động đánh giá và điểm sao</p>
                    </div>
                    <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn btn-mint">
                        <Plus size={18} /> Thêm hoạt động
                    </button>
                </div>

                {/* Activity list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>
                    {activities.map(act => (
                        <div key={act.id} className="card" style={{
                            display: "flex", alignItems: "center", gap: "1rem",
                            opacity: act.is_active ? 1 : 0.5,
                        }}>
                            <span style={{ fontSize: "2rem" }}>{act.icon}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <h3 style={{ fontWeight: 800 }}>{act.name}</h3>
                                    {!act.is_active && <span className="badge badge-penalty">Tắt</span>}
                                </div>
                                <p style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>{act.description}</p>
                                <div style={{ display: "flex", gap: "1rem", marginTop: "0.3rem" }}>
                                    {[1, 2, 3].map(level => (
                                        <div key={level} style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.8rem" }}>
                                            {Array.from({ length: level }, (_, i) => (
                                                <Star key={i} size={12} fill="#FFE66D" color="#E8C94A" />
                                            ))}
                                            <span style={{ fontWeight: 700, color: "var(--mint-dark)" }}>
                                                = {act[`star_level_${level}` as keyof ActivityType]} sao
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => { setEditing(act); setShowForm(true); }} className="btn btn-sm btn-sky">
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
                                <h2 className="modal-title">{editing ? "Sửa hoạt động" : "Thêm hoạt động mới"}</h2>
                                <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Tên hoạt động</label>
                                    <input name="name" className="input" defaultValue={editing?.name || ""} required />
                                </div>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Icon (emoji)</label>
                                    <input name="icon" className="input" defaultValue={editing?.icon || "⭐"} />
                                </div>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Mô tả</label>
                                    <input name="description" className="input" defaultValue={editing?.description || ""} />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                                    <div>
                                        <label className="input-label">⭐ (1 sao)</label>
                                        <input name="star_level_1" type="number" className="input" defaultValue={editing?.star_level_1 || 1} min={0} />
                                    </div>
                                    <div>
                                        <label className="input-label">⭐⭐ (2 sao)</label>
                                        <input name="star_level_2" type="number" className="input" defaultValue={editing?.star_level_2 || 2} min={0} />
                                    </div>
                                    <div>
                                        <label className="input-label">⭐⭐⭐ (3 sao)</label>
                                        <input name="star_level_3" type="number" className="input" defaultValue={editing?.star_level_3 || 3} min={0} />
                                    </div>
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
