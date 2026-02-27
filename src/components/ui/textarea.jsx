import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    (<textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-[#A1D6E2] bg-[#A1D6E2] px-3 py-2 text-base text-slate-900 shadow-sm placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A1D6E2] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
