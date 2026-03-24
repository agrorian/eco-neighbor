import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base — all variants share this
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-all duration-150 outline-none select-none cursor-pointer " +
  "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "active:scale-[0.98] " +
  "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 " +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Default = ENB green — primary action
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-[#22854A]",
        // Outline = white with green border
        outline:
          "bg-background border-border hover:bg-[#F0F7F2] hover:border-[#1A6B3C]/60 hover:text-[#1A6B3C] text-foreground",
        // Secondary = soft green surface
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        // Ghost = transparent, subtle hover
        ghost:
          "hover:bg-[#F0F7F2] hover:text-[#1A6B3C] text-foreground/70",
        // Destructive = red
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        // Link = green underline
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Default is now comfortably tappable — 40px tall, proper padding
        default: "h-10 gap-2 px-4 text-sm",
        xs:      "h-7  gap-1 px-2.5 text-xs rounded-lg",
        sm:      "h-9  gap-1.5 px-3.5 text-[0.8rem] rounded-[10px]",
        lg:      "h-12 gap-2 px-6 text-base rounded-xl",
        xl:      "h-14 gap-2 px-8 text-base rounded-xl",
        icon:    "size-10 rounded-xl",
        "icon-xs":  "size-7  rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":  "size-9  rounded-[10px]",
        "icon-lg":  "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
