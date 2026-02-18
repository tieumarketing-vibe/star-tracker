"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/actions";
import { Star } from "lucide-react";

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        if (isSignUp) {
            const result = await signUp(formData);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccess("Đăng ký thành công! Kiểm tra email để xác nhận tài khoản.");
            }
        } else {
            const result = await signIn(formData);
            if (result.error) {
                setError(result.error);
            } else {
                if (result.role === "child" && result.childId) {
                    router.push(`/dashboard/${result.childId}/evaluate`);
                } else {
                    router.push("/dashboard");
                }
                router.refresh();
            }
        }
        setLoading(false);
    }

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #FFD6DD 0%, #FFF8F0 30%, #D4F5E9 60%, #C5E8EF 100%)",
            padding: "1rem",
        }}>
            <div className="card animate-slide-up" style={{ maxWidth: 420, width: "100%", padding: "2.5rem" }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <Star size={36} fill="#FFE66D" color="#E8C94A" className="animate-float" />
                        <span style={{ fontSize: "2rem", fontWeight: 900, background: "linear-gradient(135deg, #E8899A, #F0B88A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            Star Tracker
                        </span>
                    </div>
                    <p style={{ color: "var(--text-light)", fontSize: "0.95rem" }}>
                        Theo dõi hoạt động hàng ngày của bé ⭐
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {isSignUp ? (
                        <>
                            <div style={{ marginBottom: "1rem" }}>
                                <label className="input-label">Tên của bạn</label>
                                <input name="name" type="text" className="input" placeholder="Nhập tên..." required />
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label className="input-label">Email</label>
                                <input name="email" type="email" className="input" placeholder="email@example.com" required />
                            </div>
                            <div style={{ marginBottom: "1.5rem" }}>
                                <label className="input-label">Mật khẩu</label>
                                <input name="password" type="password" className="input" placeholder="••••••••" required minLength={6} />
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ marginBottom: "1rem" }}>
                                <label className="input-label">Email hoặc tên đăng nhập</label>
                                <input
                                    name="email"
                                    type="text"
                                    className="input"
                                    placeholder="Email hoặc tên đăng nhập..."
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: "1.5rem" }}>
                                <label className="input-label">Mật khẩu</label>
                                <input name="password" type="password" className="input" placeholder="••••••••" required minLength={6} />
                            </div>
                        </>
                    )}

                    {error && (
                        <div style={{
                            background: "#FFE0E0", color: "#c44",
                            padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)",
                            marginBottom: "1rem", fontSize: "0.9rem", fontWeight: 600,
                        }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            background: "var(--mint-light)", color: "#2a7a5a",
                            padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)",
                            marginBottom: "1rem", fontSize: "0.9rem", fontWeight: 600,
                        }}>
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: "100%" }}
                        disabled={loading}
                    >
                        {loading ? "Đang xử lý..." : isSignUp ? "Đăng Ký" : "Đăng Nhập"}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccess(""); }}
                        style={{
                            background: "none", border: "none",
                            color: "var(--pink-dark)", fontWeight: 700,
                            cursor: "pointer", fontFamily: "Nunito", fontSize: "0.9rem",
                        }}
                    >
                        {isSignUp ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
                    </button>
                </div>
            </div>
        </div>
    );
}
