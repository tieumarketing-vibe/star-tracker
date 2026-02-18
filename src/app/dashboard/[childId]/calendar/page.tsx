"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getMonthEvaluations } from "@/lib/actions";
import { NavBar } from "@/components/nav-bar";
import { ChevronLeft, ChevronRight, Star, BookOpen, UtensilsCrossed, Gamepad2, Moon } from "lucide-react";
import Link from "next/link";

const DAYS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS_VI = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
    "Học tập": <BookOpen size={14} />,
    "Ăn uống": <UtensilsCrossed size={14} />,
    "Giải trí": <Gamepad2 size={14} />,
    "Ngủ nghỉ": <Moon size={14} />,
};

const ACTIVITY_COLORS: Record<string, string> = {
    "Học tập": "#4ECDC4",
    "Ăn uống": "#FF6B6B",
    "Giải trí": "#45B7D1",
    "Ngủ nghỉ": "#96CEB4",
};

interface EvalDay {
    eval_date: string;
    total_stars_earned: number;
    total_stars_deducted: number;
    notes: string;
    evaluation_details: {
        star_level: number;
        stars_earned: number;
        activity_type: { name: string; icon: string };
    }[];
    evaluation_penalties: {
        stars_deducted: number;
        penalty_type: { name: string; icon: string };
    }[];
}

