import { NextResponse } from "next/server";
import { requireUser } from "@/app/api/_lib/auth";

export async function DELETE(request: Request) {
  const { supabase, user, response } = await requireUser();

  if (response || !user) {
    return response;
  }

  const body = await readBody(request);
  const outputId = typeof body.outputId === "string" ? body.outputId : "";

  if (!outputId) {
    return NextResponse.json({ error: "Output ID is required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("outputs")
    .delete()
    .eq("id", outputId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Output could not be deleted." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  return DELETE(request);
}

async function readBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
