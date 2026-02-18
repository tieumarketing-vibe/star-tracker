"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { Users, ListChecks, AlertTriangle, Gift, ChevronRight, Check, Trash2, Clock } from "lucide-react";
import { getChildren, getAllRewards, approveRedemption, deleteRedemption } from "@/lib/actions";
import { createBrowserClient } from "@supabase/ssr";

export default function AdminPage() {
    const [children, setChildren] = useState<any[]>([]);
    const [rewards, setRewards] = useState<any[]>([]);
    const [pendingRedemptions, setPendingRedemptions] = useState<any[]>([]);
    const [allRedemptions, setAllRedemptions] = useState<any[]>([]);
    const [loading, setLoading] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const router = useRouter();

    function getSupabase() {
        return createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
    }

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        const [ch, rw] = await Promise.all([getChildren(), getAllRewards()]);
        setChildren(ch);
        setRewards(rw);

        const supabase = getSupabase();
        // Pending
        const { data: pending } = await supabase
            .from("reward_redemptions")
            .select("*, reward:rewards(*), child:children(name)")
            .eq("status", "pending")
            .order("redeemed_at", { ascending: false });
        setPendingRedemptions(pending || []);

        // All non-free history
        const { data: all } = await supabase
            .from("reward_redemptions")
            .select("*, reward:rewards(*), child:children(name)")
            .gt("stars_spent", 0)
            .neq("status", "pending")
            .order("redeemed_at", { ascending: false })
            .limit(30);
        setAllRedemptions(all || []);
    }

    async function handleApprove(id: string) {
        if (!confirm("Duyệt phần thưởng này?")) return;
        setLoading(id);
        await approveRedemption(id);
        setMessage("✅ Đã duyệt!");
        await loadData();
        setLoading(null);
        setTimeout(() => setMessage(""), 2000);
    }

    async function handleDelete(id: string, childId: string, stars: number) {
        if (!confirm("Xóa yêu cầu đổi thưởng? Sao sẽ được hoàn lại.")) return;
        setLoading(id);
        await deleteRedemption(id, childId, stars);
        setMessage("🗑️ Đã xóa và hoàn sao!");
        await loadData();
        setLoading(null);
        setTimeout(() => setMessage(""), 2000);
    }

    const adminLinks = [
        { href: "/admin/activities", icon: <ListChecks size={28} />, label: "Hoạt động & Sao", desc: "Quản lý hoạt động đánh giá", color: "#B5EAD7" },
        { href: "/admin/penalties", icon: <AlertTriangle size={28} />, label: "Hình phạt", desc: "Quản lý danh sách vi phạm", color: "#FFDAB9" },
        { href: "/admin/rewards", icon: <Gift size={28} />, label: "Vật phẩm", desc: `${rewards.length} vật phẩm`, color: "#A0D2DB" },
        { href: "/admin/children", icon: <Users size={28} />, label: "Quản lý bé", desc: "Thêm/sửa/xóa hồ sơ bé", color: "#FFB5C2" },
    ];

    return (
        <>
            <NavBar />
            <div className="page">
                <h1 className="page-title">⚙️ Quản trị</h1>
                <p className="page-subtitle">Quản lý hoạt động, hình phạt, vật phẩm và bé</p>

                {message && (
                    <div className="toast toast-success" style={{ position: "relative", right: "auto", bottom: "auto", marginBottom: "1rem" }}>
                        {message}
                    </div>
                )}

                {/* Children quick access */}
                {children.length > 0 && (
                    <div style={{ marginBottom: "2rem" }}>
                        <h3 style={{ fontWeight: 800, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            👶 Các bé
                        </h3>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                            {children.map((child: any) => (
                                <Link key={child.id} href={`/dashboard/${child.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                    <div className="card" style={{
                                        display: "flex", alignItems: "center", gap: "0.75rem",
                                        padding: "0.75rem 1.25rem", cursor: "pointer",
                                        minWidth: 160, transition: "transform 0.2s",
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                    >
                                        <div className="avatar" style={{
                                            width: 48, height: 48, fontSize: "1.6rem",
                                            background: "linear-gradient(135deg, #FFD6DD, #FFDAB9)",
                                        }}>
                                            {child.avatar_url || "🧒"}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: "1rem" }}>{child.name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                                                Bấm để xem
                                            </div>
                                        </div>
                                        <ChevronRight size={18} color="var(--text-muted)" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Admin cards */}
                <div className="grid-cards" style={{ marginBottom: "2rem" }}>
                    {adminLinks.map(link => (
                        <Link key={link.href} href={link.href} style={{ textDecoration: "none", color: "inherit" }}>
                            <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: "var(--radius-sm)",
                                    background: link.color + "40",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: link.color, flexShrink: 0,
                                }}>
                                    {link.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontWeight: 800, fontSize: "1rem" }}>{link.label}</h3>
                                    <p style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>{link.desc}</p>
                                </div>
                                <ChevronRight size={20} color="var(--text-muted)" />
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Pending redemptions */}
                {pendingRedemptions.length > 0 && (
                    <div className="card" style={{ marginBottom: "2rem" }}>
                        <h3 style={{ fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Clock size={20} color="#8a7020" />
                            Yêu cầu đổi thưởng ({pendingRedemptions.length} đang chờ)
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {pendingRedemptions.map((item: any) => (
                                <div key={item.id} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "0.75rem", background: "var(--yellow-light)",
                                    borderRadius: "var(--radius-sm)",
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700 }}>{item.child?.name} → {item.reward?.name}</div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                                            {item.stars_spent} ⭐ • {new Date(item.redeemed_at).toLocaleString("vi-VN", {
                                                day: "2-digit", month: "2-digit", year: "numeric",
                                                hour: "2-digit", minute: "2-digit",
                                            })}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                                        <button
                                            onClick={() => handleApprove(item.id)}
                                            disabled={loading === item.id}
                                            className="btn btn-sm btn-mint"
                                            title="Duyệt"
                                        >
                                            <Check size={16} /> Duyệt
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id, item.child_id, item.stars_spent)}
                                            disabled={loading === item.id}
                                            className="btn btn-sm"
                                            style={{ background: "#FFF0F0", color: "#c44", border: "none" }}
                                            title="Xóa"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Redemption history */}
                {allRedemptions.length > 0 && (
                    <div className="card">
                        <h3 style={{ fontWeight: 800, marginBottom: "1rem" }}>🎊 Lịch sử đổi thưởng</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {allRedemptions.map((item: any) => (
                                <div key={item.id} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "0.6rem 0.75rem",
                                    background: item.status === "approved" ? "#F0FFF4" : "#FFF0F0",
                                    borderRadius: "var(--radius-sm)",
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                                            {item.child?.name} → {item.reward?.name}
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
                                            {item.stars_spent} ⭐ • {new Date(item.redeemed_at).toLocaleString("vi-VN", {
                                                day: "2-digit", month: "2-digit", year: "numeric",
                                                hour: "2-digit", minute: "2-digit",
                                            })}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <span className={`badge badge-${item.status}`} style={{ fontSize: "0.75rem" }}>
                                            {item.status === "approved" ? "✅ Đã duyệt" : "❌ Từ chối"}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(item.id, item.child_id, item.status === "rejected" ? 0 : item.stars_spent)}
                                            disabled={loading === item.id}
                                            className="btn btn-sm"
                                            style={{ background: "transparent", color: "#c44", border: "none", padding: "0.25rem" }}
                                            title="Xóa vĩnh viễn"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
