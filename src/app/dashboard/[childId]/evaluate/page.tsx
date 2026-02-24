"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActivityTypes, getPenaltyTypes, submitEvaluation, getTodayEvaluation, getRewards, getWeeklyChallengeProgress, checkInWeeklyChallenge } from "@/lib/actions";
import { NavBar } from "@/components/nav-bar";
import { StarRain } from "@/components/star-rain";
import { Star, Send, AlertTriangle, CheckCircle } from "lucide-react";
import type { ActivityType, PenaltyType, EvaluationFormData, Reward } from "@/types";

function StarRating({ level, onChange, maxStars = 3 }: { level: number; onChange: (l: number) => void; maxStars?: number }) {
    return (
        <div style={{ display: "flex", gap: "0.5rem" }}>
            {Array.from({ length: maxStars }, (_, i) => (
                <button
                    key={i}
                    type="button"
                    onClick={() => onChange(i + 1)}
                    className={`star ${i < level ? "star-active animate-star-fill" : "star-inactive"}`}
                    style={{ background: "none", border: "none", fontSize: "2rem", padding: 0 }}
                >
                    <Star size={36} fill={i < level ? "#FFE66D" : "transparent"} color={i < level ? "#E8C94A" : "#E0E0E0"} />
                </button>
            ))}
        </div>
    );
}

