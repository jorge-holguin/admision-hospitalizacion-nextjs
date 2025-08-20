/**
 * Utility to hide the NextJS debugger panel in development mode
 */

export function hideNextJSDebugger() {
  if (typeof window !== 'undefined') {
    // Hide the nextjs-portal element that contains the debugger
    const style = document.createElement('style');
    style.textContent = `
      nextjs-portal {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}
