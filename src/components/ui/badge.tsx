import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: BadgeVariant;
}) {
  const styles: Record<
    BadgeVariant,
    string
  > = {
    default:
      "bg-green-100 text-green-800",

    secondary:
      "bg-slate-100 text-slate-700",

    outline:
      "border border-slate-200 text-slate-700",

    success:
      "bg-green-100 text-green-800",

    warning:
      "bg-amber-100 text-amber-800",

    danger:
      "bg-red-100 text-red-700",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}