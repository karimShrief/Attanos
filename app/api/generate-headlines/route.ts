import { generateAndSave } from "@/app/api/_lib/generation";

export async function POST(request: Request) {
  return generateAndSave(request, {
    outputType: "headlines",
    routeLabel: "Headline generation",
    task: `
Generate grouped real estate campaign headline options. Each headline must be anchored in the Creative Gate and project facts. Avoid unsupported claims and lazy luxury language.
Return 3-5 options per angle where possible.
`,
    shape: `
{
  "luxury_angle": [
    { "headline": "", "why_it_works": "" }
  ],
  "investment_angle": [],
  "lifestyle_angle": [],
  "family_angle": [],
  "location_angle": [],
  "trust_developer_angle": [],
  "minimal_editorial_angle": [],
  "direct_response_angle": [],
  "arabic_or_bilingual_variation": []
}
`
  });
}
