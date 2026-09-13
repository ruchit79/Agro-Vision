import React from "react"
import { FileText, Calendar, Download, ChevronRight, Trash2 } from "lucide-react"
import styles from "./history-list.module.css"

interface HistoryItem {
  _id?: string
  plant: string
  disease: string
  confidence: string | number
  pdfUrl: string
  createdAt?: string
}

interface HistoryListProps {
  history: HistoryItem[]
  onDownload: (pdfUrl: string, fileName: string) => void
  onDelete: (id: string) => void
  loading: boolean
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onDownload, onDelete, loading }) => {
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Fetching your agricultural history...</p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📂</div>
        <h3>No Reports Yet</h3>
        <p>Your analysis history will appear here once you start scanning plants.</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <FileText size={20} className={styles.titleIcon} />
          Recent Analyses
        </h2>
        <span className={styles.count}>{history.length} Reports</span>
      </div>

      <div className={styles.list}>
        {history.map((item) => (
          <div key={item._id} className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.plantInfo}>
                <div className={styles.plantAvatar}>
                  {item.plant.charAt(0)}
                </div>
                <div>
                  <h4 className={styles.plantName}>{item.plant}</h4>
                  <div className={styles.dateInfo}>
                    <Calendar size={12} />
                    <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.diseaseBadge}>
                <span className={styles.diseaseLabel}>{item.disease}</span>
                <span className={styles.confidence}>{item.confidence}% match</span>
              </div>

              <div className={styles.actions}>
                <button 
                   onClick={() => onDownload(item.pdfUrl, `report-${item.plant}.pdf`)}
                   className={styles.downloadBtn}
                   title="Download Report"
                 >
                   <Download size={18} />
                 </button>
                <button 
                  onClick={() => item._id && onDelete(item._id)}
                  className={styles.deleteBtn}
                  title="Delete Result"
                >
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={20} className={styles.chevron} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
