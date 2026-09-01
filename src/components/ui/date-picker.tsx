"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatDate } from "@/lib/utils";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseISODate(value?: string): Date | undefined {
  if (!value) return undefined;
  const match = ISO_DATE.exec(value);
  if (!match) return undefined;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toISODateLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

type DatePickerProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange" | "min" | "max" | "size"
> & {
  value?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

function DatePicker({
  id,
  name,
  value: valueProp,
  defaultValue,
  onChange,
  min,
  max,
  required,
  disabled,
  placeholder = "Select date",
  className,
  autoFocus,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DatePickerProps) {
  const isControlled = valueProp !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? "");
  const value = isControlled ? (valueProp ?? "") : uncontrolled;
  const [open, setOpen] = React.useState(false);

  const selected = parseISODate(value);
  const minDate = parseISODate(min);
  const maxDate = parseISODate(max);

  const today = React.useMemo(() => new Date(), []);
  const startMonth = startOfMonth(
    minDate ?? new Date(today.getFullYear() - 20, 0, 1)
  );
  const endMonth = startOfMonth(
    maxDate ?? new Date(today.getFullYear() + 5, 11, 1)
  );

  const [month, setMonth] = React.useState<Date>(selected ?? today);

  function emitChange(next: string) {
    if (!isControlled) setUncontrolled(next);
    if (!onChange) return;
    onChange({
      target: { value: next, name: name ?? "", id: id ?? "" },
      currentTarget: { value: next, name: name ?? "", id: id ?? "" },
    } as React.ChangeEvent<HTMLInputElement>);
  }

  const disabledDays = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

  return (
    <div className="w-full min-w-0">
      {name ? (
        <input type="hidden" name={name} value={value} required={required} />
      ) : null}
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setMonth(selected ?? today);
        }}
      >
        <PopoverTrigger
          id={id}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-required={required || undefined}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          data-slot="date-picker-trigger"
          className={cn(
            "border-input dark:bg-input/30 flex h-8 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border bg-transparent px-2.5 py-1 text-base font-normal transition-colors outline-none select-none md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
            "disabled:bg-input/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 aria-invalid:ring-3",
            "data-popup-open:border-ring data-popup-open:ring-ring/50 data-popup-open:ring-3",
            className
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-left font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            {selected ? formatDate(selected) : placeholder}
          </span>
          <CalendarIcon
            aria-hidden
            className="text-muted-foreground size-4 shrink-0"
          />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="z-[70] w-[min(calc(100vw-2rem),18.5rem)] gap-0 p-2 shadow-sm sm:w-auto"
        >
          <Calendar
            mode="single"
            required
            selected={selected}
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => {
              if (!date) return;
              emitChange(toISODateLocal(date));
              setOpen(false);
            }}
            disabled={disabledDays}
            startMonth={startMonth}
            endMonth={endMonth}
            captionLayout="dropdown"
            className="w-full p-0 [--cell-size:--spacing(9)] sm:[--cell-size:--spacing(8)]"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DatePicker };
