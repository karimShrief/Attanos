export type Project = {
  id: string;
  user_id: string;
  name: string;
  developer: string | null;
  location: string | null;
  property_type: string | null;
  unit_types: string | null;
  starting_price: string | null;
  payment_plan: string | null;
  handover_date: string | null;
  main_usps: string | null;
  target_audience: string | null;
  language: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
};

export type BriefFeedback = {
  strengths: string[];
  weaknesses: string[];
  missing_inputs: string[];
  recommendations: string[];
  summary: string;
  generic_phrase_warnings?: string[];
};

export type CreativeBrief = {
  id: string;
  project_id: string;
  user_id: string;
  big_idea: string | null;
  tension: string | null;
  emotional_trigger: string | null;
  buyer_objection: string | null;
  hidden_desire: string | null;
  campaign_angle: string | null;
  desired_action: string | null;
  avoid_list: string | null;
  creative_clarity_score: number | null;
  buyer_psychology_score: number | null;
  differentiation_score: number | null;
  conversion_readiness_score: number | null;
  idea_score: number | null;
  unlock_generation: boolean;
  ai_feedback: BriefFeedback | null;
  created_at: string;
  updated_at: string;
};

export type OutputType =
  | "headlines"
  | "captions"
  | "scripts"
  | "lead_forms"
  | "proofreading"
  | "design_review";

export type CampaignOutput = {
  id: string;
  project_id: string;
  brief_id: string | null;
  user_id: string;
  type: OutputType;
  platform: string | null;
  tone: string | null;
  language: string | null;
  content: unknown;
  is_favorite: boolean;
  created_at: string;
};

export type ProjectStatus = "Locked" | "Needs stronger idea" | "Unlocked";

export type BriefFormState = {
  big_idea: string;
  tension: string;
  emotional_trigger: string;
  buyer_objection: string;
  hidden_desire: string;
  campaign_angle: string;
  desired_action: string;
  avoid_list: string;
};
