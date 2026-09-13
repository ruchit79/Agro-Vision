"use client"

import {
  Download,
  Leaf,
  AlertTriangle,
  TrendingUp,
  FileText,
  Award
} from "lucide-react"
import type { AnalysisResult } from "../App"
import styles from "./result-card.module.css"

import { API_BASE } from "../config"

interface ResultCardProps {
  result: AnalysisResult
}

export function ResultCard({ result }: ResultCardProps) {
  const handleDownloadReport = () => {
    const fullUrl = `${API_BASE}${result.pdfUrl}`
    const link = document.createElement("a")
    link.href = fullUrl
    link.download = "report.pdf" 
    link.click()
  }

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 80) return "high"
    if (confidence >= 60) return "medium"
    return "low"
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <Award className={styles.confidenceIcon} />
    if (confidence >= 60) return <TrendingUp className={styles.confidenceIcon} />
    return <AlertTriangle className={styles.confidenceIcon} />
  }

  const confidenceLevel = getConfidenceLevel(result.confidence)

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Analysis Complete</h2>
        <button onClick={handleDownloadReport} className={styles.downloadButton}>
          <Download className={styles.buttonIcon} />
          Download Report
        </button>
      </div>

      {/* Plant Identification */}
      <div className={styles.plantCard}>
        <div className={styles.plantIcon}>
          <Leaf />
        </div>
        <div>
          <p className={styles.label}>Plant Identified</p>
          <p className={styles.plantName}>{result.plant}</p>
        </div>
      </div>

      {/* Disease and Confidence */}
      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <p className={styles.infoLabel}>Disease Detected</p>
          <p className={styles.infoValue}>{result.disease}</p>
        </div>

        <div className={styles.infoCard}>
          <p className={styles.infoLabel}>Confidence Level</p>
          <div className={`${styles.confidenceBadge} ${styles[confidenceLevel]}`}>
            {getConfidenceIcon(result.confidence)}
            <span>{result.confidence.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className={styles.descriptionCard}>
        <div className={styles.cardHeader}>
          <FileText className={styles.cardIcon} />
          <h3>Disease Description</h3>
        </div>
        <p className={styles.cardContent}>{result.description}</p>
      </div>

      {/* Treatment */}
      <div className={styles.treatmentCard}>
        <div className={styles.cardHeader}>
          <AlertTriangle className={styles.cardIcon} />
          <h3>Recommended Treatment</h3>
        </div>
        <p className={styles.cardContent}>{result.treatment}</p>
      </div>

      {/* Action Button */}
      <button onClick={handleDownloadReport} className={styles.fullReportButton}>
        <Download className={styles.buttonIcon} />
        Get Complete Report
      </button>
    </div>
  )
}
