"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { EvaluationFormData } from "@/types";

// ============================================
// AUTH ACTIONS
// ============================================

export async function signIn(formData: FormData) {
    const supabase = await createClient();
    let email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Username login: convert to email format
    if (!email.includes("@")) {
        email = `${email.toLowerCase()}@startracker.app`;
    }

    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    // Check role for redirect
    const role = data.user?.user_metadata?.role || "parent";
    let childId: string | null = null;

    if (role === "child") {
        const { data: child } = await supabase
            .from("children")
            .select("id")
            .eq("profile_id", data.user.id)
            .single();
        childId = child?.id || null;
    }

    return { success: true, role, childId };
}

export async function signUp(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role: "parent" } },
    });
    if (error) return { error: error.message };
    return { success: true };
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
}

export async function getUserRole(): Promise<string> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "parent";

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    return profile?.role || user.user_metadata?.role || "parent";
}

export async function getChildForProfile(): Promise<string | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: child } = await supabase
        .from("children")
        .select("id")
        .eq("profile_id", user.id)
        .single();

    return child?.id || null;
}

// ============================================
// CHILDREN ACTIONS
// ============================================

export async function getChildren() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("children")
        .select("*")
        .order("created_at");
    return data || [];
}

export async function getChild(id: string) {
    const supabase = await createClient();
    const { data } = await supabase.from("children").select("*").eq("id", id).single();
    return data;
}

async function ensureProfile(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: string, email: string, name?: string) {
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();

    if (!profile) {
        await supabase.from("profiles").insert({
            id: userId,
            email: email,
            name: name || email.split("@")[0] || "",
            role: "parent",
        });
    }
}

export async function createChild(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Ensure profile exists
    await ensureProfile(supabase, user.id, user.email || "", user.user_metadata?.name);

    const childName = formData.get("name") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const avatarUrl = formData.get("avatar_url") as string || "";
    const birthDate = formData.get("birth_date") as string || null;

    let profileId: string | null = null;

    // Create auth account for child if username provided
    if (username && password) {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const adminClient = createAdminClient();

        const childEmail = `${username.toLowerCase()}@startracker.app`;

        // Check if username already exists
        const { data: existing } = await supabase
            .from("children")
            .select("id")
            .eq("username", username.toLowerCase())
            .single();

        if (existing) {
            return { error: "Tên đăng nhập đã tồn tại! Vui lòng chọn tên khác." };
        }

        // Create auth user via admin API
        const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
            email: childEmail,
            password: password,
            email_confirm: true,
            user_metadata: { name: childName, role: "child" },
        });

        if (authError) return { error: `Lỗi tạo tài khoản: ${authError.message}` };
        profileId = newUser.user.id;
    }

    const { error } = await supabase.from("children").insert({
        user_id: user.id,
        profile_id: profileId,
        username: username?.toLowerCase() || null,
        name: childName,
        avatar_url: avatarUrl,
        birth_date: birthDate,
    });

    if (error) return { error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/admin/children");
    return { success: true };
}

export async function updateChild(id: string, formData: FormData) {
    const supabase = await createClient();
    const { error } = await supabase.from("children").update({
        name: formData.get("name") as string,
        avatar_url: formData.get("avatar_url") as string || "",
        birth_date: formData.get("birth_date") as string || null,
    }).eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/admin/children");
    return { success: true };
}

export async function deleteChild(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("children").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/admin/children");
    return { success: true };
}

// ============================================
// STAR BALANCE
// ============================================

export async function getChildStarBalance(childId: string) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_child_stars", { p_child_id: childId });
    return data ?? 0;
}

// ============================================
// ACTIVITY TYPES
// ============================================

export async function getActivityTypes() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("activity_types")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
    return data || [];
}

export async function getAllActivityTypes() {
    const supabase = await createClient();
    const { data } = await supabase.from("activity_types").select("*").order("sort_order");
    return data || [];
}

export async function createActivityType(formData: FormData) {
    const supabase = await createClient();
    const { error } = await supabase.from("activity_types").insert({
        name: formData.get("name") as string,
        icon: formData.get("icon") as string || "⭐",
        description: formData.get("description") as string || "",
        star_level_1: parseInt(formData.get("star_level_1") as string) || 1,
        star_level_2: parseInt(formData.get("star_level_2") as string) || 2,
        star_level_3: parseInt(formData.get("star_level_3") as string) || 3,
    });
    if (error) return { error: error.message };
    revalidatePath("/admin/activities");
    return { success: true };
}

