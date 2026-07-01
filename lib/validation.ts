import type { BriefFormState } from "@/types/app";

const requiredFields: Array<{
  key: keyof BriefFormState;
  label: string;
  min: number;
}> = [
  { key: "big_idea", label: "Big Idea", min: 20 },
  { key: "tension", label: "Tension", min: 20 },
  { key: "emotional_trigger", label: "Emotional Trigger", min: 10 },
  { key: "buyer_objection", label: "Buyer Objection", min: 10 },
  { key: "campaign_angle", label: "Campaign Angle", min: 5 },
  { key: "desired_action", label: "Desired Action", min: 5 }
];

export function validateBriefInput(brief: BriefFormState) {
  const errors: string[] = [];

  requiredFields.forEach(({ key, label, min }) => {
    const value = brief[key].trim();

    if (!value) {
      errors.push(`${label} is required.`);
      return;
    }

    if (value.length < min) {
      errors.push(`${label} must be at least ${min} characters.`);
    }
  });

  return errors;
}

export const genericPhraseList = [
  "luxury",
  "premium",
  "exclusive",
  "dream home",
  "unmatched",
  "elevated living",
  "perfect lifestyle",
  "where comfort meets elegance",
  "your future awaits",
  "limited opportunity",
  "iconic",
  "world-class"
];

export function findGenericPhrases(input: string) {
  const normalized = input.toLowerCase();

  return genericPhraseList.filter((phrase) => normalized.includes(phrase));
}

export function isObviouslyGenericBrief(brief: BriefFormState) {
  const combined = Object.values(brief).join(" ").toLowerCase();
  const genericPhraseCount = findGenericPhrases(combined).length;
  const buyerSpecificitySignals = [
    "family",
    "families",
    "investor",
    "investors",
    "end user",
    "buyer",
    "privacy",
    "commute",
    "school",
    "yield",
    "rental",
    "trust",
    "developer",
    "objection",
    "status",
    "calm",
    "nature",
    "city"
  ].filter((signal) => combined.includes(signal)).length;

  return genericPhraseCount >= 3 && buyerSpecificitySignals < 3;
}
