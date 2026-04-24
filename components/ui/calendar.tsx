'use client'

import * as React from 'react'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'dropdown',
  buttonVariant = 'ghost',
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant']
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'bg-white p-3 border border-gray-200 rounded-xl shadow-xl',
        className,
      )}
      captionLayout={captionLayout}
      classNames={{
        months: 'flex gap-4 flex-col md:flex-row relative',
        month: 'flex flex-col w-full gap-4',
        nav: 'flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between',
        month_caption: 'flex items-center justify-center font-medium py-1',
        table: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none text-center',
        week: 'flex w-full mt-2',
        day: 'relative w-full h-full p-0 text-center flex justify-center items-center',
        day_button: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-8 p-0 font-normal aria-selected:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground'
        ),
        selected: 'bg-primary text-primary-foreground rounded-md',
        today: 'bg-accent text-accent-foreground rounded-md',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-20',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return (
              <ChevronLeftIcon className={cn('size-4', className)} {...props} />
            )
          }
          if (orientation === 'right') {
            return (
              <ChevronRightIcon
                className={cn('size-4', className)}
                {...props}
              />
            )
          }
          return (
            <ChevronDownIcon className={cn('size-4', className)} {...props} />
          )
        },
        ...props.components
      }}
      {...props}
    />
  )
}

export { Calendar }
