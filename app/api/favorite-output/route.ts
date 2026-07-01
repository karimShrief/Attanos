import { NextResponse } from "next/server";
import { requireUser } from "@/app/api/_lib/auth";
import type { CampaignOutput } from "@/types/app";

export async function POST(request: Request) {
  const { supabase, user, response } = await requireUser();

  if (response || !user) {
    return response;
  }

  const body = await readBody(request);
  const outputId = typeof body.outputId === "string" ? body.outputId : "";
  const isFavorite = Boolean(body.isFavorite);

  if (!outputId) {
    return NextResponse.json({ error: "Output ID is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("outputs")
    .update({ is_favorite: isFavorite })
    .eq("id", outputId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Output could not be updated." }, { status: 500 });
  }

  return NextResponse.json({ output: data as CampaignOutput });
}

async function readBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
