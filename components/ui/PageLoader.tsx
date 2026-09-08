"use client"

import { BounceLoader } from "react-spinners"

interface PageLoaderProps {
  color?: string
  size?: number
  overlay?: boolean
  className?: string
}

export function PageLoader({ color = "#2563eb", size = 60, overlay = true, className = "" }: PageLoaderProps) {
  const loader = (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <BounceLoader color={color} size={size} />
    </div>
  )

  if (overlay) {
    return (
      <div className={`fixed inset-0 z-50 bg-white/80 backdrop-blur-[1px] ${className}`}>
        {loader}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {loader}
    </div>
  )
}
