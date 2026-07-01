import { generateAndSave } from "@/app/api/_lib/generation";

export async function POST(request: Request) {
  return generateAndSave(request, {
    outputType: "scripts",
    routeLabel: "Script generation",
    task: `
Generate real estate video, broker, and sales scripts. Scripts must use the Creative Gate as strategic direction and keep claims realistic.
Use concise spoken language. Include CTA only when it matches the desired action.
`,
    shape: `
{
  "reel_15s": "",
  "reel_30s": "",
  "broker_voice_note": "",
  "sales_call_opening": "",
  "client_follow_up": "",
  "property_walkthrough": ""
}
`
  });
}
