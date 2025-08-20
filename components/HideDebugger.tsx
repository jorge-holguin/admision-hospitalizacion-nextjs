"use client"

import { useEffect } from 'react'

export function HideDebugger() {
  useEffect(() => {
    // Hide the nextjs-portal element that contains the debugger
    const style = document.createElement('style')
    style.textContent = `
      nextjs-portal {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `
    document.head.appendChild(style)
  }, [])

  // This component doesn't render anything
  return null
}
