"use client"

import { useEffect } from "react"

interface ErrorModalProps {
  open: boolean
  title: string
  message: string
  onClose: () => void
}

export default function ErrorModal({ open, title, message, onClose }: ErrorModalProps) {
  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose()
      }
      document.addEventListener("keydown", handler)
      return () => document.removeEventListener("keydown", handler)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="text-3xl text-red-500 mb-3 text-center">&#9888;</div>
        <h3 className="text-lg font-semibold text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-black dark:bg-white text-white dark:text-black rounded-lg py-2 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  )
}
