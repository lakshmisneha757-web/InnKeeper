import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl border bg-white px-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-300 outline-none transition-colors",
          "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
          hasError ? "border-red-300" : "border-slate-200",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
