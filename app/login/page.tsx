import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="grid w-full max-w-5xl gap-8 md:grid-cols-[1fr_0.9fr] md:items-center">
        <div className="space-y-7">
          <div>
            <p className="mb-4 text-sm font-semibold text-brass">Private access only.</p>
            <h1 className="font-display text-5xl text-parchment md:text-7xl">ATTANOS</h1>
            <p className="mt-5 max-w-xl text-xl leading-8 text-parchment/78">
              Bring the idea. ATTANOS builds the campaign.
            </p>
            <p className="mt-3 max-w-xl text-base leading-7 text-parchment/62">
              ATTANOS is a private campaign studio for real estate marketers.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-parchment/62 sm:grid-cols-3">
            <div className="border-l border-brass/40 pl-4">Human strategy first</div>
            <div className="border-l border-brass/40 pl-4">AI execution second</div>
            <div className="border-l border-brass/40 pl-4">Campaign assets saved</div>
          </div>
        </div>
        <div className="luxury-panel rounded-lg p-6 md:p-8">
          <div className="mb-7">
            <h2 className="font-display text-3xl text-parchment">Command Room Login</h2>
            <p className="mt-2 text-sm leading-6 text-parchment/60">
              Access is private and invite-only. The first user is created manually in Supabase Auth.
            </p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
