import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base
          "flex h-[48px] w-full rounded-xl px-4 py-2 text-[15px]",
          // Colours — uses ENB-tinted border
          "border border-[#DDE8DE] bg-white text-[#1B2B1E]",
          "placeholder:text-[#80997F]",
          // File input
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          // Focus — ENB green ring
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A6B3C]/30 focus-visible:border-[#1A6B3C]/60",
          // Transition
          "transition-all duration-150",
          // States
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F3F6F3]",
          "read-only:bg-[#F3F6F3] read-only:cursor-default",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
