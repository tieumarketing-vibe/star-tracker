"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRewards, getChildStarBalance, redeemReward, getRedemptions } from "@/lib/actions";
import { NavBar } from "@/components/nav-bar";
import { Star, Gift, ShoppingBag, Clock, CheckCircle, XCircle } from "lucide-react";
import type { Reward, RewardRedemption } from "@/types";

export default function RewardsPage({ params }: { params: Promise<{ childId: string }> }) {
    const [childId, setChildId] = useState("");
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [stars, setStars] = useState(0);
    const [filter, setFilter] = useState<string>("all");
    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [loading, setLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        params.then(async (p) => {
            setChildId(p.childId);
            const [rwds, bal, reds] = await Promise.all([
                getRewards(),
                getChildStarBalance(p.childId),
                getRedemptions(p.childId),
            ]);
            setRewards(rwds);
            setStars(bal);
            setRedemptions(reds);
        });
    }, [params]);

    // IDs of rewards already redeemed (non-free)
    const redeemedIds = new Set(redemptions.filter((r: any) => r.stars_spent > 0).map((r: any) => r.reward_id));

    const filtered = (filter === "all" ? rewards.filter(r => !r.is_free_daily) : rewards.filter(r => r.tier === filter && !r.is_free_daily))
        .filter(r => !redeemedIds.has(r.id));
    const freeDaily = rewards.filter(r => r.is_free_daily);

    async function handleRedeem(reward: Reward) {
        if (!reward.is_free_daily && stars < reward.star_cost) {
            setMessage({ type: "error", text: `Không đủ sao! Cần ${reward.star_cost} ⭐` });
            return;
        }

        const confirmMsg = reward.is_free_daily
            ? `Nhận "${reward.name}" miễn phí hôm nay? 🎁`
            : `Đổi "${reward.name}" với ${reward.star_cost} ⭐?`;
        if (!confirm(confirmMsg)) return;

        setLoading(reward.id);
        const result = await redeemReward(childId, reward.id);
        setLoading(null);

        if (result.success) {
            setMessage({ type: "success", text: reward.is_free_daily ? `Đã nhận "${reward.name}"! 🎉` : `Đã đổi "${reward.name}" thành công! 🎉` });
            if (!reward.is_free_daily) setStars(prev => prev - reward.star_cost);
            const reds = await getRedemptions(childId);
            setRedemptions(reds);
        } else {
            setMessage({ type: "error", text: result.error || "Có lỗi xảy ra" });
        }

        setTimeout(() => setMessage(null), 3000);
    }

    const tierLabels: Record<string, string> = {
        weekly: "Tuần",
        monthly: "Tháng",
        yearly: "Năm",
    };

    const statusIcons: Record<string, React.ReactNode> = {
        pending: <Clock size={16} color="#8a7a2a" />,
        approved: <CheckCircle size={16} color="#2a7a5a" />,
        rejected: <XCircle size={16} color="#c44" />,
    };

    return (
        <>
            <NavBar />
            <div className="page">
                {/* Star balance header */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <h1 className="page-title">🎁 Đổi Thưởng</h1>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: "linear-gradient(135deg, #FFF0A3, #FFE66D)",
                        padding: "0.5rem 1.5rem",
                        borderRadius: "100px",
                        marginTop: "0.5rem",
                    }}>
                        <Star size={22} fill="#E8C94A" color="#E8C94A" />
                        <span style={{ fontWeight: 900, fontSize: "1.5rem", color: "#8a7020" }}>{stars}</span>
                        <span style={{ color: "#8a7020", fontWeight: 600 }}>sao có thể đổi</span>
                    </div>
                </div>

                {/* Filter tabs */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                    {["all", "weekly", "monthly", "yearly"].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-outline"}`}
                        >
                            {f === "all" ? "Tất cả" : tierLabels[f]}
                        </button>
                    ))}
                </div>

                {/* Message */}
                {message && (
                    <div className={`toast toast-${message.type}`} style={{ position: "relative", marginBottom: "1rem", right: "auto", bottom: "auto" }}>
                        {message.text}
                    </div>
                )}

                {/* Free daily rewards */}
                {freeDaily.length > 0 && (
                    <div style={{ marginBottom: "2rem" }}>
                        <h2 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            🎁 Phần thưởng FREE hôm nay
                        </h2>
                        <div className="grid-cards">
                            {freeDaily.map(reward => (
                                <div key={reward.id} className="card" style={{
                                    borderLeft: "4px solid var(--mint)",
                                    position: "relative",
                                }}>
                                    <span style={{
                                        position: "absolute", top: "0.75rem", right: "0.75rem",
                                        background: "linear-gradient(135deg, #4ECDC4, #2a7a5a)",
                                        color: "white", padding: "0.15rem 0.6rem",
                                        borderRadius: "100px", fontSize: "0.7rem", fontWeight: 800,
                                    }}>FREE</span>

                                    <div style={{
                                        width: "100%", height: 120, borderRadius: "var(--radius-sm)",
                                        background: reward.image_url
                                            ? `url(${reward.image_url}) center/cover`
                                            : "linear-gradient(135deg, #D4F5E9, #B5EAD7)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        marginBottom: "0.75rem",
                                    }}>
                                        {!reward.image_url && <Gift size={40} color="#2a7a5a" />}
                                    </div>

                                    <h3 style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.3rem" }}>{reward.name}</h3>
                                    {reward.description && (
                                        <p style={{ fontSize: "0.85rem", color: "var(--text-light)", marginBottom: "0.75rem" }}>
                                            {reward.description}
                                        </p>
                                    )}

                                    <button
                                        onClick={() => handleRedeem(reward)}
                                        disabled={loading === reward.id}
                                        className="btn btn-mint"
                                        style={{ width: "100%" }}
                                    >
                                        {loading === reward.id ? "..." : "🎁 Nhận ngay!"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rewards grid */}
                <div className="grid-cards">
                    {filtered.map(reward => {
                        const canAfford = stars >= reward.star_cost;
                        const progress = Math.min(100, Math.round((stars / reward.star_cost) * 100));
                        const remaining = Math.max(0, reward.star_cost - stars);
                        return (
                            <div key={reward.id} className="card" style={{
                                opacity: canAfford ? 1 : 0.75,
                                position: "relative",
                            }}>
                                {/* Tier badge */}
                                <span className={`badge badge-${reward.tier}`} style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 2 }}>
                                    {tierLabels[reward.tier]}
                                </span>

                                {/* Image or placeholder */}
                                <div style={{
                                    width: "100%",
                                    height: 140,
                                    borderRadius: "var(--radius-sm)",
                                    background: reward.image_url
                                        ? `url(${reward.image_url}) center/cover`
                                        : "linear-gradient(135deg, #FFD6DD, #D4F5E9)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: "1rem",
                                    fontSize: "3rem",
                                }}>
                                    {!reward.image_url && <Gift size={48} color="#E8899A" />}
                                </div>

                                <h3 style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.3rem" }}>{reward.name}</h3>
                                {reward.description && (
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-light)", marginBottom: "0.75rem" }}>
                                        {reward.description}
                                    </p>
                                )}

                                {/* Progress bar */}
                                <div style={{ marginBottom: "0.75rem" }}>
                                    <div style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "baseline",
                                        marginBottom: "0.35rem",
                                    }}>
                                        <span style={{
                                            fontSize: "0.8rem", fontWeight: 800,
                                            color: canAfford ? "#2a7a5a" : "#8a7020",
                                        }}>
                                            {canAfford ? "✅ Đạt mục tiêu!" : `${progress}% mục tiêu`}
                                        </span>
                                        <span style={{
                                            fontSize: "0.7rem", fontWeight: 600,
                                            color: "var(--text-muted)",
                                        }}>
                                            {stars}/{reward.star_cost} ⭐
                                        </span>
                                    </div>
                                    <div style={{
                                        width: "100%", height: "8px",
                                        background: "#f0f0f0", borderRadius: "100px",
                                        overflow: "hidden",
                                    }}>
                                        <div style={{
                                            width: `${progress}%`,
                                            height: "100%",
                                            borderRadius: "100px",
                                            background: canAfford
                                                ? "linear-gradient(90deg, #4ECDC4, #2a7a5a)"
                                                : progress >= 70
                                                    ? "linear-gradient(90deg, #FFE66D, #E8C94A)"
                                                    : progress >= 40
                                                        ? "linear-gradient(90deg, #FFD6DD, #E8899A)"
                                                        : "linear-gradient(90deg, #E0E0E0, #BDBDBD)",
                                            transition: "width 0.6s ease",
                                        }} />
                                    </div>
                                    {!canAfford && (
                                        <div style={{
                                            fontSize: "0.7rem", color: "var(--text-muted)",
                                            marginTop: "0.25rem", fontWeight: 600,
                                        }}>
                                            Còn thiếu {remaining} ⭐
                                            {progress >= 70 && (
                                                <span style={{ color: "#E8C94A", fontWeight: 700 }}>
                                                    {" "}— 💪 Cố lên, bạn sắp đạt được mục tiêu rồi!
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Cost & action */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "0.3rem",
                                        fontWeight: 800, color: "#8a7020", fontSize: "1.1rem",
                                    }}>
                                        <Star size={18} fill="#FFE66D" color="#E8C94A" />
                                        {reward.star_cost}
                                    </div>
                                    <button
                                        onClick={() => handleRedeem(reward)}
                                        disabled={!canAfford || loading === reward.id}
                                        className={`btn btn-sm ${canAfford ? "btn-mint" : ""}`}
                                        style={{
                                            opacity: canAfford ? 1 : 0.5,
                                            cursor: canAfford ? "pointer" : "not-allowed",
                                        }}
                                    >
                                        {loading === reward.id ? "..." : (
                                            <><ShoppingBag size={14} /> {canAfford ? "Đổi" : "Không đủ sao"}</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Redemption history (exclude free daily) */}
                {redemptions.filter((r: any) => r.stars_spent > 0).length > 0 && (
                    <div style={{ marginTop: "3rem" }}>
                        <h2 style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: "1rem" }}>🎊 Lịch sử đổi thưởng</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {redemptions.filter((r: any) => r.stars_spent > 0).map((red: any) => (
                                <div key={red.id} className="card" style={{
                                    display: "flex", alignItems: "center", gap: "1rem",
                                    padding: "0.75rem 1rem",
                                }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: "var(--radius-sm)",
                                        background: red.reward?.image_url
                                            ? `url(${red.reward.image_url}) center/cover`
                                            : "linear-gradient(135deg, #FFD6DD, #D4F5E9)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        {!red.reward?.image_url && <Gift size={20} color="#E8899A" />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{red.reward?.name || "—"}</div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)", display: "flex", gap: "0.75rem", marginTop: "0.2rem" }}>
                                            <span>📅 {new Date(red.redeemed_at).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                                            <span style={{ fontWeight: 700, color: "#8a7020" }}>{red.stars_spent} ⭐</span>
                                        </div>
                                    </div>
                                    <span className={`badge badge-${red.status}`} style={{ flexShrink: 0 }}>
                                        {statusIcons[red.status]}
                                        {red.status === "pending" ? "Chờ" : red.status === "approved" ? "✓" : "✗"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
