import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChild, getEvaluationHistory } from "@/lib/actions";
import { NavBar } from "@/components/nav-bar";
import { Star, Calendar } from "lucide-react";

export default async function HistoryPage({ params }: { params: Promise<{ childId: string }> }) {
    const { childId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const child = await getChild(childId);
    if (!child) redirect("/dashboard");

    const history = await getEvaluationHistory(childId, 60);

    return (
        <>
            <NavBar />
            <div className="page" style={{ maxWidth: 800 }}>
                <h1 className="page-title">📅 Lịch sử đánh giá - {child.name}</h1>
                <p className="page-subtitle">{history.length} ngày đánh giá</p>

                {history.length === 0 ? (
                    <div className="card empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3 style={{ fontWeight: 800 }}>Chưa có lịch sử</h3>
                        <p>Hãy đánh giá hoạt động hàng ngày để xem lịch sử ở đây</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {history.map((eval_item) => (
                            <div key={eval_item.id} className="card animate-slide-up">
                                {/* Date header */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "1rem",
                                    paddingBottom: "0.75rem",
                                    borderBottom: "1px solid #F0F0F0",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <Calendar size={18} color="var(--sky-dark)" />
                                        <span style={{ fontWeight: 800, fontSize: "1rem" }}>
                                            {new Date(eval_item.eval_date).toLocaleDateString("vi-VN", {
                                                weekday: "long", day: "numeric", month: "long", year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <span className="badge badge-earn">+{eval_item.total_stars_earned} ⭐</span>
                                        {eval_item.total_stars_deducted > 0 && (
                                            <span className="badge badge-penalty">-{eval_item.total_stars_deducted} ⭐</span>
                                        )}
                                    </div>
                                </div>

                                {/* Activity details */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                                    {eval_item.evaluation_details?.map((detail: any) => (
                                        <div key={detail.id} style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            padding: "0.5rem",
                                            borderRadius: "var(--radius-sm)",
                                            background: "#FAFAFA",
                                        }}>
                                            <span style={{ fontSize: "1.3rem" }}>{detail.activity_type?.icon || "⭐"}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{detail.activity_type?.name}</div>
                                                <div style={{ display: "flex", gap: "0.2rem" }}>
                                                    {Array.from({ length: 3 }, (_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={14}
                                                            fill={i < detail.star_level ? "#FFE66D" : "transparent"}
                                                            color={i < detail.star_level ? "#E8C94A" : "#E0E0E0"}
                                                        />
                                                    ))}
                                                    <span style={{ fontSize: "0.75rem", color: "var(--mint-dark)", fontWeight: 700, marginLeft: "0.3rem" }}>
                                                        +{detail.stars_earned}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Penalties */}
                                {eval_item.evaluation_penalties && eval_item.evaluation_penalties.length > 0 && (
                                    <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #F0F0F0" }}>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                            {eval_item.evaluation_penalties.map((pen: any) => (
                                                <span key={pen.id} className="badge badge-penalty">
                                                    {pen.penalty_type?.icon} {pen.penalty_type?.name} (-{pen.stars_deducted})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {eval_item.notes && (
                                    <div style={{
                                        marginTop: "0.75rem",
                                        padding: "0.5rem 0.75rem",
                                        background: "var(--yellow-light)",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "0.85rem",
                                        color: "#8a7020",
                                    }}>
                                        📝 {eval_item.notes}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
