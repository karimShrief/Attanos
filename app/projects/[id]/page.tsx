import { notFound, redirect } from "next/navigation";
import { ProjectWorkspace } from "@/components/project-workspace";
import { createClient } from "@/lib/supabase/server";
import type { CampaignOutput, CreativeBrief, Project } from "@/types/app";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (projectError || !projectRow) {
    notFound();
  }

  const { data: projectRows } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: briefRows } = await supabase
    .from("creative_briefs")
    .select("*")
    .eq("project_id", id)
    .order("updated_at", { ascending: false })
    .limit(1);

  const { data: outputRows } = await supabase
    .from("outputs")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  return (
    <ProjectWorkspace
      initialBrief={((briefRows || [])[0] as CreativeBrief | undefined) || null}
      initialOutputs={(outputRows || []) as CampaignOutput[]}
      project={projectRow as Project}
      projects={(projectRows || []) as Project[]}
    />
  );
}
