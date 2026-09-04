"use client"

import React from 'react'
import { AlertCircle, X } from 'lucide-react'
import { Button } from './button'

interface ErrorAlertProps {
  title?: string
  message: string
  onClose?: () => void
  show: boolean
}

export function ErrorAlert({ title = "Error", message, onClose, show }: ErrorAlertProps) {
  if (!show) return null

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onClose) {
      onClose()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose(e)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] flex flex-wrap items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-2xl border-2 border-red-500 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 p-6 pb-4 border-b border-red-200 bg-red-50">
          <div className="flex-shrink-0">
            <div className="flex flex-wrap items-center justify-center w-12 h-12 bg-red-100 rounded-full">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900">{title}</h3>
          </div>
          {onClose && (
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 rounded-full hover:bg-red-100 transition-colors"
              type="button"
            >
              <X className="w-5 h-5 text-red-600" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-3 p-6 pt-4 border-t border-gray-200 bg-gray-50">
          {onClose && (
            <Button
              onClick={handleClose}
              variant="default"
              className="bg-red-600 hover:bg-red-700 text-white px-6"
              type="button"
            >
              Entendido
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
