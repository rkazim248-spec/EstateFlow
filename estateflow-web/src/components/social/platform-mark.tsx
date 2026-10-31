import { PLATFORM_COLORS, PLATFORM_MARKS } from "@/lib/social";
import { cn } from "@/lib/cn";

export function PlatformMark({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] font-bold lowercase tracking-tight text-white",
        className,
      )}
      style={{ backgroundColor: PLATFORM_COLORS[id] ?? "#4b5057" }}
    >
      {PLATFORM_MARKS[id] ?? id.slice(0, 2)}
    </span>
  );
}
