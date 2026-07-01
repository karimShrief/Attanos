import { NextResponse } from "next/server";
import { requestJsonFromOpenAI } from "@/lib/openai";
import type { CampaignOutput } from "@/types/app";
import { requireUser } from "@/app/api/_lib/auth";
import { getUnlockedProjectContext } from "@/app/api/_lib/campaign";

const systemPrompt = `
You are ATTANOS, a senior real estate campaign editor.
Improve pasted campaign copy according to the selected mode while preserving truthful project facts.
Do not invent prices, offers, locations, amenities, payment plans, handover dates, or developer claims.
Remove generic AI language when appropriate and make the copy sound more human, premium, and strategically clear.
Return structured JSON only.
`;

export async function POST(request: Request) {
  const { supabase, user, response } = await requireUser();

  if (response || !user) {
    return response;
  }

  const body = await readBody(request);
  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const mode = typeof body.mode === "string" ? body.mode.trim() : "Luxury polish";

  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  const context = await getUnlockedProjectContext(supabase, user, projectId);

  if (context.response || !context.project || !context.brief) {
    return context.response;
  }

  try {
    const content = await requestJsonFromOpenAI({
      temperature: 0.28,
      system: systemPrompt,
      user: JSON.stringify(
        {
          mode,
          original_text: text,
          required_json_shape: {
            original_text: "",
            mode: "",
            improved_text: "",
            changes_made: [],
            warnings: []
          },
          project: context.project,
          creative_brief: context.brief
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
        type: "proofreading",
        platform: null,
        tone: mode,
        language: context.project.language || "English",
        content
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Proofread output could not be saved." }, { status: 500 });
    }

    return NextResponse.json({ output: data as CampaignOutput });
  } catch (caught) {
    return NextResponse.json(
      {
        error:
          caught instanceof Error
            ? `Proofreading failed: ${caught.message}`
            : "Proofreading failed."
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
