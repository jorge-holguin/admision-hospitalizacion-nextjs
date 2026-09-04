"use client"

import { ChevronRight } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
}

const steps = [
  { id: 1, title: "Datos Básicos", description: "Información personal y RENIEC" },
  { id: 2, title: "Datos Adicionales", description: "Información complementaria" },
  { id: 3, title: "Datos Familiares", description: "Información familiar y acompañante" },
]

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between overflow-x-auto pb-1 mb-6 min-w-0">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep >= step.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            {step.id}
          </div>
          <div className="ml-3 hidden sm:block">
            <p className={`text-sm font-medium ${currentStep >= step.id ? "text-blue-600" : "text-gray-500"}`}>
              {step.title}
            </p>
            <p className="text-xs text-gray-400">{step.description}</p>
          </div>
          {index < steps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400 mx-4" />}
        </div>
      ))}
    </div>
  )
}
