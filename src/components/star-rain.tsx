"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const STAR_CHARS = ["⭐", "🌟", "✨", "💫", "⭐"];

interface StarRainProps {
    trigger: number; // increment to trigger
    duration?: number;
    count?: number;
    withSound?: boolean;
}

export function StarRain({ trigger, duration = 3000, count = 30, withSound = false }: StarRainProps) {
    const [stars, setStars] = useState<{ id: number; x: number; char: string; delay: number; size: number; speed: number }[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (trigger <= 0) return;

        const newStars = Array.from({ length: count }, (_, i) => ({
            id: Date.now() + i,
            x: Math.random() * 100,
            char: STAR_CHARS[Math.floor(Math.random() * STAR_CHARS.length)],
            delay: Math.random() * 1000,
            size: 0.8 + Math.random() * 1.5,
            speed: 2 + Math.random() * 3,
        }));
        setStars(newStars);

        if (withSound) {
            playStarSound();
        }

        const timer = setTimeout(() => setStars([]), duration + 1500);
        return () => clearTimeout(timer);
    }, [trigger]);

    function playStarSound() {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Magical chime sequence
            const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5]; // C5, E5, G5, C6, G5, C6
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, ctx.currentTime);

                const startTime = ctx.currentTime + i * 0.12;
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

                osc.start(startTime);
                osc.stop(startTime + 0.5);
            });

            // Sparkle effect
            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.type = "triangle";
                osc2.frequency.setValueAtTime(1318.5, ctx.currentTime); // E6
                gain2.gain.setValueAtTime(0.1, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
                osc2.start();
                osc2.stop(ctx.currentTime + 0.6);
            }, 600);
        } catch { /* silent fail */ }
    }

    if (stars.length === 0) return null;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            pointerEvents: "none", zIndex: 9999, overflow: "hidden",
        }}>
            {stars.map(star => (
                <span key={star.id} style={{
                    position: "absolute",
                    left: `${star.x}%`,
                    top: "-40px",
                    fontSize: `${star.size}rem`,
                    animation: `starFall ${star.speed}s ease-in ${star.delay}ms forwards`,
                    opacity: 0,
                }}>
                    {star.char}
                </span>
            ))}
            <style>{`
                @keyframes starFall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    80% { opacity: 0.8; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

// Clickable star counter wrapper
interface StarCounterProps {
    stars: number;
}

export function StarCounter({ stars }: StarCounterProps) {
    const [trigger, setTrigger] = useState(0);

    const handleClick = useCallback(() => {
        setTrigger(prev => prev + 1);
    }, []);

    return (
        <>
            <StarRain trigger={trigger} count={25} withSound={true} />
            <div
                onClick={handleClick}
                className="animate-pulse-glow"
                style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    background: "linear-gradient(135deg, #FFF0A3, #FFE66D)",
                    padding: "0.75rem 2rem", borderRadius: "100px",
                    marginTop: "0.5rem", cursor: "pointer",
                    userSelect: "none", transition: "transform 0.2s",
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                title="Bấm để xem hiệu ứng sao rơi! ✨"
            >
                <span style={{ fontSize: "1.75rem" }}>⭐</span>
                <span style={{ fontWeight: 900, fontSize: "2rem", color: "#8a7020" }}>{stars}</span>
                <span style={{ fontSize: "1rem", color: "#8a7020", fontWeight: 700 }}>sao</span>
            </div>
        </>
    );
}
