import { statusClassName } from "@/lib/status";
import type { ProjectStatus } from "@/types/app";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClassName(
        status
      )}`}
    >
      {status}
    </span>
  );
}
