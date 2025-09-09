"use client"

import React from 'react'
import { useMedicos } from '@/contexts/MedicosContext'

interface MedicoDisplayProps {
  code: string
}

export default function MedicoDisplay({ code }: MedicoDisplayProps) {
  const { getMedicoInfo } = useMedicos()
  
  if (!code) return <span>-</span>
  
  return <span>{getMedicoInfo(code)}</span>
}