export async function updateActivityType(id: string, formData: FormData) {
    const supabase = await createClient();
    const { error } = await supabase.from("activity_types").update({
        name: formData.get("name") as string,
        icon: formData.get("icon") as string,
        description: formData.get("description") as string,
        star_level_1: parseInt(formData.get("star_level_1") as string),
        star_level_2: parseInt(formData.get("star_level_2") as string),
        star_level_3: parseInt(formData.get("star_level_3") as string),
        is_active: formData.get("is_active") === "true",
    }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin/activities");
    return { success: true };
}

// ============================================
// PENALTY TYPES
// ============================================

export async function getPenaltyTypes() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("penalty_types")
        .select("*")
        .eq("is_active", true)
        .order("created_at");
    return data || [];
}

export async function getAllPenaltyTypes() {
    const supabase = await createClient();
    const { data } = await supabase.from("penalty_types").select("*").order("created_at");
    return data || [];
}

export async function createPenaltyType(formData: FormData) {
    const supabase = await createClient();
    const type = formData.get("type") as string || "penalty";
    const { error } = await supabase.from("penalty_types").insert({
        name: formData.get("name") as string,
        description: formData.get("description") as string || "",
        type,
        star_deduction: parseInt(formData.get("star_deduction") as string) || 1,
        icon: formData.get("icon") as string || (type === "bonus" ? "🌟" : "⚠️"),
    });
    if (error) return { error: error.message };
    revalidatePath("/admin/penalties");
    return { success: true };
}

export async function updatePenaltyType(id: string, formData: FormData) {
    const supabase = await createClient();
    const { error } = await supabase.from("penalty_types").update({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        type: formData.get("type") as string || "penalty",
        star_deduction: parseInt(formData.get("star_deduction") as string),
        icon: formData.get("icon") as string,
        is_active: formData.get("is_active") === "true",
    }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin/penalties");
    return { success: true };
}

export async function deletePenaltyType(id: string) {
    const supabase = await createClient();
    // Delete related evaluation penalties first
    await supabase.from("evaluation_penalties").delete().eq("penalty_type_id", id);
    const { error } = await supabase.from("penalty_types").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin/penalties");
    return { success: true };
}

// ============================================
// DAILY EVALUATION
// ============================================

export async function submitEvaluation(childId: string, data: EvaluationFormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Get activity types for star calculation
    const { data: activityTypes } = await supabase.from("activity_types").select("*");
    const activityMap = new Map(activityTypes?.map(a => [a.id, a]) || []);

    // Get penalty types for star calculation
    const { data: penaltyTypes } = await supabase.from("penalty_types").select("*");
    const penaltyMap = new Map(penaltyTypes?.map(p => [p.id, p]) || []);

    // Calculate total stars
    let totalEarned = 0;
    let totalDeducted = 0;

    const activityDetails = data.activities.map(a => {
        const actType = activityMap.get(a.activity_type_id);
        const starKey = `star_level_${a.star_level}` as "star_level_1" | "star_level_2" | "star_level_3";
        const stars = actType?.[starKey] || a.star_level;
        totalEarned += stars;
        return { ...a, stars_earned: stars };
    });

    const penaltyDetails = data.penalties.map(pid => {
        const penalty = penaltyMap.get(pid);
        const value = penalty?.star_deduction || 1;
        if (penalty?.type === "bonus") {
            totalEarned += value;
        } else {
            totalDeducted += value;
        }
        return { penalty_type_id: pid, stars_deducted: penalty?.type === "bonus" ? -value : value };
    });

    // Check if evaluation exists for today
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
        .from("daily_evaluations")
        .select("id")
        .eq("child_id", childId)
        .eq("eval_date", today)
        .single();

    if (existing) {
        // Delete old evaluation details and penalties
        await supabase.from("evaluation_details").delete().eq("evaluation_id", existing.id);
        await supabase.from("evaluation_penalties").delete().eq("evaluation_id", existing.id);
        // Delete old star transactions for this evaluation
        await supabase.from("star_transactions").delete().eq("reference_id", existing.id);

        // Update evaluation
        await supabase.from("daily_evaluations").update({
            notes: data.notes,
            total_stars_earned: totalEarned,
            total_stars_deducted: totalDeducted,
            evaluated_by: user.id,
        }).eq("id", existing.id);

        // Insert new details
        if (activityDetails.length > 0) {
            await supabase.from("evaluation_details").insert(
                activityDetails.map(d => ({
                    evaluation_id: existing.id,
                    activity_type_id: d.activity_type_id,
                    star_level: d.star_level,
                    stars_earned: d.stars_earned,
                }))
            );
        }

        if (penaltyDetails.length > 0) {
            await supabase.from("evaluation_penalties").insert(
                penaltyDetails.map(p => ({
                    evaluation_id: existing.id,
                    penalty_type_id: p.penalty_type_id,
                    stars_deducted: p.stars_deducted,
                }))
            );
        }

        // Create star transactions
        if (totalEarned > 0) {
            await supabase.from("star_transactions").insert({
                child_id: childId,
                type: "earn",
                amount: totalEarned,
                description: `Đánh giá ngày ${today}`,
                reference_id: existing.id,
            });
        }

        if (totalDeducted > 0) {
            await supabase.from("star_transactions").insert({
                child_id: childId,
                type: "penalty",
                amount: -totalDeducted,
                description: `Phạt ngày ${today}`,
                reference_id: existing.id,
            });
        }
    } else {
        // Create new evaluation
        const { data: newEval, error } = await supabase.from("daily_evaluations").insert({
            child_id: childId,
            eval_date: today,
            notes: data.notes,
            total_stars_earned: totalEarned,
            total_stars_deducted: totalDeducted,
            evaluated_by: user.id,
        }).select("id").single();

        if (error || !newEval) return { error: error?.message || "Failed to create evaluation" };

        // Insert details
        if (activityDetails.length > 0) {
            await supabase.from("evaluation_details").insert(
                activityDetails.map(d => ({
                    evaluation_id: newEval.id,
                    activity_type_id: d.activity_type_id,
                    star_level: d.star_level,
                    stars_earned: d.stars_earned,
                }))
            );
        }

        if (penaltyDetails.length > 0) {
            await supabase.from("evaluation_penalties").insert(
                penaltyDetails.map(p => ({
                    evaluation_id: newEval.id,
                    penalty_type_id: p.penalty_type_id,
                    stars_deducted: p.stars_deducted,
                }))
            );
        }

        // Create star transactions
        if (totalEarned > 0) {
            await supabase.from("star_transactions").insert({
                child_id: childId,
                type: "earn",
                amount: totalEarned,
                description: `Đánh giá ngày ${today}`,
                reference_id: newEval.id,
            });
        }

        if (totalDeducted > 0) {
            await supabase.from("star_transactions").insert({
                child_id: childId,
                type: "penalty",
                amount: -totalDeducted,
                description: `Phạt ngày ${today}`,
                reference_id: newEval.id,
            });
        }
    }

    revalidatePath(`/dashboard/${childId}`);
    revalidatePath(`/dashboard/${childId}/evaluate`);
    revalidatePath(`/dashboard/${childId}/history`);
    return { success: true, earned: totalEarned, deducted: totalDeducted };
}

export async function getEvaluationHistory(childId: string, limit = 30) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("daily_evaluations")
        .select(`
      *,
      evaluation_details(*, activity_type:activity_types(*)),
      evaluation_penalties(*, penalty_type:penalty_types(*))
    `)
        .eq("child_id", childId)
        .order("eval_date", { ascending: false })
        .limit(limit);
    return data || [];
}

export async function getMonthEvaluations(childId: string, year: number, month: number) {
    const supabase = await createClient();
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

    const { data } = await supabase
        .from("daily_evaluations")
        .select(`
      *,
      evaluation_details(*, activity_type:activity_types(*)),
      evaluation_penalties(*, penalty_type:penalty_types(*))
    `)
        .eq("child_id", childId)
        .gte("eval_date", startDate)
        .lte("eval_date", endDate)
        .order("eval_date");
    return data || [];
}

export async function getTodayEvaluation(childId: string) {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
        .from("daily_evaluations")
        .select(`
      *,
      evaluation_details(*, activity_type:activity_types(*)),
      evaluation_penalties(*, penalty_type:penalty_types(*))
    `)
        .eq("child_id", childId)
        .eq("eval_date", today)
        .single();
    return data;
}

// ============================================
// REWARDS
// ============================================

