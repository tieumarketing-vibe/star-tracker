"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllRewards, createReward, updateReward } from "@/lib/actions";
import { NavBar } from "@/components/nav-bar";
import { Plus, Edit2, Save, X, Star, Gift } from "lucide-react";
import type { Reward } from "@/types";

export default function AdminRewardsPage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Reward | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        const data = await getAllRewards();
        setRewards(data);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        if (editing) {
            await updateReward(editing.id, formData);
        } else {
            await createReward(formData);
        }

        setShowForm(false);
        setEditing(null);
        await loadData();
        router.refresh();
        setLoading(false);
    }

    const tierLabels: Record<string, string> = { weekly: "Tuần", monthly: "Tháng", yearly: "Năm" };

    return (
        <>
            <NavBar />
            <div className="page">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 className="page-title">🎁 Quản lý Vật phẩm</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>Catalog vật phẩm để bé đổi sao</p>
                    </div>
                    <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn btn-sky">
                        <Plus size={18} /> Thêm vật phẩm
                    </button>
                </div>

                {/* Rewards grid */}
                <div className="grid-cards" style={{ marginTop: "1.5rem" }}>
                    {rewards.map(reward => (
                        <div key={reward.id} className="card" style={{
                            opacity: reward.is_active ? 1 : 0.5,
                            position: "relative",
                        }}>
                            {!reward.is_active && (
                                <span className="badge badge-penalty" style={{ position: "absolute", top: "0.75rem", left: "0.75rem" }}>Tắt</span>
                            )}
                            <span className={`badge badge-${reward.tier}`} style={{ position: "absolute", top: "0.75rem", right: "0.75rem" }}>
                                {tierLabels[reward.tier]}
                            </span>

                            {/* Image */}
                            <div style={{
                                width: "100%", height: 120, borderRadius: "var(--radius-sm)",
                                background: reward.image_url
                                    ? `url(${reward.image_url}) center/cover`
                                    : "linear-gradient(135deg, #FFD6DD, #D4F5E9)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                marginBottom: "0.75rem",
                            }}>
                                {!reward.image_url && <Gift size={40} color="#E8899A" />}
                            </div>

                            <h3 style={{ fontWeight: 800, fontSize: "0.95rem" }}>{reward.name}</h3>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-light)", marginBottom: "0.5rem" }}>{reward.description}</p>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 800, color: "#8a7020" }}>
                                    <Star size={16} fill="#FFE66D" color="#E8C94A" /> {reward.star_cost}
                                </div>
                                <button onClick={() => { setEditing(reward); setShowForm(true); }} className="btn btn-sm btn-sky">
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Form modal */}
                {showForm && (
                    <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(null); }}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h2 className="modal-title">{editing ? "Sửa vật phẩm" : "Thêm vật phẩm mới"}</h2>
                                <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Tên vật phẩm</label>
                                    <input name="name" className="input" defaultValue={editing?.name || ""} required />
                                </div>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Mô tả</label>
                                    <textarea name="description" className="input" defaultValue={editing?.description || ""} rows={2} />
                                </div>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">URL hình ảnh</label>
                                    <input name="image_url" className="input" defaultValue={editing?.image_url || ""} placeholder="https://..." />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                                    <div>
                                        <label className="input-label">Giá (sao)</label>
                                        <input name="star_cost" type="number" className="input" defaultValue={editing?.star_cost || 10} min={1} required />
                                    </div>
                                    <div>
                                        <label className="input-label">Loại</label>
                                        <select name="tier" className="select" defaultValue={editing?.tier || "weekly"}>
                                            <option value="weekly">Tuần</option>
                                            <option value="monthly">Tháng</option>
                                            <option value="yearly">Năm</option>
                                        </select>
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
