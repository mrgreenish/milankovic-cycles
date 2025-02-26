import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef(({ className, variant = 'default', glowing = false, ...props }, ref) => {
  // Define variant-specific classes
  const variantClasses = {
    default: 'observatory-panel',
    control: 'control-panel',
    data: 'observatory-panel bg-opacity-50 border-aged-copper',
    info: 'observatory-panel bg-opacity-40 border-slate-blue',
  };

  return (
    <div
      ref={ref}
      className={cn(
        variantClasses[variant] || variantClasses.default,
        glowing && 'animate-glow',
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 px-4 py-2 border-b border-opacity-20 border-slate-blue", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-serif text-stardust-white",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-stardust-white opacity-80",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-4",
      className
    )}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } 