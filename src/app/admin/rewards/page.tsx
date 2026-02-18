"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAllRewards, createReward, updateReward } from "@/lib/actions";
import { NavBar } from "@/components/nav-bar";
import { Plus, Edit2, Save, X, Star, Gift, Camera, Link, ImagePlus } from "lucide-react";
import type { Reward } from "@/types";

export default function AdminRewardsPage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Reward | null>(null);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState("");
    const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
    const [uploading, setUploading] = useState(false);
    const [isFreeDailyChecked, setIsFreeDailyChecked] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        const data = await getAllRewards();
        setRewards(data);
    }

    async function uploadImage(file: File): Promise<string> {
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("bucket", "rewards");
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (data.url) return data.url;
            throw new Error(data.error || "Upload failed");
        } finally {
            setUploading(false);
        }
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        try {
            const url = await uploadImage(file);
            setImagePreview(url);
        } catch (err) {
            console.error("Upload failed:", err);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        if (imageMode === "upload" && imagePreview && !imagePreview.startsWith("data:")) {
            formData.set("image_url", imagePreview);
        }

        // Force star_cost to 0 for free daily rewards
        if (isFreeDailyChecked) {
            formData.set("star_cost", "0");
        }

        if (editing) {
            await updateReward(editing.id, formData);
        } else {
            await createReward(formData);
        }

        setShowForm(false);
        setEditing(null);
        setImagePreview("");
        await loadData();
        router.refresh();
        setLoading(false);
    }

    function openForm(reward?: Reward) {
        setEditing(reward || null);
        setImagePreview(reward?.image_url || "");
        setImageMode(reward?.image_url ? "url" : "upload");
        setIsFreeDailyChecked(reward?.is_free_daily || false);
        setShowForm(true);
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
                    <button onClick={() => openForm()} className="btn btn-sky">
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
                            <span className={`badge badge-${reward.tier}`} style={{ position: "absolute", top: "0.75rem", right: "0.75rem", zIndex: 2 }}>
                                {tierLabels[reward.tier]}
                            </span>

                            <div style={{
                                width: "100%", height: 120, borderRadius: "var(--radius-sm)",
                                background: reward.image_url
                                    ? `url(${reward.image_url}) center/cover`
                                    : "linear-gradient(135deg, #FFD6DD, #D4F5E9)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                marginBottom: "0.75rem", position: "relative",
                            }}>
                                {!reward.image_url && <Gift size={40} color="#E8899A" />}
                                {reward.is_free_daily && (
                                    <span style={{
                                        position: "absolute", bottom: 8, left: 8,
                                        background: "linear-gradient(135deg, #4ECDC4, #2a7a5a)",
                                        color: "white", padding: "0.15rem 0.5rem",
                                        borderRadius: "100px", fontSize: "0.7rem", fontWeight: 800,
                                    }}>🎁 FREE mỗi ngày</span>
                                )}
                            </div>

                            <h3 style={{ fontWeight: 800, fontSize: "0.95rem" }}>{reward.name}</h3>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-light)", marginBottom: "0.5rem" }}>{reward.description}</p>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 800, color: reward.is_free_daily ? "#2a7a5a" : "#8a7020" }}>
                                    {reward.is_free_daily ? "🎁 FREE" : <><Star size={16} fill="#FFE66D" color="#E8C94A" /> {reward.star_cost}</>}
                                </div>
                                <button onClick={() => openForm(reward)} className="btn btn-sm btn-sky">
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Form modal */}
                {showForm && (
                    <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(null); setImagePreview(""); }}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h2 className="modal-title">{editing ? "Sửa vật phẩm" : "Thêm vật phẩm mới"}</h2>
                                <button onClick={() => { setShowForm(false); setEditing(null); setImagePreview(""); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
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

                                {/* Image section */}
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Hình ảnh</label>

                                    {/* Mode toggle */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                        <button type="button" onClick={() => setImageMode("upload")} style={{
                                            padding: "0.5rem", borderRadius: "var(--radius-sm)",
                                            border: imageMode === "upload" ? "2.5px solid var(--sky-dark)" : "2px solid #eee",
                                            background: imageMode === "upload" ? "var(--sky-light)" : "white",
                                            cursor: "pointer", fontFamily: "Nunito", fontWeight: 700, fontSize: "0.8rem",
                                            color: imageMode === "upload" ? "var(--sky-dark)" : "var(--text-light)",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
                                            transition: "all 0.2s",
                                        }}>
                                            <Camera size={14} /> Chụp / Chọn ảnh
                                        </button>
                                        <button type="button" onClick={() => setImageMode("url")} style={{
                                            padding: "0.5rem", borderRadius: "var(--radius-sm)",
                                            border: imageMode === "url" ? "2.5px solid var(--mint-dark)" : "2px solid #eee",
                                            background: imageMode === "url" ? "var(--mint-light)" : "white",
                                            cursor: "pointer", fontFamily: "Nunito", fontWeight: 700, fontSize: "0.8rem",
                                            color: imageMode === "url" ? "var(--mint-dark)" : "var(--text-light)",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
                                            transition: "all 0.2s",
                                        }}>
                                            <Link size={14} /> Nhập URL
                                        </button>
                                    </div>

                                    {imageMode === "upload" ? (
                                        <div>
                                            <input
                                                ref={cameraInputRef}
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handleFileChange}
                                                style={{ display: "none" }}
                                            />
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                style={{ display: "none" }}
                                            />

                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                                <button type="button" onClick={() => cameraInputRef.current?.click()} style={{
                                                    padding: "1rem", border: "2px dashed var(--sky)",
                                                    borderRadius: "var(--radius-sm)", background: "var(--sky-light)",
                                                    cursor: "pointer", display: "flex", flexDirection: "column",
                                                    alignItems: "center", gap: "0.3rem", fontFamily: "Nunito",
                                                    fontWeight: 700, fontSize: "0.8rem", color: "var(--sky-dark)",
                                                }}>
                                                    <Camera size={24} />
                                                    Chụp ảnh
                                                </button>
                                                <button type="button" onClick={() => fileInputRef.current?.click()} style={{
                                                    padding: "1rem", border: "2px dashed var(--mint)",
                                                    borderRadius: "var(--radius-sm)", background: "var(--mint-light)",
                                                    cursor: "pointer", display: "flex", flexDirection: "column",
                                                    alignItems: "center", gap: "0.3rem", fontFamily: "Nunito",
                                                    fontWeight: 700, fontSize: "0.8rem", color: "var(--mint-dark)",
                                                }}>
                                                    <ImagePlus size={24} />
                                                    Thư viện
                                                </button>
                                            </div>

                                            {uploading && (
                                                <div style={{ textAlign: "center", padding: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                                    ⏳ Đang upload ảnh...
                                                </div>
                                            )}

                                            <input type="hidden" name="image_url" value={imagePreview.startsWith("data:") ? "" : imagePreview} />
                                        </div>
                                    ) : (
                                        <input
                                            name="image_url"
                                            className="input"
                                            defaultValue={editing?.image_url || ""}
                                            placeholder="https://example.com/image.jpg"
                                            onChange={(e) => setImagePreview(e.target.value)}
                                        />
                                    )}

                                    {/* Image preview */}
                                    {imagePreview && (
                                        <div style={{ marginTop: "0.75rem", position: "relative" }}>
                                            <div style={{
                                                width: "100%", height: 140, borderRadius: "var(--radius-sm)",
                                                background: `url(${imagePreview}) center/cover`,
                                                border: "2px solid var(--mint)",
                                            }} />
                                            <button type="button" onClick={() => setImagePreview("")} style={{
                                                position: "absolute", top: 6, right: 6,
                                                width: 24, height: 24, borderRadius: "50%",
                                                background: "rgba(0,0,0,0.5)", color: "white",
                                                border: "none", cursor: "pointer", fontSize: "0.75rem",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}>✕</button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                                    <div>
                                        <label className="input-label">Giá (sao)</label>
                                        <input name="star_cost" type="number" className="input" defaultValue={isFreeDailyChecked ? 0 : (editing?.star_cost || 10)} min={0} required disabled={isFreeDailyChecked} />
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

                                {/* Free daily toggle */}
                                <div style={{
                                    marginBottom: "1rem", padding: "0.75rem",
                                    background: isFreeDailyChecked ? "var(--mint-light)" : "#f9f9f9",
                                    borderRadius: "var(--radius-sm)",
                                    border: isFreeDailyChecked ? "2px solid var(--mint)" : "2px solid #eee",
                                    transition: "all 0.2s",
                                }}>
                                    <label className="checkbox-cute">
                                        <input name="is_free_daily" type="checkbox" value="true"
                                            checked={isFreeDailyChecked}
                                            onChange={(e) => setIsFreeDailyChecked(e.target.checked)}
                                        />
                                        <span style={{ fontWeight: 700 }}>🎁 Phần thưởng FREE mỗi ngày</span>
                                    </label>
                                    {isFreeDailyChecked && (
                                        <p style={{ fontSize: "0.8rem", color: "var(--mint-dark)", marginTop: "0.3rem", marginLeft: "1.5rem" }}>
                                            Bé được nhận miễn phí 1 lần/ngày, không tốn sao
                                        </p>
                                    )}
                                </div>

                                {editing && (
                                    <div style={{ marginBottom: "1rem" }}>
                                        <label className="checkbox-cute">
                                            <input name="is_active" type="checkbox" value="true" defaultChecked={editing.is_active} />
                                            <span style={{ fontWeight: 700 }}>Hoạt động</span>
                                        </label>
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading || uploading}>
                                    <Save size={16} /> {loading ? "Đang lưu..." : uploading ? "Đang upload..." : "Lưu"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