export default function EvaluatePage({ params }: { params: Promise<{ childId: string }> }) {
    const [childId, setChildId] = useState("");
    const [activities, setActivities] = useState<ActivityType[]>([]);
    const [penalties, setPenalties] = useState<PenaltyType[]>([]);
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [selectedPenalties, setSelectedPenalties] = useState<string[]>([]);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success?: boolean; earned?: number; deducted?: number; error?: string } | null>(null);
    const [alreadyEvaluated, setAlreadyEvaluated] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [starRainTrigger, setStarRainTrigger] = useState(0);
    const [weeklyChallenges, setWeeklyChallenges] = useState<Reward[]>([]);
    const [weeklyProgress, setWeeklyProgress] = useState<any[]>([]);
    const [checkInLoading, setCheckInLoading] = useState<string | null>(null);
    const [checkInMsg, setCheckInMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        params.then(async (p) => {
            setChildId(p.childId);
            const [acts, pens, rewards, weekly] = await Promise.all([
                getActivityTypes(),
                getPenaltyTypes(),
                getRewards(),
                getWeeklyChallengeProgress(p.childId),
            ]);
            setActivities(acts);
            setPenalties(pens);
            setWeeklyChallenges(rewards.filter((r: Reward) => r.is_weekly_challenge));
            setWeeklyProgress(weekly);

            // Check if already evaluated today
            const today = await getTodayEvaluation(p.childId);
            if (today) {
                setAlreadyEvaluated(true);
                const existingRatings: Record<string, number> = {};
                today.evaluation_details?.forEach((d: any) => {
                    existingRatings[d.activity_type_id] = d.star_level;
                });
                setRatings(existingRatings);
                const existingPenalties = today.evaluation_penalties?.map((p: any) => p.penalty_type_id) || [];
                setSelectedPenalties(existingPenalties);
                setNotes(today.notes || "");
                setLastUpdated(today.updated_at || today.created_at || "");
            }
        });
    }, [params]);

    async function handleCheckIn(rewardId: string) {
        setCheckInLoading(rewardId);
        const result = await checkInWeeklyChallenge(childId, rewardId);
        if (result.error) {
            setCheckInMsg({ type: "error", text: result.error });
        } else if (result.bonusAwarded) {
            setCheckInMsg({ type: "success", text: `🏆 Tuyệt vời! Hoàn thành 7 ngày, nhận +${result.bonusStars} ⭐!` });
            setStarRainTrigger(prev => prev + 1);
        } else {
            setCheckInMsg({ type: "success", text: `✅ Check-in thành công!` });
        }
        const weekly = await getWeeklyChallengeProgress(childId);
        setWeeklyProgress(weekly);
        setCheckInLoading(null);
        setTimeout(() => setCheckInMsg(null), 3000);
    }

    function togglePenalty(id: string) {
        setSelectedPenalties(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    }

    async function handleSubmit() {
        if (activities.length > 0 && Object.keys(ratings).length === 0) {
            setResult({ error: "Hãy đánh giá ít nhất 1 hoạt động" });
            return;
        }

        setLoading(true);
        const formData: EvaluationFormData = {
            activities: Object.entries(ratings).map(([id, level]) => ({
                activity_type_id: id,
                star_level: level,
            })),
            penalties: selectedPenalties,
            notes,
        };

        const res = await submitEvaluation(childId, formData);
        setResult(res);
        setLoading(false);

        if (res.success) {
            setStarRainTrigger(prev => prev + 1);
            setTimeout(() => {
                router.push(`/dashboard/${childId}`);
                router.refresh();
            }, 3000);
        }
    }

    // Calculate preview stars
    const previewEarned = Object.entries(ratings).reduce((sum, [id, level]) => {
        const act = activities.find(a => a.id === id);
        if (!act) return sum;
        const key = `star_level_${level}` as "star_level_1" | "star_level_2" | "star_level_3";
        return sum + (act[key] || level);
    }, 0);

    const previewDeducted = selectedPenalties.reduce((sum, pid) => {
        const pen = penalties.find(p => p.id === pid);
        return pen?.type === "bonus" ? sum : sum + (pen?.star_deduction || 0);
    }, 0);

    const previewBonus = selectedPenalties.reduce((sum, pid) => {
        const pen = penalties.find(p => p.id === pid);
        return pen?.type === "bonus" ? sum + (pen?.star_deduction || 0) : sum;
    }, 0);

    return (
        <>
            <NavBar />
            <div className="page" style={{ maxWidth: 700 }}>
                <h1 className="page-title">
                    {alreadyEvaluated ? "✏️ Cập nhật đánh giá hôm nay" : "📋 Đánh giá hôm nay"}
                </h1>
                <p className="page-subtitle">
                    {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>

                <StarRain trigger={starRainTrigger} count={40} withSound={true} />

                {alreadyEvaluated && (
                    <div style={{
                        background: "var(--yellow-light)",
                        color: "#8a7020",
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--radius-sm)",
                        marginBottom: "1.5rem",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                    }}>
                        ⚠️ Đã có đánh giá hôm nay. Cập nhật sẽ ghi đè đánh giá cũ.
                        {lastUpdated && (
                            <div style={{ marginTop: "0.3rem", fontSize: "0.8rem", fontWeight: 700, color: "#6b5a10" }}>
                                🕐 Lần cập nhật gần nhất: {new Date(lastUpdated).toLocaleString("vi-VN", {
                                    day: "2-digit", month: "2-digit", year: "numeric",
                                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Weekly Challenges */}
                {weeklyChallenges.length > 0 && (
                    <div style={{ marginBottom: "2rem" }}>
                        <h2 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            🔥 Thử thách tuần
                        </h2>

                        {checkInMsg && (
                            <div className={`toast toast-${checkInMsg.type}`} style={{ position: "relative", marginBottom: "0.75rem", right: "auto", bottom: "auto" }}>
                                {checkInMsg.text}
                            </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {weeklyChallenges.map(challenge => {
                                const progress = weeklyProgress.find((p: any) => p.reward_id === challenge.id);
                                const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
                                const now = new Date();
                                const todayIndex = now.getDay() === 0 ? 7 : now.getDay();
                                const todayChecked = progress ? progress[`day_${todayIndex}`] : false;
                                const daysCompleted = progress ? [1, 2, 3, 4, 5, 6, 7].filter(d => progress[`day_${d}`]).length : 0;
                                const allDone = daysCompleted === 7;

                                return (
                                    <div key={challenge.id} className="card" style={{
                                        borderLeft: allDone ? "4px solid #4ECDC4" : "4px solid #FF9800",
                                        background: allDone ? "linear-gradient(135deg, #F0FFF4, #E8F5E9)" : "white",
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                                            <div>
                                                <h3 style={{ fontWeight: 800, fontSize: "1rem" }}>{challenge.name}</h3>
                                                {challenge.description && (
                                                    <p style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: "0.2rem" }}>
                                                        {challenge.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div style={{
                                                background: allDone ? "linear-gradient(135deg, #4ECDC4, #2a7a5a)" : "linear-gradient(135deg, #FF9800, #EE5A24)",
                                                color: "white", padding: "0.2rem 0.6rem",
                                                borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800,
                                                whiteSpace: "nowrap",
                                            }}>
                                                {allDone ? "🏆 Hoàn thành!" : `+${challenge.weekly_bonus_stars}⭐`}
                                            </div>
                                        </div>

                                        {/* 7-day progress circles */}
                                        <div style={{ display: "flex", gap: "0.35rem", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                                            {[1, 2, 3, 4, 5, 6, 7].map(dayNum => {
                                                const isDone = progress ? progress[`day_${dayNum}`] : false;
                                                const isToday = dayNum === todayIndex;
                                                return (
                                                    <div key={dayNum} style={{
                                                        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", flex: 1,
                                                    }}>
                                                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: isToday ? "#FF9800" : "var(--text-muted)" }}>
                                                            {dayLabels[dayNum - 1]}
                                                        </span>
                                                        <div style={{
                                                            width: 32, height: 32, borderRadius: "50%",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            fontSize: "0.85rem", fontWeight: 800,
                                                            background: isDone
                                                                ? "linear-gradient(135deg, #4ECDC4, #2a7a5a)"
                                                                : isToday
                                                                    ? "linear-gradient(135deg, #FFF3E0, #FFE0B2)"
                                                                    : "#f0f0f0",
                                                            color: isDone ? "white" : isToday ? "#E65100" : "#ccc",
                                                            border: isToday && !isDone ? "2px solid #FF9800" : "none",
                                                            transition: "all 0.3s",
                                                        }}>
                                                            {isDone ? "✓" : dayNum}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Progress bar */}
                                        <div style={{
                                            width: "100%", height: "6px", background: "#f0f0f0",
                                            borderRadius: "100px", overflow: "hidden", marginBottom: "0.75rem",
                                        }}>
                                            <div style={{
                                                width: `${(daysCompleted / 7) * 100}%`,
                                                height: "100%", borderRadius: "100px",
                                                background: allDone
                                                    ? "linear-gradient(90deg, #4ECDC4, #2a7a5a)"
                                                    : "linear-gradient(90deg, #FF9800, #EE5A24)",
                                                transition: "width 0.6s ease",
                                            }} />
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-light)" }}>
                                                {daysCompleted}/7 ngày
                                            </span>
                                            {allDone ? (
                                                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#2a7a5a" }}>
                                                    🎉 Đã nhận +{challenge.weekly_bonus_stars}⭐!
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleCheckIn(challenge.id)}
                                                    disabled={todayChecked || checkInLoading === challenge.id}
                                                    className={`btn btn-sm ${todayChecked ? '' : 'btn-primary'}`}
                                                    style={{
                                                        opacity: todayChecked ? 0.6 : 1,
                                                        background: todayChecked ? "#E8F5E9" : undefined,
                                                        color: todayChecked ? "#2a7a5a" : undefined,
                                                    }}
                                                >
                                                    {checkInLoading === challenge.id
                                                        ? "..."
                                                        : todayChecked
                                                            ? "✅ Đã check-in"
                                                            : "🔥 Check-in hôm nay"
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Activity ratings */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                    {activities.map(act => (
                        <div key={act.id} className="card" style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ fontSize: "2rem" }}>{act.icon}</span>
                                <div>
                                    <h3 style={{ fontWeight: 800, fontSize: "1.1rem" }}>{act.name}</h3>
                                    <p style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>{act.description}</p>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <StarRating
                                    level={ratings[act.id] || 0}
                                    onChange={(l) => setRatings(prev => ({ ...prev, [act.id]: l }))}
                                />
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                    {ratings[act.id] ? (
                                        <span style={{ color: "var(--mint-dark)", fontWeight: 700 }}>
                                            +{act[`star_level_${ratings[act.id]}` as "star_level_1" | "star_level_2" | "star_level_3"]} ⭐
                                        </span>
                                    ) : "Chưa đánh giá"}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bonus items */}
                {penalties.filter(p => p.type === "bonus").length > 0 && (
                    <div className="card" style={{ marginBottom: "1rem", borderLeft: "4px solid var(--mint)" }}>
                        <h3 style={{ fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--mint-dark)" }}>
                            🌟 Thưởng thêm (nếu có)
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {penalties.filter(p => p.type === "bonus").map(bon => (
                                <label key={bon.id} className="checkbox-cute" style={{
                                    background: selectedPenalties.includes(bon.id) ? "var(--mint-light)" : "transparent",
                                    borderRadius: "var(--radius-sm)",
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedPenalties.includes(bon.id)}
                                        onChange={() => togglePenalty(bon.id)}
                                    />
                                    <span style={{ fontSize: "1.2rem" }}>{bon.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{bon.name}</div>
                                        {bon.description && (
                                            <div style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>{bon.description}</div>
                                        )}
                                    </div>
                                    <span style={{ color: "var(--mint-dark)", fontWeight: 800, fontSize: "0.85rem" }}>+{bon.star_deduction} ⭐</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Penalties */}
                <div className="card" style={{ marginBottom: "1.5rem", borderLeft: "4px solid #FF8A8A" }}>
                    <h3 style={{ fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <AlertTriangle size={20} color="#c44" /> Vi phạm (nếu có)
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {penalties.filter(p => p.type !== "bonus").map(pen => (
                            <label key={pen.id} className="checkbox-cute" style={{
                                background: selectedPenalties.includes(pen.id) ? "#FFE0E0" : "transparent",
                                borderRadius: "var(--radius-sm)",
                            }}>
                                <input
                                    type="checkbox"
                                    checked={selectedPenalties.includes(pen.id)}
                                    onChange={() => togglePenalty(pen.id)}
                                />
                                <span style={{ fontSize: "1.2rem" }}>{pen.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{pen.name}</div>
                                    {pen.description && (
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>{pen.description}</div>
                                    )}
                                </div>
                                <span style={{ color: "#c44", fontWeight: 800, fontSize: "0.85rem" }}>-{pen.star_deduction} ⭐</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <label className="input-label">Ghi chú thêm</label>
                    <textarea
                        className="input"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ghi chú thêm về hoạt động hôm nay..."
                        rows={3}
                        style={{ resize: "vertical" }}
                    />
                </div>

                {/* Summary preview */}
                <div className="card" style={{
                    background: "linear-gradient(135deg, #FFF8F0, #FFF0A3)",
                    marginBottom: "1.5rem",
                }}>
                    <h3 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>📊 Tổng kết</h3>
                    <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                            <span style={{ color: "#2a7a5a", fontWeight: 800, fontSize: "1.3rem" }}>+{previewEarned}</span>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-light)", marginLeft: "0.3rem" }}>sao hoạt động</span>
                        </div>
                        {previewBonus > 0 && (
                            <div>
                                <span style={{ color: "var(--mint-dark)", fontWeight: 800, fontSize: "1.3rem" }}>+{previewBonus}</span>
                                <span style={{ fontSize: "0.85rem", color: "var(--text-light)", marginLeft: "0.3rem" }}>sao thưởng</span>
                            </div>
                        )}
                        {previewDeducted > 0 && (
                            <div>
                                <span style={{ color: "#c44", fontWeight: 800, fontSize: "1.3rem" }}>-{previewDeducted}</span>
                                <span style={{ fontSize: "0.85rem", color: "var(--text-light)", marginLeft: "0.3rem" }}>sao bị phạt</span>
                            </div>
                        )}
                        <div>
                            <span style={{ color: "#8a7020", fontWeight: 800, fontSize: "1.3rem" }}>= {previewEarned + previewBonus - previewDeducted}</span>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-light)", marginLeft: "0.3rem" }}>sao ròng</span>
                        </div>
                    </div>
                </div>

                {/* Result message */}
                {result && (
                    <div style={{
                        background: result.success ? "var(--mint-light)" : "#FFE0E0",
                        color: result.success ? "#2a7a5a" : "#c44",
                        padding: "1rem",
                        borderRadius: "var(--radius-sm)",
                        marginBottom: "1rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}>
                        {result.success ? (
                            <>
                                <CheckCircle size={20} />
                                Đánh giá thành công! +{result.earned} ⭐
                                {result.deducted ? ` / -${result.deducted} ⭐` : ""}
                                {" "}— Đang chuyển hướng...
                            </>
                        ) : result.error}
                    </div>
                )}

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    className="btn btn-primary btn-lg"
                    style={{ width: "100%" }}
                    disabled={loading}
                >
                    {loading ? "Đang lưu..." : (
                        <><Send size={20} /> {alreadyEvaluated ? "Cập nhật đánh giá" : "Lưu đánh giá"}</>
                    )}
                </button>
            </div>
        </>
    );
}
