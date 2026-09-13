"use client"

import { AlertTriangle, X } from "lucide-react"
import styles from "./error-alert.module.css"

interface ErrorAlertProps {
  message: string
  onClose: () => void
}

export function ErrorAlert({ message, onClose }: ErrorAlertProps) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <AlertTriangle />
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>Something went wrong</h3>
        <p className={styles.message}>{message}</p>
      </div>

      <button onClick={onClose} className={styles.closeButton}>
        <X />
      </button>
    </div>
  )
}
