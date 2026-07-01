import { NextResponse } from "next/server";
import { getProject } from "@/app/api/_lib/campaign";
import { requireUser } from "@/app/api/_lib/auth";
import { requestJsonFromOpenAI } from "@/lib/openai";
import {
  findGenericPhrases,
  isObviouslyGenericBrief,
  validateBriefInput
} from "@/lib/validation";
import type { BriefFeedback, BriefFormState, CreativeBrief } from "@/types/app";

type EvaluationResult = {
  creative_clarity_score: number;
  buyer_psychology_score: number;
  differentiation_score: number;
  conversion_readiness_score: number;
  idea_score: number;
  unlock_generation: boolean;
  strengths: string[];
  weaknesses: string[];
  missing_inputs: string[];
  recommendations: string[];
  summary: string;
};

const judgeSystemPrompt = `
You are a strict senior real estate creative strategist judging ATTANOS Creative Gate submissions.

The user must provide real creative strategy before generation unlocks. Reject generic marketing language, vague luxury claims, and shallow campaign thinking.

Score:
- creative_clarity_score: 0-25
- buyer_psychology_score: 0-25
- differentiation_score: 0-25
- conversion_readiness_score: 0-25
- idea_score: 0-100

Unlock rule:
unlock_generation can only be true if idea_score >= 70 and the brief is not generic.
If the brief is generic, unlock_generation must be false even if fields are present.

Reward:
- Specific buyer tension
- Clear emotional trigger
- Clear target buyer
- Clear conversion action
- Clear differentiation
- Realistic promise
- Useful campaign angle

Penalize:
- Generic luxury phrases
- No buyer psychology
- No real tension
- No reason to believe
- No clear CTA
- Unsupported claims
- Fake urgency
- Vague "premium lifestyle" language

Generic phrase warning list:
luxury, premium, exclusive, dream home, unmatched, elevated living, perfect lifestyle, where comfort meets elegance, your future awaits, limited opportunity, iconic, world-class.

Return JSON only with this exact shape:
{
  "creative_clarity_score": 0,
  "buyer_psychology_score": 0,
  "differentiation_score": 0,
  "conversion_readiness_score": 0,
  "idea_score": 0,
  "unlock_generation": false,
  "strengths": [],
  "weaknesses": [],
  "missing_inputs": [],
  "recommendations": [],
  "summary": ""
}
`;

export async function POST(request: Request) {
  const { supabase, user, response } = await requireUser();

  if (response || !user) {
    return response;
  }

  const body = await readBody(request);
  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  const briefId = typeof body.briefId === "string" ? body.briefId : null;
  const brief = normalizeBriefInput(body.brief);
  const validationErrors = validateBriefInput(brief);

  if (validationErrors.length) {
    return NextResponse.json({ error: validationErrors.join(" ") }, { status: 400 });
  }

  const projectResult = await getProject(supabase, user, projectId);

  if (projectResult.response || !projectResult.project) {
    return projectResult.response;
  }

  try {
    const rawEvaluation = await requestJsonFromOpenAI({
      temperature: 0.18,
      system: judgeSystemPrompt,
      user: JSON.stringify(
        {
          project: projectResult.project,
          creative_brief: brief,
          instruction:
            "Judge whether this human creative idea is strong enough for AI campaign generation."
        },
        null,
        2
      )
    });

    const evaluation = normalizeEvaluation(rawEvaluation);
    const genericWarnings = findGenericPhrases(Object.values(brief).join(" "));
    const obviouslyGeneric = isObviouslyGenericBrief(brief);

    if (obviouslyGeneric) {
      evaluation.unlock_generation = false;
      evaluation.idea_score = Math.min(evaluation.idea_score, 69);
      evaluation.weaknesses = unique([
        ...evaluation.weaknesses,
        "The brief leans on generic positioning instead of a distinct buyer tension."
      ]);
      evaluation.recommendations = unique([
        ...evaluation.recommendations,
        "Replace broad luxury language with a specific buyer conflict, reason to believe, and desired action."
      ]);
    }

    evaluation.unlock_generation = evaluation.idea_score >= 70 && evaluation.unlock_generation && !obviouslyGeneric;

    const aiFeedback: BriefFeedback = {
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      missing_inputs: evaluation.missing_inputs,
      recommendations: evaluation.recommendations,
      summary: evaluation.summary,
      generic_phrase_warnings: genericWarnings
    };

    const row = {
      project_id: projectResult.project.id,
      user_id: user.id,
      big_idea: brief.big_idea,
      tension: brief.tension,
      emotional_trigger: brief.emotional_trigger,
      buyer_objection: brief.buyer_objection,
      hidden_desire: brief.hidden_desire,
      campaign_angle: brief.campaign_angle,
      desired_action: brief.desired_action,
      avoid_list: brief.avoid_list,
      creative_clarity_score: evaluation.creative_clarity_score,
      buyer_psychology_score: evaluation.buyer_psychology_score,
      differentiation_score: evaluation.differentiation_score,
      conversion_readiness_score: evaluation.conversion_readiness_score,
      idea_score: evaluation.idea_score,
      unlock_generation: evaluation.unlock_generation,
      ai_feedback: aiFeedback
    };

    const query = briefId
      ? supabase
          .from("creative_briefs")
          .update(row)
          .eq("id", briefId)
          .eq("project_id", projectResult.project.id)
          .eq("user_id", user.id)
          .select("*")
          .single()
      : supabase.from("creative_briefs").insert(row).select("*").single();

    const { data, error } = await query;

    if (error || !data) {
      return NextResponse.json({ error: "Creative Gate result could not be saved." }, { status: 500 });
    }

    return NextResponse.json({
      brief: data as CreativeBrief,
      evaluation
    });
  } catch (caught) {
    return NextResponse.json(
      {
        error:
          caught instanceof Error
            ? `Creative Gate evaluation failed: ${caught.message}`
            : "Creative Gate evaluation failed."
      },
      { status: 500 }
    );
  }
}

async function readBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function normalizeBriefInput(value: unknown): BriefFormState {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    big_idea: asString(input.big_idea),
    tension: asString(input.tension),
    emotional_trigger: asString(input.emotional_trigger),
    buyer_objection: asString(input.buyer_objection),
    hidden_desire: asString(input.hidden_desire),
    campaign_angle: asString(input.campaign_angle),
    desired_action: asString(input.desired_action),
    avoid_list: asString(input.avoid_list)
  };
}

function normalizeEvaluation(value: unknown): EvaluationResult {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const creative = clampScore(input.creative_clarity_score, 25);
  const psychology = clampScore(input.buyer_psychology_score, 25);
  const differentiation = clampScore(input.differentiation_score, 25);
  const conversion = clampScore(input.conversion_readiness_score, 25);
  const total = clampScore(input.idea_score, 100);
  const summed = creative + psychology + differentiation + conversion;
  const ideaScore = total > 0 ? total : summed;

  return {
    creative_clarity_score: creative,
    buyer_psychology_score: psychology,
    differentiation_score: differentiation,
    conversion_readiness_score: conversion,
    idea_score: Math.min(100, ideaScore),
    unlock_generation: Boolean(input.unlock_generation),
    strengths: asStringArray(input.strengths),
    weaknesses: asStringArray(input.weaknesses),
    missing_inputs: asStringArray(input.missing_inputs),
    recommendations: asStringArray(input.recommendations),
    summary: asString(input.summary)
  };
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim())
    : [];
}

function clampScore(value: unknown, max: number) {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.min(max, Math.round(numberValue)));
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}
