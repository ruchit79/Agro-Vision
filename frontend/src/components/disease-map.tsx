import React, { useEffect, useState } from "react"
import { Map as MapIcon, Loader2, AlertCircle } from "lucide-react"
import styles from "./disease-map.module.css"
import { API_BASE } from "../config"

interface Hotspots {
  [key: string]: number
}

interface CommunityData {
  hotspots: Hotspots
  recentReports: any[]
}

export const DiseaseMap: React.FC<{ token: string }> = ({ token }) => {
  const [data, setData] = useState<CommunityData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCommunityData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/analyze/community-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const d = await response.json()
        setData(d)
      }
    } catch (err) {
      console.error("Failed to fetch community data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommunityData()
  }, [token])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <MapIcon size={20} className={styles.icon} />
          <h2 className={styles.title}>Regional Hotspots</h2>
        </div>
        <p className={styles.subtitle}>Community Detection Trends</p>
      </div>

      <div className={styles.mapArea}>
        {/* Animated Abstract Map Representation */}
        <div className={styles.abstractMap}>
          <div className={`${styles.pulseDot} ${styles.dot1}`}></div>
          <div className={`${styles.pulseDot} ${styles.dot2}`}></div>
          <div className={`${styles.pulseDot} ${styles.dot3}`}></div>
          <div className={`${styles.pulseDot} ${styles.dot4}`}></div>
          <div className={styles.gridLines}></div>
        </div>

        {loading ? (
          <div className={styles.overlay}>
            <Loader2 className={styles.spinning} />
          </div>
        ) : (
          <div className={styles.statsPanel}>
            {data && Object.keys(data.hotspots).length > 0 ? (
              <div className={styles.hotspotList}>
                {Object.entries(data.hotspots).map(([disease, count]) => (
                  <div key={disease} className={styles.hotspotItem}>
                    <span className={styles.diseaseName}>{disease}</span>
                    <div className={styles.countBadge}>
                      <span className={styles.countValue}>{count}</span>
                      <span className={styles.countLabel}>clusters</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyPrompt}>
                <AlertCircle size={24} />
                <p>Establishing community connection...</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot}></span>
          LIVE DATA
        </div>
        <button onClick={fetchCommunityData} className={styles.refreshBtn}>
          Sync Network
        </button>
      </div>
    </div>
  )
}
