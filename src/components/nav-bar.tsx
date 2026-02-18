"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, getUserRole } from "@/lib/actions";
import { Star, Home, Award, ClipboardList, Settings, LogOut, Menu, X, CalendarDays, Baby } from "lucide-react";
import { useState, useEffect } from "react";

export function NavBar() {
    const pathname = usePathname();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [role, setRole] = useState<string>("parent");

    const isAdmin = pathname.startsWith("/admin");
    const childMatch = pathname.match(/\/dashboard\/([^/]+)/);
    const childId = childMatch?.[1];

    useEffect(() => {
        getUserRole().then(r => setRole(r));
    }, []);

    async function handleLogout() {
        await signOut();
        router.push("/login");
        router.refresh();
    }

    const isParent = role === "parent";

    const links = childId
        ? isParent
            ? [
                { href: `/dashboard/${childId}`, icon: <Home size={18} />, label: "Tổng quan" },
                { href: `/dashboard/${childId}/calendar`, icon: <CalendarDays size={18} />, label: "Lịch" },
                { href: "/dashboard", icon: <Baby size={18} />, label: "Quản lý bé" },
                { href: "/admin", icon: <Settings size={18} />, label: "Quản trị" },
            ]
            : [
                { href: `/dashboard/${childId}`, icon: <Home size={18} />, label: "Tổng quan" },
                { href: `/dashboard/${childId}/evaluate`, icon: <ClipboardList size={18} />, label: "Đánh giá" },
                { href: `/dashboard/${childId}/calendar`, icon: <CalendarDays size={18} />, label: "Lịch" },
                { href: `/dashboard/${childId}/rewards`, icon: <Award size={18} />, label: "Đổi thưởng" },
            ]
        : [
            { href: "/dashboard", icon: <Baby size={18} />, label: isParent ? "Quản lý bé" : "Chọn bé" },
            ...(isParent ? [{ href: "/admin", icon: <Settings size={18} />, label: "Quản trị" }] : []),
        ];

    return (
        <>
            <nav className="nav">
                <Link href="/dashboard" style={{ textDecoration: "none" }}>
                    <span className="nav-logo">⭐ Star Tracker</span>
                </Link>

                <div className="nav-links">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`nav-link ${pathname === link.href ? "active" : ""}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="btn btn-sm btn-outline"
                        style={{ marginLeft: "0.5rem" }}
                    >
                        <LogOut size={16} /> Thoát
                    </button>
                </div>

                {/* Mobile menu toggle */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{
                        display: "none",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "0.5rem",
                    }}
                    className="mobile-menu-btn"
                >
                    {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </nav>

            {/* Mobile bottom nav */}
            <div className="mobile-nav">
                {links.slice(0, 5).map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`mobile-nav-item ${pathname === link.href ? "active" : ""}`}
                    >
                        {link.icon}
                        <span>{link.label}</span>
                    </Link>
                ))}
            </div>

            <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
        </>
    );
}
