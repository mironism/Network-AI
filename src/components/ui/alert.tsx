"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AlertProps = React.HTMLAttributes<HTMLDivElement>

export function Alert({ className, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "w-full rounded-lg border p-4 text-sm flex items-start gap-3",
        "border-gray-200 bg-white text-gray-800",
        className
      )}
      {...props}
    />
  )
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm text-gray-700", className)} {...props} />
}

export default Alert


