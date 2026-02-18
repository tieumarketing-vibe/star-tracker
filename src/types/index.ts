export interface Profile {
    id: string;
    email: string;
    name: string;
    role: "admin" | "parent";
    created_at: string;
}

export interface Child {
    id: string;
    user_id: string;
    name: string;
    avatar_url: string;
    birth_date: string | null;
    created_at: string;
}

export interface ActivityType {
    id: string;
    name: string;
    icon: string;
    description: string;
    star_level_1: number;
    star_level_2: number;
    star_level_3: number;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

export interface PenaltyType {
    id: string;
    name: string;
    description: string;
    star_deduction: number;
    icon: string;
    is_active: boolean;
    created_at: string;
}

export interface DailyEvaluation {
    id: string;
    child_id: string;
    eval_date: string;
    notes: string;
    total_stars_earned: number;
    total_stars_deducted: number;
    evaluated_by: string | null;
    created_at: string;
}

export interface EvaluationDetail {
    id: string;
    evaluation_id: string;
    activity_type_id: string;
    star_level: number;
    stars_earned: number;
    note: string;
    activity_type?: ActivityType;
}

export interface EvaluationPenalty {
    id: string;
    evaluation_id: string;
    penalty_type_id: string;
    stars_deducted: number;
    note: string;
    penalty_type?: PenaltyType;
}

export interface Reward {
    id: string;
    name: string;
    description: string;
    image_url: string;
    star_cost: number;
    tier: "weekly" | "monthly" | "yearly";
    is_active: boolean;
    created_at: string;
}

export interface RewardRedemption {
    id: string;
    child_id: string;
    reward_id: string;
    stars_spent: number;
    status: "pending" | "approved" | "rejected";
    redeemed_at: string;
    approved_at: string | null;
    reward?: Reward;
}

export interface StarTransaction {
    id: string;
    child_id: string;
    type: "earn" | "penalty" | "redeem" | "reset";
    amount: number;
    description: string;
    reference_id: string | null;
    created_at: string;
}

export interface ChildStarBalance {
    child_id: string;
    child_name: string;
    total_stars: number;
}

// Form types
export interface EvaluationFormData {
    activities: {
        activity_type_id: string;
        star_level: number;
    }[];
    penalties: string[]; // penalty_type_ids
    notes: string;
}
