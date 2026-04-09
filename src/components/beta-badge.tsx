import { Badge } from "@/components/ui/badge";

export function BetaBadge() {
  return (
    <Badge
      variant="outline"
      className="h-5 shrink-0 border-muted-foreground/35 px-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
    >
      <span className="pl-[0.075rem] pt-0.5">BETA</span>
    </Badge>
  );
}
