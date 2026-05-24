"use client"

import { useEffect } from "react"

interface ErrorModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm?: () => void
  onClose: () => void
}

export default function ErrorModal({ open, title, message, confirmLabel, onConfirm, onClose }: ErrorModalProps) {
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
        {title !== "Success" && <div className="text-3xl text-red-500 mb-3 text-center">&#9888;</div>}
        <h3 className="text-lg font-semibold text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          {confirmLabel && onConfirm ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 font-medium text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-lg py-2 font-medium"
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-black dark:bg-white text-white dark:text-black rounded-lg py-2 font-medium"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
