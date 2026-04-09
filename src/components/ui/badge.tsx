import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex min-h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2.5 py-1 text-xs font-medium whitespace-nowrap text-center transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/** ~+10% sobre el badge estándar en viewports &lt; md; en `md+` el tamaño base del badge. */
export const tagBadgeResponsiveClassName =
  "text-[0.825rem] min-h-[1.375rem] gap-[0.275rem] px-[0.6875rem] py-[0.275rem] md:text-xs md:min-h-5 md:gap-1 md:px-2.5 md:py-1 [&>svg]:size-[0.825rem] md:[&>svg]:size-3";

/** Tags compactos en filas densas (p. ej. lista de gastos), misma regla responsive. */
export const tagBadgeCompactResponsiveClassName =
  "h-[1.1rem] px-[7px] py-0 text-[11px] md:h-4 md:px-1.5 md:text-[10px]";

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