export default function CalendarPage({ params }: { params: Promise<{ childId: string }> }) {
    const [childId, setChildId] = useState("");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [evaluations, setEvaluations] = useState<EvalDay[]>([]);
    const [selectedDay, setSelectedDay] = useState<EvalDay | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        params.then(p => setChildId(p.childId));
    }, [params]);

    const loadMonth = useCallback(async () => {
        if (!childId) return;
        setLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const data = await getMonthEvaluations(childId, year, month);
        setEvaluations(data);
        setLoading(false);
    }, [childId, currentDate]);

    useEffect(() => { loadMonth(); }, [loadMonth]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const evalMap = new Map<string, EvalDay>();
    evaluations.forEach(e => {
        const d = e.eval_date.split("T")[0];
        evalMap.set(d, e);
    });

    // Build cumulative star map (running total per day)
    const cumulativeMap = new Map<string, number>();
    let runningTotal = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const evalData = evalMap.get(key);
        if (evalData) {
            runningTotal += evalData.total_stars_earned - evalData.total_stars_deducted;
        }
        cumulativeMap.set(key, runningTotal);
    }

    function prevMonth() {
        setCurrentDate(new Date(year, month - 1, 1));
        setSelectedDay(null);
    }

    function nextMonth() {
        setCurrentDate(new Date(year, month + 1, 1));
        setSelectedDay(null);
    }

    function goToday() {
        setCurrentDate(new Date());
        setSelectedDay(null);
    }

    function getDateKey(day: number) {
        return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    function isToday(day: number) {
        return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    }

    // Monthly summary
    const monthEarned = evaluations.reduce((s, e) => s + e.total_stars_earned, 0);
    const monthDeducted = evaluations.reduce((s, e) => s + e.total_stars_deducted, 0);
    const daysEvaluated = evaluations.length;

    return (
        <>
            <NavBar />
            <div className="page">
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <h1 className="page-title">📅 Lịch đánh giá</h1>
                    {childId && (
                        <Link href={`/dashboard/${childId}/evaluate`} className="btn btn-primary btn-sm">
                            ⭐ Đánh giá hôm nay
                        </Link>
                    )}
                </div>

                {/* Monthly summary stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <div className="card" style={{ textAlign: "center", padding: "1rem" }}>
                        <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--mint-dark)" }}>{monthEarned}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)", fontWeight: 600 }}>⭐ Tổng nhận</div>
                    </div>
                    <div className="card" style={{ textAlign: "center", padding: "1rem" }}>
                        <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#c44" }}>{monthDeducted}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)", fontWeight: 600 }}>💔 Bị trừ</div>
                    </div>
                    <div className="card" style={{ textAlign: "center", padding: "1rem" }}>
                        <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--sky-dark)" }}>{daysEvaluated}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)", fontWeight: 600 }}>📝 Ngày đánh giá</div>
                    </div>
                </div>

                {/* Calendar */}
                <div className="card" style={{ padding: "1.5rem" }}>
                    {/* Month navigator */}
                    <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        marginBottom: "1.5rem",
                    }}>
                        <button onClick={prevMonth} className="btn btn-sm btn-outline" style={{ padding: "0.4rem 0.6rem" }}>
                            <ChevronLeft size={20} />
                        </button>
                        <div style={{ textAlign: "center" }}>
                            <h2 style={{ fontWeight: 900, fontSize: "1.3rem" }}>{MONTHS_VI[month]} {year}</h2>
                            <button onClick={goToday} style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "var(--pink-dark)", fontWeight: 700, fontSize: "0.8rem",
                            }}>
                                Về hôm nay
                            </button>
                        </div>
                        <button onClick={nextMonth} className="btn btn-sm btn-outline" style={{ padding: "0.4rem 0.6rem" }}>
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div style={{
                        display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px",
                        marginBottom: "0.5rem",
                    }}>
                        {DAYS_VI.map(d => (
                            <div key={d} style={{
                                textAlign: "center", fontWeight: 800, fontSize: "0.8rem",
                                color: d === "CN" ? "#c44" : "var(--text-light)",
                                padding: "0.4rem",
                            }}>{d}</div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div style={{
                        display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px",
                    }}>
                        {/* Empty cells before first day */}
                        {Array.from({ length: firstDay }, (_, i) => (
                            <div key={`empty-${i}`} style={{ aspectRatio: "1", padding: "0.25rem" }} />
                        ))}

                        {/* Day cells */}
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const key = getDateKey(day);
                            const evalData = evalMap.get(key);
                            const isTodayCell = isToday(day);
                            const isSelected = selectedDay?.eval_date.startsWith(key);
                            const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                            const cumStars = cumulativeMap.get(key) ?? 0;
                            const dailyNet = evalData ? evalData.total_stars_earned - evalData.total_stars_deducted : 0;

                            return (
                                <div
                                    key={day}
                                    onClick={() => evalData ? setSelectedDay(evalData) : null}
                                    style={{
                                        aspectRatio: "1",
                                        borderRadius: "var(--radius-sm)",
                                        padding: "3px",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        cursor: evalData ? "pointer" : "default",
                                        transition: "all 0.2s",
                                        position: "relative",
                                        overflow: "hidden",
                                        background: isSelected
                                            ? "var(--pink-light)"
                                            : isTodayCell
                                                ? "linear-gradient(145deg, #FFF8DC, #FFF0A3)"
                                                : evalData
                                                    ? "linear-gradient(145deg, #f0faf5, #d4f5e9)"
                                                    : isPast
                                                        ? "#f9f9f9"
                                                        : "transparent",
                                        border: isTodayCell
                                            ? "2px solid var(--yellow-dark)"
                                            : isSelected
                                                ? "2px solid var(--pink-dark)"
                                                : evalData
                                                    ? "1.5px solid var(--mint)"
                                                    : "1px solid #eee",
                                    }}
                                >
                                    {/* Day number - small at top */}
                                    <span style={{
                                        fontWeight: 700,
                                        fontSize: "0.65rem",
                                        color: isTodayCell ? "var(--yellow-dark)" : evalData ? "var(--mint-dark)" : isPast ? "var(--text-muted)" : "var(--text-light)",
                                        lineHeight: 1,
                                    }}>
                                        {day}
                                    </span>

                                    {/* BIG cumulative star - center */}
                                    {evalData ? (
                                        <div style={{
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            gap: "1px",
                                            flex: 1,
                                        }}>
                                            <Star size={13} fill="#FFE66D" color="#E8C94A" style={{ flexShrink: 0 }} />
                                            <span style={{
                                                fontSize: "1.1rem",
                                                fontWeight: 900,
                                                color: cumStars >= 0 ? "#1a6a4a" : "#c44",
                                                lineHeight: 1,
                                                letterSpacing: "-0.5px",
                                            }}>
                                                {cumStars}
                                            </span>
                                        </div>
                                    ) : (
                                        <div style={{ flex: 1 }} />
                                    )}

                                    {/* Bottom: +daily net & dots */}
                                    {evalData ? (
                                        <div style={{
                                            display: "flex", flexDirection: "column", alignItems: "center",
                                            gap: "1px", lineHeight: 1,
                                        }}>
                                            <span style={{
                                                fontSize: "0.55rem", fontWeight: 800,
                                                color: dailyNet >= 0 ? "var(--mint-dark)" : "#c44",
                                            }}>
                                                {dailyNet >= 0 ? "+" : ""}{dailyNet}
                                            </span>
                                            {evalData.evaluation_details && (
                                                <div style={{
                                                    display: "flex", gap: "1.5px", justifyContent: "center",
                                                }}>
                                                    {evalData.evaluation_details.slice(0, 4).map((d, idx) => (
                                                        <div key={idx} style={{
                                                            width: 5, height: 5, borderRadius: "50%",
                                                            background: d.star_level === 3 ? "#FFE66D"
                                                                : d.star_level === 2 ? "#B5EAD7"
                                                                    : "#E0E0E0",
                                                        }} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ height: "10px" }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div style={{
                        display: "flex", gap: "1rem", justifyContent: "center",
                        marginTop: "1rem", flexWrap: "wrap",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem" }}>
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: "var(--yellow-light)", border: "2px solid var(--yellow-dark)" }} />
                            <span>Hôm nay</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem" }}>
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: "var(--mint-light)" }} />
                            <span>Đã đánh giá</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem" }}>
                            <div style={{ display: "flex", gap: 2 }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFE66D" }} />
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#B5EAD7" }} />
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E0E0E0" }} />
                            </div>
                            <span>3⭐ / 2⭐ / 1⭐</span>
                        </div>
                    </div>
                </div>

                {/* Selected day detail */}
                {selectedDay && (
                    <div className="card animate-slide-up" style={{ marginTop: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ fontWeight: 900, fontSize: "1.1rem" }}>
                                📋 {new Date(selectedDay.eval_date).toLocaleDateString("vi-VN", {
                                    weekday: "long", day: "numeric", month: "long", year: "numeric"
                                })}
                            </h3>
                            <button onClick={() => setSelectedDay(null)} style={{
                                background: "none", border: "none", cursor: "pointer",
                                fontSize: "1.2rem", color: "var(--text-muted)",
                            }}>✕</button>
                        </div>

                        {/* Star summary */}
                        <div style={{
                            display: "flex", gap: "1rem", marginBottom: "1.2rem",
                            padding: "0.75rem", background: "var(--bg)", borderRadius: "var(--radius-sm)",
                        }}>
                            <div style={{ flex: 1, textAlign: "center" }}>
                                <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "var(--mint-dark)" }}>
                                    +{selectedDay.total_stars_earned}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>Sao nhận</div>
                            </div>
                            <div style={{ width: 1, background: "#eee" }} />
                            <div style={{ flex: 1, textAlign: "center" }}>
                                <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "#c44" }}>
                                    -{selectedDay.total_stars_deducted}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>Bị trừ</div>
                            </div>
                            <div style={{ width: 1, background: "#eee" }} />
                            <div style={{ flex: 1, textAlign: "center" }}>
                                <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "var(--sky-dark)" }}>
                                    {selectedDay.total_stars_earned - selectedDay.total_stars_deducted}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>Tổng cộng</div>
                            </div>
                        </div>

                        {/* Activity details */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {selectedDay.evaluation_details?.map((detail, idx) => {
                                const actName = detail.activity_type?.name || "";
                                const color = ACTIVITY_COLORS[actName] || "var(--sky)";
                                return (
                                    <div key={idx} style={{
                                        display: "flex", alignItems: "center", gap: "0.75rem",
                                        padding: "0.6rem 0.75rem",
                                        background: `${color}15`,
                                        borderRadius: "var(--radius-sm)",
                                        borderLeft: `3px solid ${color}`,
                                    }}>
                                        <span style={{ fontSize: "1.3rem" }}>{detail.activity_type?.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{actName}</div>
                                        </div>
                                        <div style={{ display: "flex", gap: "2px" }}>
                                            {[1, 2, 3].map(s => (
                                                <Star
                                                    key={s}
                                                    size={16}
                                                    fill={s <= detail.star_level ? "#FFE66D" : "transparent"}
                                                    color={s <= detail.star_level ? "#E8C94A" : "#E0E0E0"}
                                                />
                                            ))}
                                        </div>
                                        <span style={{
                                            fontWeight: 800, fontSize: "0.85rem",
                                            color: "var(--mint-dark)",
                                        }}>+{detail.stars_earned}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Penalties */}
                        {selectedDay.evaluation_penalties && selectedDay.evaluation_penalties.length > 0 && (
                            <div style={{ marginTop: "0.75rem" }}>
                                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#c44", marginBottom: "0.5rem" }}>
                                    ⚠️ Hình phạt
                                </div>
                                {selectedDay.evaluation_penalties.map((pen, idx) => (
                                    <div key={idx} style={{
                                        display: "flex", alignItems: "center", gap: "0.5rem",
                                        padding: "0.4rem 0.6rem",
                                        background: "#FFE0E0",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "0.85rem",
                                        marginBottom: "0.3rem",
                                    }}>
                                        <span>{pen.penalty_type?.icon}</span>
                                        <span style={{ flex: 1, fontWeight: 600 }}>{pen.penalty_type?.name}</span>
                                        <span style={{ fontWeight: 800, color: "#c44" }}>-{pen.stars_deducted}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Notes */}
                        {selectedDay.notes && (
                            <div style={{
                                marginTop: "0.75rem", padding: "0.6rem",
                                background: "var(--yellow-light)", borderRadius: "var(--radius-sm)",
                                fontSize: "0.85rem",
                            }}>
                                📝 {selectedDay.notes}
                            </div>
                        )}
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                        Đang tải dữ liệu...
                    </div>
                )}
            </div>
        </>
    );
}
