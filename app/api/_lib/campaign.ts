import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { CreativeBrief, Project } from "@/types/app";

export async function getProject(
  supabase: SupabaseClient,
  user: User,
  projectId: string
): Promise<{ project?: Project; response?: NextResponse }> {
  if (!projectId) {
    return {
      response: NextResponse.json({ error: "Project ID is required." }, { status: 400 })
    };
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return {
      response: NextResponse.json({ error: "Project not found." }, { status: 404 })
    };
  }

  return { project: data as Project };
}

export async function getUnlockedProjectContext(
  supabase: SupabaseClient,
  user: User,
  projectId: string
): Promise<{ project?: Project; brief?: CreativeBrief; response?: NextResponse }> {
  const projectResult = await getProject(supabase, user, projectId);

  if (projectResult.response || !projectResult.project) {
    return projectResult;
  }

  const { data } = await supabase
    .from("creative_briefs")
    .select("*")
    .eq("project_id", projectResult.project.id)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  const brief = ((data || [])[0] as CreativeBrief | undefined) || null;

  if (!brief?.unlock_generation) {
    return {
      response: NextResponse.json(
        { error: "Complete and pass the Creative Gate to unlock this section." },
        { status: 403 }
      )
    };
  }

  return { project: projectResult.project, brief };
}
