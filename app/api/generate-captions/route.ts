import { generateAndSave } from "@/app/api/_lib/generation";

export async function POST(request: Request) {
  return generateAndSave(request, {
    outputType: "captions",
    routeLabel: "Caption generation",
    task: `
Generate platform-ready campaign captions for a real estate launch. Keep copy specific, human, and grounded in the Creative Gate.
Do not invent facts. If a detail is missing, keep the statement neutral.
`,
    shape: `
{
  "instagram_short": "",
  "instagram_medium": "",
  "linkedin_post": "",
  "whatsapp_broadcast": "",
  "story_text": "",
  "carousel_slide_copy": [
    { "slide": 1, "text": "" }
  ]
}
`
  });
}
