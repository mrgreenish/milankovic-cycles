"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({ className, value, defaultValue, onValueChange, ...props }, ref) => {
  // Ensure value and defaultValue are arrays
  const valueArray = Array.isArray(value) ? value : [value]
  const defaultValueArray = Array.isArray(defaultValue) ? defaultValue : [defaultValue]

  // Handle touch events to prevent them from being captured by the canvas
  const handleTouchStart = (e) => {
    // Stop propagation to prevent the touch event from reaching the canvas
    e.stopPropagation();
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={valueArray}
      defaultValue={defaultValueArray}
      onValueChange={onValueChange}
      onTouchStart={handleTouchStart}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full rounded-full celestial-slider">
        <SliderPrimitive.Range className="absolute h-full bg-antique-brass rounded-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full bg-antique-brass border-2 border-stardust-white shadow-[0_0_8px_hsla(var(--antique-brass),0.5)] hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing" />
    </SliderPrimitive.Root>
  )
})

Slider.displayName = SliderPrimitive.Root.displayName

export { Slider } 