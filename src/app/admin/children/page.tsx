"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getChildren, createChild, updateChild, deleteChild } from "@/lib/actions";
import { NavBar } from "@/components/nav-bar";
import { Plus, Edit2, Trash2, Save, X, Camera, ImagePlus } from "lucide-react";
import type { Child } from "@/types";

const AVATARS = [
    "🧒", "👧", "👦", "👶", "🧒🏻", "👧🏻", "👦🏻",
    "🐻", "🐰", "🦊", "🐱", "🐼", "🦁", "🐶", "🐸",
    "🦄", "🐝", "🦋", "🐬", "🐠", "🌸", "⭐", "🌈",
];

export default function AdminChildrenPage() {
    const [children, setChildren] = useState<Child[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Child | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState("");
    const [avatarMode, setAvatarMode] = useState<"emoji" | "photo">("emoji");
    const [uploading, setUploading] = useState(false);
    const cameraRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setSelectedAvatar(ev.target?.result as string);
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("bucket", "avatars");
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (data.url) {
                setSelectedAvatar(data.url);
            } else {
                console.error("Upload error:", data.error);
            }
        } catch (err) { console.error(err); }
        setUploading(false);
    }

    useEffect(() => {
        loadChildren();
    }, []);

    async function loadChildren() {
        const data = await getChildren();
        setChildren(data);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        let result;
        if (editing) {
            result = await updateChild(editing.id, formData);
        } else {
            result = await createChild(formData);
        }

        if (result.error) {
            setMessage(result.error);
        } else {
            setShowForm(false);
            setEditing(null);
            await loadChildren();
            router.refresh();
        }
        setLoading(false);
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Xóa bé "${name}"? Tất cả dữ liệu sẽ bị mất!`)) return;
        await deleteChild(id);
        await loadChildren();
        router.refresh();
    }

    function openEdit(child: Child) {
        setEditing(child);
        setSelectedAvatar(child.avatar_url || "");
        setAvatarMode(child.avatar_url?.startsWith("http") ? "photo" : "emoji");
        setShowForm(true);
    }

    return (
        <>
            <NavBar />
            <div className="page" style={{ maxWidth: 800 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 className="page-title">👶 Quản lý bé</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>{children.length} bé</p>
                    </div>
                    <button onClick={() => { setEditing(null); setSelectedAvatar(""); setShowForm(true); }} className="btn btn-primary">
                        <Plus size={18} /> Thêm bé
                    </button>
                </div>

                {/* Children list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>
                    {children.map((child, idx) => (
                        <div key={child.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div className="avatar" style={{
                                width: 60, height: 60, fontSize: "2rem",
                                background: child.avatar_url?.startsWith("http")
                                    ? `url(${child.avatar_url}) center/cover`
                                    : ["#FFB5C240", "#B5EAD740", "#A0D2DB40"][idx % 3],
                                backgroundSize: "cover",
                                flexShrink: 0,
                            }}>
                                {!child.avatar_url?.startsWith("http") && (child.avatar_url || AVATARS[idx % AVATARS.length])}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontWeight: 800 }}>{child.name}</h3>
                                {child.birth_date && (
                                    <p style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>
                                        Sinh: {new Date(child.birth_date).toLocaleDateString("vi-VN")}
                                    </p>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button onClick={() => openEdit(child)} className="btn btn-sm btn-sky">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDelete(child.id, child.name)} className="btn btn-sm btn-danger">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Form modal */}
                {showForm && (
                    <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(null); setSelectedAvatar(""); }}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h2 className="modal-title">{editing ? "Sửa thông tin bé" : "Thêm bé mới"}</h2>
                                <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Tên bé</label>
                                    <input name="name" className="input" defaultValue={editing?.name || ""} required placeholder="Nhập tên bé..." />
                                </div>

                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Avatar</label>

                                    {/* Mode toggle */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                        <button type="button" onClick={() => setAvatarMode("emoji")} style={{
                                            padding: "0.5rem", borderRadius: "var(--radius-sm)",
                                            border: avatarMode === "emoji" ? "2.5px solid var(--mint-dark)" : "2px solid #eee",
                                            background: avatarMode === "emoji" ? "var(--mint-light)" : "white",
                                            cursor: "pointer", fontFamily: "Nunito", fontWeight: 700, fontSize: "0.8rem",
                                            color: avatarMode === "emoji" ? "var(--mint-dark)" : "var(--text-light)",
                                            transition: "all 0.2s",
                                        }}>😊 Emoji</button>
                                        <button type="button" onClick={() => setAvatarMode("photo")} style={{
                                            padding: "0.5rem", borderRadius: "var(--radius-sm)",
                                            border: avatarMode === "photo" ? "2.5px solid var(--sky-dark)" : "2px solid #eee",
                                            background: avatarMode === "photo" ? "var(--sky-light)" : "white",
                                            cursor: "pointer", fontFamily: "Nunito", fontWeight: 700, fontSize: "0.8rem",
                                            color: avatarMode === "photo" ? "var(--sky-dark)" : "var(--text-light)",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
                                            transition: "all 0.2s",
                                        }}><Camera size={14} /> Ảnh chụp</button>
                                    </div>

                                    {/* Preview */}
                                    <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
                                        <div style={{
                                            width: 72, height: 72, borderRadius: "50%",
                                            background: selectedAvatar?.startsWith("http") || selectedAvatar?.startsWith("data:")
                                                ? `url(${selectedAvatar}) center/cover`
                                                : "linear-gradient(135deg, #FFB5C240, #B5EAD740)",
                                            backgroundSize: "cover",
                                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "2.2rem", border: "3px solid var(--mint)",
                                            overflow: "hidden",
                                        }}>
                                            {!selectedAvatar?.startsWith("http") && !selectedAvatar?.startsWith("data:") && (selectedAvatar || "❓")}
                                        </div>
                                    </div>

                                    {avatarMode === "emoji" ? (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", justifyContent: "center" }}>
                                            {AVATARS.map(a => (
                                                <button key={a} type="button" style={{
                                                    fontSize: "1.4rem", padding: "0.35rem",
                                                    background: selectedAvatar === a ? "var(--mint-light)" : "white",
                                                    border: selectedAvatar === a ? "2.5px solid var(--mint-dark)" : "2px solid #eee",
                                                    borderRadius: "10px", cursor: "pointer",
                                                    transition: "all 0.15s",
                                                    transform: selectedAvatar === a ? "scale(1.15)" : "scale(1)",
                                                }}
                                                    onClick={() => setSelectedAvatar(a)}
                                                >{a}</button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div>
                                            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleAvatarFile} style={{ display: "none" }} />
                                            <input ref={galleryRef} type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: "none" }} />
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                                <button type="button" onClick={() => cameraRef.current?.click()} style={{
                                                    padding: "0.75rem", border: "2px dashed var(--sky)",
                                                    borderRadius: "var(--radius-sm)", background: "var(--sky-light)",
                                                    cursor: "pointer", display: "flex", flexDirection: "column",
                                                    alignItems: "center", gap: "0.3rem", fontFamily: "Nunito",
                                                    fontWeight: 700, fontSize: "0.8rem", color: "var(--sky-dark)",
                                                }}>
                                                    <Camera size={22} /> Chụp ảnh
                                                </button>
                                                <button type="button" onClick={() => galleryRef.current?.click()} style={{
                                                    padding: "0.75rem", border: "2px dashed var(--mint)",
                                                    borderRadius: "var(--radius-sm)", background: "var(--mint-light)",
                                                    cursor: "pointer", display: "flex", flexDirection: "column",
                                                    alignItems: "center", gap: "0.3rem", fontFamily: "Nunito",
                                                    fontWeight: 700, fontSize: "0.8rem", color: "var(--mint-dark)",
                                                }}>
                                                    <ImagePlus size={22} /> Thư viện
                                                </button>
                                            </div>
                                            {uploading && (
                                                <div style={{ textAlign: "center", padding: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                                    ⏳ Đang upload...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <input type="hidden" name="avatar_url" value={selectedAvatar?.startsWith("data:") ? "" : selectedAvatar} />
                                </div>

                                <div style={{ marginBottom: "1rem" }}>
                                    <label className="input-label">Ngày sinh</label>
                                    <input name="birth_date" type="date" className="input" defaultValue={editing?.birth_date || ""} />
                                </div>

                                {/* Account for child - only when creating */}
                                {!editing && (
                                    <div style={{
                                        background: "var(--pink-light)",
                                        padding: "1rem",
                                        borderRadius: "var(--radius-sm)",
                                        marginBottom: "1.5rem",
                                    }}>
                                        <h4 style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: "0.75rem", color: "var(--pink-dark)" }}>
                                            🔑 Tài khoản đăng nhập cho bé
                                        </h4>
                                        <div style={{ marginBottom: "0.75rem" }}>
                                            <label className="input-label">Tên đăng nhập</label>
                                            <input name="username" className="input" required placeholder="vd: beti2020" style={{ background: "white" }} />
                                        </div>
                                        <div>
                                            <label className="input-label">Mật khẩu</label>
                                            <input name="password" type="password" className="input" required minLength={6} placeholder="Tối thiểu 6 ký tự" style={{ background: "white" }} />
                                        </div>
                                        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                                            Bé sẽ dùng tên đăng nhập + mật khẩu này để login vào app.
                                        </p>
                                    </div>
                                )}

                                {message && <p style={{ color: "#c44", marginBottom: "1rem", fontWeight: 600 }}>{message}</p>}

                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                        <Save size={16} /> {loading ? "Đang lưu..." : "Lưu"}
                                    </button>
                                    <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn btn-outline">
                                        Hủy
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
