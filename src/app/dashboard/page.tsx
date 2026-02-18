import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChildren, getChildStarBalance } from "@/lib/actions";
import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { Star, Plus, ChevronRight, Award, TrendingUp } from "lucide-react";

const AVATARS = ["🧒", "👧", "👦", "👶", "🐻", "🐰", "🦊", "🐱"];
const AVATAR_COLORS = ["#FFB5C2", "#B5EAD7", "#A0D2DB", "#FFDAB9", "#C3B1E1", "#FFE66D"];

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Child accounts → go directly to their evaluate page
    const role = user.user_metadata?.role || "parent";
    if (role === "child") {
        const { data: child } = await supabase
            .from("children")
            .select("id")
            .eq("profile_id", user.id)
            .single();
        if (child) redirect(`/dashboard/${child.id}/evaluate`);
    }

    const children = await getChildren();

    // Get star balances for all children
    const childrenWithStars = await Promise.all(
        children.map(async (child) => ({
            ...child,
            stars: await getChildStarBalance(child.id),
        }))
    );

    return (
        <>
            <NavBar />
            <div className="page">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 className="page-title">Xin chào! 👋</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>Chọn bé để xem và đánh giá hôm nay</p>
                    </div>
                    <Link href="/admin/children" className="btn btn-mint">
                        <Plus size={18} /> Thêm bé
                    </Link>
                </div>

                {children.length === 0 ? (
                    <div className="card empty-state" style={{ marginTop: "2rem" }}>
                        <div className="empty-state-icon">👶</div>
                        <h3 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>Chưa có bé nào</h3>
                        <p style={{ marginBottom: "1rem" }}>Thêm bé để bắt đầu theo dõi hoạt động hàng ngày</p>
                        <Link href="/admin/children" className="btn btn-primary">
                            <Plus size={18} /> Thêm bé đầu tiên
                        </Link>
                    </div>
                ) : (
                    <div className="grid-cards" style={{ marginTop: "2rem" }}>
                        {childrenWithStars.map((child, idx) => (
                            <Link
                                key={child.id}
                                href={`/dashboard/${child.id}`}
                                style={{ textDecoration: "none", color: "inherit" }}
                            >
                                <div className="card" style={{ textAlign: "center", cursor: "pointer" }}>
                                    {/* Avatar */}
                                    <div
                                        className="avatar"
                                        style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] + "40" }}
                                    >
                                        {child.avatar_url || AVATARS[idx % AVATARS.length]}
                                    </div>

                                    {/* Name */}
                                    <h3 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                                        {child.name}
                                    </h3>

                                    {/* Star balance */}
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.4rem",
                                        background: "linear-gradient(135deg, #FFF0A3, #FFE66D)",
                                        padding: "0.5rem 1rem",
                                        borderRadius: "100px",
                                        marginBottom: "1rem",
                                    }}>
                                        <Star size={20} fill="#E8C94A" color="#E8C94A" />
                                        <span style={{ fontWeight: 900, fontSize: "1.3rem", color: "#8a7020" }}>
                                            {child.stars}
                                        </span>
                                        <span style={{ fontSize: "0.8rem", color: "#8a7020", fontWeight: 600 }}>sao</span>
                                    </div>

                                    {/* Actions hint */}
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.3rem",
                                        color: "var(--text-muted)",
                                        fontSize: "0.85rem",
                                    }}>
                                        <span>Xem chi tiết</span>
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
