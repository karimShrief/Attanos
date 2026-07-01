import type { CreativeBrief, ProjectStatus } from "@/types/app";

export function getProjectStatus(brief?: CreativeBrief | null): ProjectStatus {
  if (!brief || brief.idea_score === null) {
    return "Locked";
  }

  if (brief.unlock_generation) {
    return "Unlocked";
  }

  return "Needs stronger idea";
}

export function statusClassName(status: ProjectStatus) {
  if (status === "Unlocked") {
    return "border-jade/50 bg-jade/10 text-[#b8e7d4]";
  }

  if (status === "Needs stronger idea") {
    return "border-oxide/60 bg-oxide/10 text-[#f0b49d]";
  }

  return "border-brass/30 bg-brass/10 text-brass";
}
