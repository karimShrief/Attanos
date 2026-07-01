# ATTANOS

ATTANOS is a private AI command room for real estate marketers.

Tagline: "Bring the idea. ATTANOS builds the campaign."

The MVP loop is:

Project -> Creative Gate -> AI Score -> Unlock -> Generate -> Save -> Reopen

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Supabase Storage bucket scaffold
- OpenAI API
- Vercel deployment

## Local Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/schema.sql`.
4. In Supabase Auth, enable email/password auth.
5. For the private trial, disable public signup in Supabase Auth settings if desired.
6. Manually create the owner's user in Supabase Auth.
7. Set the user's `full_name` metadata or update the in-app profile display name after login. For the MVP trial, this can be `Atta`.
8. Copy `.env.local.example` to `.env.local`.
9. Add the Supabase URL and anon key.
10. Add the Supabase service role key for future server-side admin needs. Do not expose it in client code.
11. Add the OpenAI API key.
12. Install dependencies.
13. Run the app locally.

```bash
npm install
npm run dev
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`:

```bash
npm.cmd install
npm.cmd run dev
```

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe for the browser.

`SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` must stay server-side only.

## Supabase Notes

The schema creates:

- `profiles`
- `projects`
- `creative_briefs`
- `outputs`
- `uploads`

RLS is enabled on all product tables. Project data uses `auth.uid() = user_id`. Profiles use `auth.uid() = id`.

The dashboard greeting uses this fallback order:

1. `profiles.display_name`
2. `auth.user.user_metadata.full_name`
3. The auth email before `@`
4. `there`

The schema also creates a private `project-uploads` Storage bucket. Future uploads should use this path pattern:

```text
{user_id}/{project_id}/{file_name}
```

## Private Trial Access

The UI only supports login. It does not expose public signup.

Recommended private trial setup:

1. Disable public signup in Supabase Auth settings.
2. Manually create the owner's email/password user.
3. Log in and open Profile settings to set `display_name` to `Atta`, or set the Supabase Auth `full_name` metadata before first login.
4. Give the owner the published Vercel URL and login credentials.

## Vercel Deployment

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Add all environment variables in Vercel Project Settings.
4. Deploy.
5. Use the free Vercel-generated `.vercel.app` URL for the trial.

No purchased domain is required.

## Owner Flow

1. Open the published website.
2. Log in with the manually created Supabase Auth user.
3. Land on the dashboard with the dynamic greeting, for example: "Welcome back, Atta."
4. Create a campaign.
5. Add property intelligence.
6. Open the project workspace.
7. Complete the Creative Gate.
8. ATTANOS evaluates the idea with OpenAI.
9. Weak ideas stay locked with recommendations.
10. Strong ideas unlock campaign generation.
11. Generate headlines, captions, scripts, lead forms, and proofreading outputs.
12. Outputs save automatically to Supabase.
13. Return later from any device and reopen saved projects and outputs.

## Verification

```bash
npm run lint
npm run build
```

Both commands should pass before deployment.