export async function getRewards() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("rewards")
        .select("*")
        .eq("is_active", true)
        .order("star_cost");
    return data || [];
}

export async function getAllRewards() {
    const supabase = await createClient();
    const { data } = await supabase.from("rewards").select("*").order("star_cost");
    return data || [];
}

export async function createReward(formData: FormData) {
    const supabase = await createClient();
    const { error } = await supabase.from("rewards").insert({
        name: formData.get("name") as string,
        description: formData.get("description") as string || "",
        image_url: formData.get("image_url") as string || "",
        star_cost: parseInt(formData.get("star_cost") as string) || 10,
        tier: formData.get("tier") as string || "weekly",
        is_free_daily: formData.get("is_free_daily") === "true",
        is_weekly_challenge: formData.get("is_weekly_challenge") === "true",
        weekly_bonus_stars: parseInt(formData.get("weekly_bonus_stars") as string) || 5,
    });
    if (error) return { error: error.message };
    revalidatePath("/admin/rewards");
    return { success: true };
}

export async function updateReward(id: string, formData: FormData) {
    const supabase = await createClient();
    const { error } = await supabase.from("rewards").update({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        image_url: formData.get("image_url") as string,
        star_cost: parseInt(formData.get("star_cost") as string),
        tier: formData.get("tier") as string,
        is_active: formData.get("is_active") === "true",
        is_free_daily: formData.get("is_free_daily") === "true",
        is_weekly_challenge: formData.get("is_weekly_challenge") === "true",
        weekly_bonus_stars: parseInt(formData.get("weekly_bonus_stars") as string) || 5,
    }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin/rewards");
    return { success: true };
}

export async function deleteReward(id: string) {
    const supabase = await createClient();
    // Delete related data first
    await supabase.from("weekly_challenge_progress").delete().eq("reward_id", id);
    await supabase.from("reward_redemptions").delete().eq("reward_id", id);
    const { error } = await supabase.from("rewards").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin/rewards");
    return { success: true };
}

// ============================================
// WEEKLY CHALLENGE
// ============================================

function getWeekStart(): string {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon, ...
    const diff = day === 0 ? 6 : day - 1; // Monday = start of week
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    return monday.toISOString().split("T")[0];
}

export async function getWeeklyChallengeProgress(childId: string) {
    const supabase = await createClient();
    const weekStart = getWeekStart();

    const { data } = await supabase
        .from("weekly_challenge_progress")
        .select("*, reward:rewards(*)")
        .eq("child_id", childId)
        .eq("week_start", weekStart);
    return data || [];
}

export async function checkInWeeklyChallenge(childId: string, rewardId: string) {
    const supabase = await createClient();
    const weekStart = getWeekStart();

    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon
    const dayIndex = day === 0 ? 7 : day; // Mon=1, Tue=2, ..., Sun=7
    const dayColumn = `day_${dayIndex}` as `day_${1 | 2 | 3 | 4 | 5 | 6 | 7}`;

    // Get or create progress record
    let { data: progress } = await supabase
        .from("weekly_challenge_progress")
        .select("*")
        .eq("child_id", childId)
        .eq("reward_id", rewardId)
        .eq("week_start", weekStart)
        .single();

    if (!progress) {
        const { data: newProgress, error } = await supabase
            .from("weekly_challenge_progress")
            .insert({
                child_id: childId,
                reward_id: rewardId,
                week_start: weekStart,
                [dayColumn]: true,
            })
            .select("*")
            .single();
        if (error) return { error: error.message };
        progress = newProgress;
    } else {
        if (progress[dayColumn]) {
            return { error: "Hôm nay đã check-in rồi! ✅" };
        }
        const { error } = await supabase
            .from("weekly_challenge_progress")
            .update({ [dayColumn]: true })
            .eq("id", progress.id);
        if (error) return { error: error.message };
        progress[dayColumn] = true;
    }

    // Check if all 7 days completed
    const allDone = progress.day_1 && progress.day_2 && progress.day_3 &&
        progress.day_4 && progress.day_5 && progress.day_6 && progress.day_7;

    if (allDone && !progress.bonus_awarded) {
        // Get reward to know bonus stars
        const { data: reward } = await supabase
            .from("rewards")
            .select("weekly_bonus_stars, name")
            .eq("id", rewardId)
            .single();

        const bonusStars = reward?.weekly_bonus_stars || 5;

        // Award bonus stars
        await supabase.from("star_transactions").insert({
            child_id: childId,
            type: "earn",
            amount: bonusStars,
            description: `🏆 Hoàn thành 7 ngày: ${reward?.name}`,
            reference_id: progress.id,
        });

        // Mark as awarded
        await supabase
            .from("weekly_challenge_progress")
            .update({ bonus_awarded: true })
            .eq("id", progress.id);

        revalidatePath(`/dashboard/${childId}`);
        return { success: true, bonusAwarded: true, bonusStars };
    }

    revalidatePath(`/dashboard/${childId}`);
    return { success: true, bonusAwarded: false, daysCompleted: dayIndex };
}

export async function redeemReward(childId: string, rewardId: string) {
    const supabase = await createClient();

    // Get reward info
    const { data: reward } = await supabase
        .from("rewards")
        .select("*")
        .eq("id", rewardId)
        .single();
    if (!reward) return { error: "Reward not found" };

    const isFree = reward.is_free_daily;

    // For free daily rewards, check if already redeemed today
    if (isFree) {
        const today = new Date().toISOString().split("T")[0];
        const { data: existing } = await supabase
            .from("reward_redemptions")
            .select("id")
            .eq("child_id", childId)
            .eq("reward_id", rewardId)
            .gte("redeemed_at", today + "T00:00:00")
            .lte("redeemed_at", today + "T23:59:59");
        if (existing && existing.length > 0) {
            return { error: "Hôm nay bé đã nhận phần thưởng này rồi! 🎁" };
        }
    } else {
        // Check star balance for non-free rewards
        const stars = await getChildStarBalance(childId);
        if (stars < reward.star_cost) {
            return { error: `Không đủ sao! Cần ${reward.star_cost} ⭐, hiện có ${stars} ⭐` };
        }
    }

    // Create redemption
    const { data: redemption, error } = await supabase.from("reward_redemptions").insert({
        child_id: childId,
        reward_id: rewardId,
        stars_spent: isFree ? 0 : reward.star_cost,
        status: isFree ? "approved" : "pending",
    }).select("id").single();

    if (error) return { error: error.message };

    // Create star transaction only for non-free rewards
    if (!isFree) {
        await supabase.from("star_transactions").insert({
            child_id: childId,
            type: "redeem",
            amount: -reward.star_cost,
            description: `Đổi: ${reward.name}`,
            reference_id: redemption?.id,
        });
    }

    revalidatePath(`/dashboard/${childId}`);
    revalidatePath(`/dashboard/${childId}/rewards`);
    return { success: true };
}

export async function getRedemptions(childId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("reward_redemptions")
        .select("*, reward:rewards(*)")
        .eq("child_id", childId)
        .order("redeemed_at", { ascending: false });
    return data || [];
}

export async function approveRedemption(redemptionId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("reward_redemptions")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", redemptionId);
    if (error) return { error: error.message };
    revalidatePath("/admin");
    return { success: true };
}

export async function rejectRedemption(redemptionId: string, childId: string, starsToRefund: number) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("reward_redemptions")
        .update({ status: "rejected" })
        .eq("id", redemptionId);
    if (error) return { error: error.message };

    // Refund stars
    await supabase.from("star_transactions").insert({
        child_id: childId,
        type: "earn",
        amount: starsToRefund,
        description: "Hoàn sao do từ chối đổi thưởng",
        reference_id: redemptionId,
    });

    revalidatePath("/admin");
    revalidatePath(`/dashboard/${childId}`);
    return { success: true };
}

export async function deleteRedemption(redemptionId: string, childId: string) {
    const supabase = await createClient();

    // Delete related star transactions (this undoes the -stars deduction automatically)
    await supabase.from("star_transactions")
        .delete()
        .eq("reference_id", redemptionId);

    // Delete the redemption
    const { error } = await supabase
        .from("reward_redemptions")
        .delete()
        .eq("id", redemptionId);
    if (error) return { error: error.message };

    revalidatePath("/admin");
    revalidatePath(`/dashboard/${childId}`);
    revalidatePath(`/dashboard/${childId}/rewards`);
    return { success: true };
}

// ============================================
// STAR TRANSACTIONS
// ============================================

export async function getStarTransactions(childId: string, limit = 50) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("star_transactions")
        .select("*")
        .eq("child_id", childId)
        .order("created_at", { ascending: false })
        .limit(limit);
    return data || [];
}
