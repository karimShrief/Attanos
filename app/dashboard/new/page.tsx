import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProjectCreateForm } from "@/components/project-create-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-5 py-8 md:px-10">
      <div className="mx-auto max-w-5xl">
        <Link className="btn-secondary mb-8" href="/dashboard">
          <ArrowLeft aria-hidden="true" size={18} />
          Dashboard
        </Link>
        <header className="mb-8 border-b border-brass/16 pb-7">
          <p className="mb-3 text-sm font-semibold text-brass">New Campaign</p>
          <h1 className="font-display text-4xl text-parchment md:text-6xl">
            Create a real estate campaign.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-parchment/68">
            Add the property intelligence first. The Creative Gate will decide whether the idea is
            strong enough for AI generation.
          </p>
        </header>
        <section className="luxury-panel rounded-lg p-5 md:p-8">
          <ProjectCreateForm />
        </section>
      </div>
    </main>
  );
}
