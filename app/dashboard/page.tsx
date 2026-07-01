import { CalendarDays, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { StatusBadge } from "@/components/status-badge";
import { getDisplayName } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { getProjectStatus } from "@/lib/status";
import type { CreativeBrief, Profile, Project } from "@/types/app";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = getDisplayName((profileRow as Profile | null) || null, user);

  const { data: projectRows } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const projects = (projectRows || []) as Project[];
  const projectIds = projects.map((project) => project.id);
  let latestBriefs = new Map<string, CreativeBrief>();

  if (projectIds.length) {
    const { data: briefRows } = await supabase
      .from("creative_briefs")
      .select("*")
      .in("project_id", projectIds)
      .order("updated_at", { ascending: false });

    latestBriefs = new Map();
    ((briefRows || []) as CreativeBrief[]).forEach((brief) => {
      if (!latestBriefs.has(brief.project_id)) {
        latestBriefs.set(brief.project_id, brief);
      }
    });
  }

  return (
    <main className="min-h-screen px-5 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-brass/16 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold text-brass">ATTANOS</p>
            <h1 className="font-display text-4xl text-parchment md:text-6xl">
              Welcome back, {displayName}.
            </h1>
            <p className="mt-4 text-lg text-parchment/72">
              Bring the idea. ATTANOS builds the campaign.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary" href="/dashboard/new">
              <Plus aria-hidden="true" size={18} />
              Create Campaign
            </Link>
            <Link className="btn-secondary" href="/settings/profile">
              <Settings aria-hidden="true" size={18} />
              Profile
            </Link>
            <LogoutButton />
          </div>
        </header>

        <section className="py-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-parchment">Recent Projects</h2>
              <p className="mt-2 text-sm text-parchment/58">
                A private AI command room for real estate marketers.
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="luxury-panel rounded-lg p-8">
              <h3 className="font-display text-3xl text-parchment">
                Create your first campaign to begin.
              </h3>
              <p className="mt-3 max-w-2xl leading-7 text-parchment/68">
                Start by creating your first campaign. Add the property intelligence, complete the
                Creative Gate, then unlock AI campaign assets.
              </p>
              <Link className="btn-primary mt-6" href="/dashboard/new">
                <Plus aria-hidden="true" size={18} />
                Create Campaign
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => {
                const status = getProjectStatus(latestBriefs.get(project.id));

                return (
                  <Link
                    className="rounded-lg border border-brass/16 bg-parchment/[0.035] p-5 transition hover:border-brass/50 hover:bg-parchment/[0.06]"
                    href={`/projects/${project.id}`}
                    key={project.id}
                  >
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-2xl text-parchment">{project.name}</h3>
                        <p className="mt-1 text-sm text-parchment/55">
                          {project.developer || "Developer not set"}
                        </p>
                      </div>
                      <StatusBadge status={status} />
                    </div>
                    <dl className="grid gap-3 text-sm text-parchment/68">
                      <div>
                        <dt className="text-parchment/42">Location</dt>
                        <dd>{project.location || "Not set"}</dd>
                      </div>
                      <div>
                        <dt className="text-parchment/42">Language</dt>
                        <dd>{project.language || "English"}</dd>
                      </div>
                      <div className="flex items-center gap-2 text-parchment/50">
                        <CalendarDays aria-hidden="true" size={15} />
                        <span>{formatDate(project.created_at)}</span>
                      </div>
                    </dl>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
