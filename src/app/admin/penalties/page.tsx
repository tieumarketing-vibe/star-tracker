"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllPenaltyTypes, createPenaltyType, updatePenaltyType, deletePenaltyType, getAllRewards, createReward, updateReward, deleteReward } from "@/lib/actions";
import { NavBar } from "@/components/nav-bar";
import { Plus, Edit2, Save, X, Trash2, Flame, Star } from "lucide-react";
import type { PenaltyType, Reward } from "@/types";

export default function AdminPenaltiesPage() {
    const [penalties, setPenalties] = useState<PenaltyType[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<PenaltyType | null>(null);
    const [loading, setLoading] = useState(false);
    const [formType, setFormType] = useState<"penalty" | "bonus">("penalty");
    const [weeklyChallenges, setWeeklyChallenges] = useState<Reward[]>([]);
    const [showWeeklyForm, setShowWeeklyForm] = useState(false);
    const [editingWeekly, setEditingWeekly] = useState<Reward | null>(null);
    const [weeklyLoading, setWeeklyLoading] = useState(false);
    const router = useRouter();

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        const data = await getAllPenaltyTypes();
        setPenalties(data);
        const rewards = await getAllRewards();
        setWeeklyChallenges(rewards.filter((r: Reward) => r.is_weekly_challenge));
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

    async function handleDelete(id: string) {
        if (!confirm("Bạn có chắc muốn xóa mục này? Thao tác này không thể hoàn tác!")) return;
        setLoading(true);
        await deletePenaltyType(id);
        setShowForm(false);
        setEditing(null);
        await loadData();
        router.refresh();
        setLoading(false);
    }

    async function handleWeeklySubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setWeeklyLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.set("is_weekly_challenge", "true");
        formData.set("star_cost", "0");
        formData.set("tier", "weekly");
        formData.set("is_free_daily", "false");
        formData.set("image_url", "");

        if (editingWeekly) {
            formData.set("is_active", formData.get("is_active") ? "true" : "false");
            await updateReward(editingWeekly.id, formData);
        } else {
            await createReward(formData);
        }

        setShowWeeklyForm(false);
        setEditingWeekly(null);
        await loadData();
        router.refresh();
        setWeeklyLoading(false);
    }

    async function handleDeleteWeekly(id: string) {
        if (!confirm("Xóa thử thách tuần này?")) return;
        setWeeklyLoading(true);
        await deleteReward(id);
        setShowWeeklyForm(false);
        setEditingWeekly(null);
        await loadData();
        router.refresh();
        setWeeklyLoading(false);
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

                {/* Weekly Challenge section */}
                <div style={{ marginTop: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <h2 style={{ fontWeight: 800, fontSize: "1rem", color: "#E65100" }}>
                            🔥 Thử thách tuần (7 ngày)
                        </h2>
                        <button onClick={() => { setEditingWeekly(null); setShowWeeklyForm(true); }} className="btn btn-sm" style={{
                            background: "linear-gradient(135deg, #FF9800, #EE5A24)", color: "white", border: "none", fontWeight: 800,
                        }}>
                            <Plus size={16} /> Thêm thử thách
                        </button>
                    </div>

                    {weeklyChallenges.length === 0 ? (
                        <div className="card" style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
                            Chưa có thử thách tuần nào. Tạo thử thách để bé check-in mỗi ngày!
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {weeklyChallenges.map(item => (
                                <div key={item.id} className="card" style={{
                                    display: "flex", alignItems: "center", gap: "1rem",
                                    opacity: item.is_active ? 1 : 0.5,
                                    borderLeft: "4px solid #FF9800",
                                }}>
                                    <span style={{ fontSize: "2rem" }}>🔥</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <h3 style={{ fontWeight: 800 }}>{item.name}</h3>
                                            {!item.is_active && <span className="badge badge-penalty">Tắt</span>}
                                        </div>
                                        <p style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>{item.description}</p>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ color: "#E65100", fontWeight: 900, fontSize: "1.2rem" }}>+{item.weekly_bonus_stars}</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>sao/tuần</div>
                                    </div>
                                    <button onClick={() => { setEditingWeekly(item); setShowWeeklyForm(true); }} className="btn btn-sm btn-sky">
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Weekly Challenge Form Modal */}
                {showWeeklyForm && (
                    <div className="modal-overlay" onClick={() => { setShowWeeklyForm(false); setEditingWeekly(null); }}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h2 className="modal-title">🔥 {editingWeekly ? "Sửa thử thách tuần" : "Thêm thử thách tuần"}</h2>
                                <button onClick={() => { setShowWeeklyForm(false); setEditingWeekly(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
                            </div>

                            <div style={{
                                background: "#FFF3E0", padding: "0.75rem", borderRadius: "var(--radius-sm)",
                                marginBottom: "1.25rem", fontSize: "0.85rem", color: "#E65100", fontWeight: 600,
                            }}>
                                🔥 Bé check-in mỗi ngày trong trang Đánh giá. Hoàn thành 7/7 ngày sẽ nhận sao thưởng! Reset vào 24h Chủ nhật.
                            </div>

                            <form onSubmit={handleWeeklySubmit}>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Tên thử thách</label>
                                    <input name="name" className="input" defaultValue={editingWeekly?.name || ""} required
                                        placeholder="vd: Đánh răng đúng giờ" />
                                </div>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Mô tả</label>
                                    <input name="description" className="input" defaultValue={editingWeekly?.description || ""}
                                        placeholder="vd: Đánh răng sáng tối mỗi ngày" />
                                </div>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Số sao thưởng khi hoàn thành 7 ngày</label>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <input name="weekly_bonus_stars" type="number" className="input"
                                            defaultValue={editingWeekly?.weekly_bonus_stars || 5} min={1}
                                            style={{ width: 100 }} required />
                                        <span style={{ fontSize: "1.2rem" }}>⭐</span>
                                    </div>
                                </div>

                                {editingWeekly && (
                                    <div style={{ marginBottom: "1rem" }}>
                                        <label className="checkbox-cute">
                                            <input name="is_active" type="checkbox" value="true" defaultChecked={editingWeekly.is_active} />
                                            <span style={{ fontWeight: 700 }}>Hoạt động</span>
                                        </label>
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                    {editingWeekly && (
                                        <button type="button" onClick={() => handleDeleteWeekly(editingWeekly.id)} className="btn" style={{
                                            background: "#FFF0F0", color: "#c44", border: "2px solid #FFCACA",
                                            fontWeight: 800, flex: "0 0 auto",
                                        }} disabled={weeklyLoading}>
                                            <Trash2 size={16} /> Xóa
                                        </button>
                                    )}
                                    <button type="submit" className="btn" style={{
                                        flex: 1, background: "linear-gradient(135deg, #FF9800, #EE5A24)",
                                        color: "white", border: "none", fontWeight: 800,
                                    }} disabled={weeklyLoading}>
                                        <Save size={16} /> {weeklyLoading ? "Đang lưu..." : "Lưu"}
                                    </button>
                                </div>
                            </form>
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

                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                    {editing && (
                                        <button type="button" onClick={() => handleDelete(editing.id)} className="btn" style={{
                                            background: "#FFF0F0", color: "#c44", border: "2px solid #FFCACA",
                                            fontWeight: 800, flex: "0 0 auto",
                                        }} disabled={loading}>
                                            <Trash2 size={16} /> Xóa
                                        </button>
                                    )}
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                        <Save size={16} /> {loading ? "Đang lưu..." : "Lưu"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
