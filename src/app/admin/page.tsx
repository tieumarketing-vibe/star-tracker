import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChildren, getChildStarBalance, getAllRewards } from "@/lib/actions";
import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { Users, ListChecks, AlertTriangle, Gift, ChevronRight } from "lucide-react";

export default async function AdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const children = await getChildren();
    const rewards = await getAllRewards();

    // Get pending redemptions
    const { data: pendingRedemptions } = await supabase
        .from("reward_redemptions")
        .select("*, reward:rewards(*), child:children(name)")
        .eq("status", "pending")
        .order("redeemed_at", { ascending: false });

    const adminLinks = [
        { href: "/admin/children", icon: <Users size={28} />, label: "Quản lý bé", desc: `${children.length} bé`, color: "#FFB5C2" },
        { href: "/admin/activities", icon: <ListChecks size={28} />, label: "Hoạt động & Sao", desc: "Quản lý hoạt động đánh giá", color: "#B5EAD7" },
        { href: "/admin/penalties", icon: <AlertTriangle size={28} />, label: "Hình phạt", desc: "Quản lý danh sách vi phạm", color: "#FFDAB9" },
        { href: "/admin/rewards", icon: <Gift size={28} />, label: "Vật phẩm", desc: `${rewards.length} vật phẩm`, color: "#A0D2DB" },
    ];

    return (
        <>
            <NavBar />
            <div className="page">
                <h1 className="page-title">⚙️ Quản trị</h1>
                <p className="page-subtitle">Quản lý hoạt động, hình phạt, vật phẩm và bé</p>

                {/* Admin cards */}
                <div className="grid-cards" style={{ marginBottom: "2rem" }}>
                    {adminLinks.map(link => (
                        <Link key={link.href} href={link.href} style={{ textDecoration: "none", color: "inherit" }}>
                            <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: "var(--radius-sm)",
                                    background: link.color + "40",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: link.color,
                                    flexShrink: 0,
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
                {pendingRedemptions && pendingRedemptions.length > 0 && (
                    <div className="card">
                        <h3 style={{ fontWeight: 800, marginBottom: "1rem" }}>
                            🎁 Yêu cầu đổi thưởng ({pendingRedemptions.length} đang chờ)
                        </h3>
                        <PendingRedemptions items={pendingRedemptions} />
                    </div>
                )}
            </div>
        </>
    );
}

function PendingRedemptions({ items }: { items: any[] }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {items.map((item: any) => (
                <div key={item.id} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem",
                    background: "var(--yellow-light)",
                    borderRadius: "var(--radius-sm)",
                }}>
                    <div>
                        <div style={{ fontWeight: 700 }}>{item.child?.name} → {item.reward?.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                            {item.stars_spent} ⭐ • {new Date(item.redeemed_at).toLocaleDateString("vi-VN")}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <form action={`/api/approve-redemption?id=${item.id}`} method="POST">
                            <span className="badge badge-pending">Chờ duyệt</span>
                        </form>
                    </div>
                </div>
            ))}
        </div>
    );
}
