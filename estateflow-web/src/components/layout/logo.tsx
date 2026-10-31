import { EstateFlowLogo } from "@/components/brand/estateflow-logo";

/**
 * Backwards-compatible wrapper for the shared EstateFlow brand component.
 * New code should import `EstateFlowLogo` from `@/components/brand/estateflow-logo`.
 */
export function Logo({
  compact = false,
  href = "/dashboard",
  className,
}: {
  compact?: boolean;
  href?: string;
  wordmarkClassName?: string;
  className?: string;
}) {
  return (
    <EstateFlowLogo
      variant={compact ? "symbol" : "compact"}
      height={compact ? 32 : 34}
      href={href}
      className={className}
    />
  );
}
