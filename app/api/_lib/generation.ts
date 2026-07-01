import { NextResponse } from "next/server";
import { requestJsonFromOpenAI } from "@/lib/openai";
import type { CampaignOutput, OutputType } from "@/types/app";
import { requireUser } from "./auth";
import { getUnlockedProjectContext } from "./campaign";

type GenerationConfig = {
  outputType: OutputType;
  task: string;
  shape: string;
  routeLabel: string;
  temperature?: number;
};

const baseSystemPrompt = `
You are ATTANOS, a strict senior real estate creative strategist and campaign asset builder.

Core philosophy:
Human strategy first. AI execution second.

Use the Creative Gate as the source of truth. Use project data, creative brief data, and AI feedback.
Do not invent unsupported facts. Do not invent prices, payment plans, offers, locations, amenities, handover dates, or developer claims.
If important data is missing, use neutral phrasing or mention that more specific data would improve the result.
Avoid generic AI marketing language unless strategically justified. Be specific, controlled, premium, and useful.
Return structured JSON only. No markdown. No commentary outside the JSON object.
`;

export async function generateAndSave(request: Request, config: GenerationConfig) {
  const { supabase, user, response } = await requireUser();

  if (response || !user) {
    return response;
  }

  const body = await readBody(request);
  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  const context = await getUnlockedProjectContext(supabase, user, projectId);

  if (context.response || !context.project || !context.brief) {
    return context.response;
  }

  try {
    const content = await requestJsonFromOpenAI({
      temperature: config.temperature ?? 0.42,
      system: baseSystemPrompt,
      user: JSON.stringify(
        {
          task: config.task,
          required_json_shape: config.shape,
          project: context.project,
          creative_brief: context.brief,
          ai_feedback: context.brief.ai_feedback
        },
        null,
        2
      )
    });

    const { data, error } = await supabase
      .from("outputs")
      .insert({
        project_id: context.project.id,
        brief_id: context.brief.id,
        user_id: user.id,
        type: config.outputType,
        platform: typeof body.platform === "string" ? body.platform : null,
        tone: typeof body.tone === "string" ? body.tone : null,
        language:
          typeof body.language === "string"
            ? body.language
            : context.project.language || "English",
        content
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Generated content could not be saved." }, { status: 500 });
    }

    return NextResponse.json({ output: data as CampaignOutput });
  } catch (caught) {
    return NextResponse.json(
      {
        error:
          caught instanceof Error
            ? `${config.routeLabel} failed: ${caught.message}`
            : `${config.routeLabel} failed.`
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
