"use client";

import { ArrowRight, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace(searchParams.get("next") || "/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium text-parchment" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="field"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="owner@example.com"
          required
          type="email"
          value={email}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-parchment" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="field"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Private password"
          required
          type="password"
          value={password}
        />
      </div>
      {error ? (
        <p className="rounded-md border border-oxide/50 bg-oxide/10 px-3 py-2 text-sm text-[#f0b49d]">
          {error}
        </p>
      ) : null}
      <button className="btn-primary w-full" disabled={loading} type="submit">
        <LockKeyhole aria-hidden="true" size={18} />
        {loading ? "Opening studio..." : "Enter ATTANOS"}
        <ArrowRight aria-hidden="true" size={18} />
      </button>
    </form>
  );
}
