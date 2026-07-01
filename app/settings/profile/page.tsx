import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { getDisplayName } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/app";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
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

  const profile = (profileRow as Profile | null) || null;
  const fallbackDisplayName = getDisplayName(null, user);
  const currentDisplayName = profile?.display_name?.trim() || "";
  const previewName = getDisplayName(profile, user);

  return (
    <main className="min-h-screen px-5 py-8 md:px-10">
      <div className="mx-auto max-w-3xl">
        <Link className="btn-secondary mb-8" href="/dashboard">
          <ArrowLeft aria-hidden="true" size={18} />
          Dashboard
        </Link>
        <header className="mb-8 border-b border-brass/16 pb-7">
          <p className="mb-3 text-sm font-semibold text-brass">Profile Settings</p>
          <h1 className="font-display text-4xl text-parchment md:text-6xl">
            Welcome back, {previewName}.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-parchment/68">
            Update the display name ATTANOS uses in the private command room.
          </p>
        </header>
        <section className="luxury-panel rounded-lg p-5 md:p-8">
          <ProfileForm
            email={user.email || "Unknown email"}
            fallbackDisplayName={fallbackDisplayName}
            initialDisplayName={currentDisplayName}
            userId={user.id}
          />
        </section>
      </div>
    </main>
  );
}
