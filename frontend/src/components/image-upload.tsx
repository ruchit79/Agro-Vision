"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Upload, ImageIcon } from "lucide-react"
import styles from "./image-upload.module.css"

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  previewUrl: string
  isAnalyzing: boolean
}

export function ImageUpload({ onImageSelect, previewUrl, isAnalyzing }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
        return
      }
      onImageSelect(file)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      onImageSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <ImageIcon className={styles.headerIcon} />
        </div>
        <h2 className={styles.title}>Upload Plant Image</h2>
      </div>

      {!previewUrl ? (
        <div
          className={`${styles.dropzone} ${isDragging ? styles.dragging : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className={styles.uploadIcon}>
            <Upload />
          </div>
          <div className={styles.uploadText}>
            <p className={styles.primaryText}>
              <span className={styles.highlight}>Click to upload</span> or drag and drop
            </p>
            <p className={styles.secondaryText}>PNG, JPG, JPEG up to 10MB</p>
          </div>
        </div>
      ) : (
        <div className={styles.preview}>
          <div className={styles.imageWrapper}>
            <img src={previewUrl || "/placeholder.svg"} alt="Selected plant" className={styles.image} />
            {isAnalyzing && (
              <div className={styles.overlay}>
                <div className={styles.overlayContent}>
                  <div className={styles.overlaySpinner}></div>
                  <p>Processing...</p>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing} className={styles.changeButton}>
            <ImageIcon className={styles.buttonIcon} />
            Choose Different Image
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
      />
    </div>
  )
}
