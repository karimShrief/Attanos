import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/app";

export function getDisplayName(profile: Profile | null | undefined, user: User | null | undefined) {
  const profileName = profile?.display_name?.trim();

  if (profileName) {
    return profileName;
  }

  const metadataName = user?.user_metadata?.full_name;

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  const emailPrefix = user?.email?.split("@")[0]?.trim();

  if (emailPrefix) {
    return emailPrefix;
  }

  return "there";
}
