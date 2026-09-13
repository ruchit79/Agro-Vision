import React, { useState, useEffect } from "react"
import { Sun, CloudRain, Droplets, Thermometer, Wind, AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"
import styles from "./weather-card.module.css"

export const AgriWeather: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState({
    temp: 28,
    humidity: 65,
    rainProb: 15,
    wind: 12,
    soilMoisture: 42
  })

  // Simulate subtle weather fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        temp: prev.temp + (Math.random() - 0.5) * 0.5,
        humidity: Math.min(100, Math.max(0, prev.humidity + (Math.random() - 0.5) * 1))
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const getTip = () => {
    if (data.humidity > 70) return t('tip_hum');
    if (data.temp > 35) return t('tip_heat');
    if (data.soilMoisture < 30) return t('tip_dry');
    return t('tip_stable');
  }

  return (
    <div className={styles.weatherDashboard}>
      <div className={styles.topRow}>
        <div className={styles.mainInfo}>
          <div className={styles.tempSection}>
            <Sun className={styles.mainIcon} />
            <div>
              <span className={styles.tempValue}>{data.temp.toFixed(1)}°C</span>
              <p className={styles.condition}>Sunny Intermittent</p>
            </div>
          </div>
          <div className={styles.location}>
            <p className={styles.region}>Central Farm Zone</p>
            <p className={styles.status}>Optimal Production Environment</p>
          </div>
        </div>

        <div className={styles.vitalStats}>
          <div className={styles.vitalItem}>
            <Droplets size={16} className={styles.vIcon} />
            <div className={styles.vContent}>
              <p className={styles.vLabel}>{t('humidity')}</p>
              <p className={styles.vValue}>{data.humidity.toFixed(0)}%</p>
            </div>
          </div>
          <div className={styles.vitalItem}>
            <CloudRain size={16} className={styles.vIcon} />
            <div className={styles.vContent}>
              <p className={styles.vLabel}>{t('rain_chance')}</p>
              <p className={styles.vValue}>{data.rainProb}%</p>
            </div>
          </div>
          <div className={styles.vitalItem}>
            <Wind size={16} className={styles.vIcon} />
            <div className={styles.vContent}>
              <p className={styles.vLabel}>{t('wind')}</p>
              <p className={styles.vValue}>{data.wind} km/h</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.soilStatus}>
        <div className={styles.soilHeader}>
          <div className={styles.soilLabel}>
            <Thermometer size={14} />
            <span>{t('soil_moisture')}</span>
          </div>
          <span className={styles.soilValue}>{data.soilMoisture}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div 
            className={styles.progressBar} 
            style={{ width: `${data.soilMoisture}%` }}
          ></div>
        </div>
      </div>

      <div className={styles.tipCard}>
        <AlertTriangle size={18} className={styles.tipIcon} />
        <p className={styles.tipText}>{getTip()}</p>
      </div>
    </div>
  )
}
