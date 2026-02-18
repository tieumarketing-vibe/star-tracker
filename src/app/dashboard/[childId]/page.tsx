import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChild, getChildStarBalance, getEvaluationHistory, getStarTransactions, getRedemptions } from "@/lib/actions";
import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { StarCounter } from "@/components/star-rain";
import { ClipboardList, Award, TrendingUp, TrendingDown, Calendar, ArrowRight } from "lucide-react";

export default async function ChildDashboard({ params }: { params: Promise<{ childId: string }> }) {
    const { childId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const child = await getChild(childId);
    if (!child) redirect("/dashboard");

    const [stars, history, transactions, redemptions] = await Promise.all([
        getChildStarBalance(childId),
        getEvaluationHistory(childId, 7),
        getStarTransactions(childId, 10),
        getRedemptions(childId),
    ]);

    // Calculate this week's stats
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEvals = history.filter(e => new Date(e.eval_date) >= weekStart);
    const weekEarned = weekEvals.reduce((sum, e) => sum + e.total_stars_earned, 0);
    const weekLost = weekEvals.reduce((sum, e) => sum + e.total_stars_deducted, 0);
    const pendingRedemptions = redemptions.filter(r => r.status === "pending");

    return (
        <>
            <NavBar />
            <div className="page">
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div className="avatar animate-bounce-in" style={{
                        background: "linear-gradient(135deg, #FFD6DD, #FFDAB9)",
                        width: 100, height: 100, fontSize: "3rem",
                    }}>
                        {child.avatar_url || "🧒"}
                    </div>
                    <h1 className="page-title" style={{ marginTop: "0.5rem" }}>{child.name}</h1>

                    {/* Big star counter - click for star rain! */}
                    <StarCounter stars={stars} />
                </div>

                {/* Quick stats */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "1rem",
                    marginBottom: "2rem",
                }}>
                    <div className="card stat-card" style={{ background: "linear-gradient(135deg, #D4F5E9, #B5EAD7)" }}>
                        <div className="stat-icon"><TrendingUp size={28} color="#2a7a5a" /></div>
                        <div className="stat-value" style={{ color: "#2a7a5a" }}>+{weekEarned}</div>
                        <div className="stat-label">Sao kiếm tuần này</div>
                    </div>
                    <div className="card stat-card" style={{ background: "linear-gradient(135deg, #FFE0E0, #FFCACA)" }}>
                        <div className="stat-icon"><TrendingDown size={28} color="#c44" /></div>
                        <div className="stat-value" style={{ color: "#c44" }}>-{weekLost}</div>
                        <div className="stat-label">Sao bị phạt tuần này</div>
                    </div>
                    <div className="card stat-card" style={{ background: "linear-gradient(135deg, #C5E8EF, #A0D2DB)" }}>
                        <div className="stat-icon"><Calendar size={28} color="#2a6a7a" /></div>
                        <div className="stat-value" style={{ color: "#2a6a7a" }}>{weekEvals.length}</div>
                        <div className="stat-label">Ngày đánh giá tuần này</div>
                    </div>
                    <div className="card stat-card" style={{ background: "linear-gradient(135deg, #DCD0F0, #C3B1E1)" }}>
                        <div className="stat-icon"><Award size={28} color="#6a4a8a" /></div>
                        <div className="stat-value" style={{ color: "#6a4a8a" }}>{pendingRedemptions.length}</div>
                        <div className="stat-label">Đang chờ đổi thưởng</div>
                    </div>
                </div>

                {/* Quick actions */}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                    <Link href={`/dashboard/${childId}/evaluate`} className="btn btn-primary btn-lg" style={{ flex: 1, minWidth: 200 }}>
                        <ClipboardList size={20} /> Đánh giá hôm nay
                    </Link>
                    <Link href={`/dashboard/${childId}/rewards`} className="btn btn-sky btn-lg" style={{ flex: 1, minWidth: 200 }}>
                        <Award size={20} /> Đổi thưởng
                    </Link>
                </div>

                {/* Recent history */}
                <div className="card" style={{ marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h3 style={{ fontWeight: 800 }}>📋 Lịch sử gần đây</h3>
                        <Link href={`/dashboard/${childId}/history`} style={{ color: "var(--pink-dark)", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            Xem tất cả <ArrowRight size={14} />
                        </Link>
                    </div>

                    {history.length === 0 ? (
                        <div className="empty-state" style={{ padding: "1.5rem" }}>
                            <p>Chưa có đánh giá nào. Bắt đầu đánh giá hôm nay!</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {history.slice(0, 5).map((eval_item) => (
                                <div key={eval_item.id} style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.75rem",
                                    borderRadius: "var(--radius-sm)",
                                    background: "#FAFAFA",
                                }}>
                                    <div>
                                        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                                            {new Date(eval_item.eval_date).toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "numeric" })}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                        <span className="badge badge-earn">+{eval_item.total_stars_earned} ⭐</span>
                                        {eval_item.total_stars_deducted > 0 && (
                                            <span className="badge badge-penalty">-{eval_item.total_stars_deducted} ⭐</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent transactions */}
                <div className="card">
                    <h3 style={{ fontWeight: 800, marginBottom: "1rem" }}>💫 Biến động sao gần đây</h3>
                    {transactions.length === 0 ? (
                        <div className="empty-state" style={{ padding: "1.5rem" }}>
                            <p>Chưa có giao dịch sao nào</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {transactions.map((tx) => (
                                <div key={tx.id} style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.5rem 0.75rem",
                                    borderRadius: "var(--radius-sm)",
                                    background: tx.amount > 0 ? "#F0FFF4" : "#FFF5F5",
                                }}>
                                    <div>
                                        <span style={{ fontSize: "0.85rem" }}>{tx.description}</span>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                            {new Date(tx.created_at).toLocaleDateString("vi-VN")}
                                        </div>
                                    </div>
                                    <span style={{
                                        fontWeight: 800,
                                        color: tx.amount > 0 ? "#2a7a5a" : "#c44",
                                        fontSize: "0.95rem",
                                    }}>
                                        {tx.amount > 0 ? "+" : ""}{tx.amount} ⭐
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
