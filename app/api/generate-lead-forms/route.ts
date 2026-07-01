import { generateAndSave } from "@/app/api/_lib/generation";

export async function POST(request: Request) {
  return generateAndSave(request, {
    outputType: "lead_forms",
    routeLabel: "Lead form generation",
    task: `
Generate conversion assets for lead capture and WhatsApp follow-up. Use the buyer tension, emotional trigger, objection, and desired action from the Creative Gate.
Qualification questions should be practical for real estate marketers and brokers.
`,
    shape: `
{
  "lead_form_headline": "",
  "lead_form_description": "",
  "qualification_questions": [],
  "whatsapp_first_message": "",
  "auto_reply_message": "",
  "follow_up_24h": "",
  "follow_up_3d": ""
}
`
  });
}
