"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disableFuture?: boolean
  className?: string
}

export function DatePicker({ 
  date: propDate, 
  onDateChange, 
  placeholder = "Pick a date", 
  disableFuture = true,
  className 
}: DatePickerProps) {
  const [internalDate, setInternalDate] = React.useState<Date | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  
  const date = propDate ?? internalDate
  
  const handleDateChange = (newDate: Date | null) => {
    if (onDateChange) {
      onDateChange(newDate || undefined)
    } else {
      setInternalDate(newDate)
    }
    setIsOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            data-empty={!date}
            className="data-[empty=true]:text-muted-foreground w-[260px] justify-start text-left font-normal gap-2 hover:bg-accent hover:text-accent-foreground"
          >
            <CalendarIcon className="size-4 opacity-70" />
            {date ? (
              <span className="tabular-nums">{format(date, "PPP")}</span>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
          <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            <ReactDatePicker
              selected={date}
              onChange={handleDateChange}
              inline
              maxDate={disableFuture ? new Date() : undefined}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              yearDropdownItemNumber={15}
              scrollableYearDropdown
              className="react-datepicker-custom"
            />
          </div>
        </PopoverContent>
      </Popover>
      
      <style jsx global>{`
        .react-datepicker {
          font-family: inherit;
          border: none;
          background-color: transparent;
        }
        
        .react-datepicker__header {
          background-color: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
          border-radius: 0;
          padding: 0.75rem;
        }
        
        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker-year-header {
          color: hsl(var(--foreground));
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .react-datepicker__day-name,
        .react-datepicker__day,
        .react-datepicker__time-name {
          color: hsl(var(--foreground));
          display: inline-block;
          width: 2rem;
          line-height: 2rem;
          text-align: center;
          margin: 0.166rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }
        
        .react-datepicker__day:hover,
        .react-datepicker__month-text:hover,
        .react-datepicker__quarter-text:hover,
        .react-datepicker__year-text:hover {
          background-color: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }
        
        .react-datepicker__day--selected,
        .react-datepicker__day--in-selecting-range,
        .react-datepicker__day--in-range,
        .react-datepicker__month-text--selected,
        .react-datepicker__month-text--in-selecting-range,
        .react-datepicker__month-text--in-range,
        .react-datepicker__quarter-text--selected,
        .react-datepicker__quarter-text--in-selecting-range,
        .react-datepicker__quarter-text--in-range,
        .react-datepicker__year-text--selected,
        .react-datepicker__year-text--in-selecting-range,
        .react-datepicker__year-text--in-range {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        
        .react-datepicker__day--today {
          background-color: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
          font-weight: 600;
        }
        
        .react-datepicker__day--outside-month {
          color: hsl(var(--muted-foreground));
        }
        
        .react-datepicker__day--disabled {
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .react-datepicker__navigation {
          top: 0.75rem;
          line-height: 1.7rem;
          border: none;
          border-radius: 0.375rem;
          width: 1.5rem;
          height: 1.5rem;
          text-align: center;
          cursor: pointer;
          background-color: transparent;
        }
        
        .react-datepicker__navigation:hover {
          background-color: hsl(var(--accent));
        }
        
        .react-datepicker__navigation-icon::before {
          border-color: hsl(var(--foreground));
          border-style: solid;
          border-width: 2px 2px 0 0;
          content: "";
          display: block;
          height: 7px;
          position: absolute;
          top: 6px;
          width: 7px;
        }
        
        .react-datepicker__navigation--previous .react-datepicker__navigation-icon::before {
          transform: rotate(225deg);
          right: 7px;
        }
        
        .react-datepicker__navigation--next .react-datepicker__navigation-icon::before {
          transform: rotate(45deg);
          left: 7px;
        }
        
        .react-datepicker__month-dropdown,
        .react-datepicker__year-dropdown {
          background-color: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 0.375rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
        
        .react-datepicker__month-option,
        .react-datepicker__year-option {
          padding: 0.5rem;
          color: hsl(var(--foreground));
        }
        
        .react-datepicker__month-option:hover,
        .react-datepicker__year-option:hover {
          background-color: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }
        
        .react-datepicker__month-option--selected,
        .react-datepicker__year-option--selected {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
      `}</style>
    </div>
  )
}