"use client";

import { Save, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({
  userId,
  initialDisplayName,
  fallbackDisplayName,
  email
}: {
  userId: string;
  initialDisplayName: string;
  fallbackDisplayName: string;
  email: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const nextDisplayName = displayName.trim();
    const supabase = createClient();
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        display_name: nextDisplayName || null,
        role: "owner"
      },
      { onConflict: "id" }
    );

    setLoading(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    setNotice("Profile updated.");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-lg border border-brass/16 bg-ink/45 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md border border-brass/18 bg-parchment/[0.05] p-2 text-brass">
            <UserRound aria-hidden="true" size={20} />
          </div>
          <div>
            <p className="text-sm text-parchment/50">Signed in as</p>
            <p className="text-parchment">{email}</p>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-parchment">Display name</span>
        <input
          className="field"
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder={fallbackDisplayName}
          value={displayName}
        />
      </label>

      <p className="text-sm leading-6 text-parchment/56">
        This name appears in your ATTANOS greeting. If left blank, ATTANOS falls back to your auth
        name, email prefix, then <span className="font-semibold text-parchment">there</span>.
      </p>

      {notice ? (
        <p className="rounded-md border border-jade/40 bg-jade/10 px-3 py-2 text-sm text-[#b8e7d4]">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-oxide/50 bg-oxide/10 px-3 py-2 text-sm text-[#f0b49d]">
          {error}
        </p>
      ) : null}

      <button className="btn-primary" disabled={loading} type="submit">
        <Save aria-hidden="true" size={18} />
        {loading ? "Saving profile..." : "Save Profile"}
      </button>
    </form>
  );
}
