import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { CalendarIcon, ClockIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const DATE_TIME_TYPES = new Set(["date", "time", "datetime-local"]);

function isDateTimeType(type?: string) {
  return type != null && DATE_TIME_TYPES.has(type);
}

const inputClassName = (type?: string, className?: string) =>
  cn(
    "border-input file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm",
    isDateTimeType(type) && [
      "pr-9",
      "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
    ],
    className
  );

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  if (isDateTimeType(type)) {
    const Icon = type === "time" ? ClockIcon : CalendarIcon;

    return (
      <div className="relative w-full">
        <InputPrimitive
          type={type}
          data-slot="input"
          className={inputClassName(type, className)}
          {...props}
        />
        <Icon
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2"
        />
      </div>
    );
  }

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={inputClassName(type, className)}
      {...props}
    />
  );
}

export { Input };
