/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from "react"
import { ImageUpload } from "./components/image-upload"
import { ResultCard } from "./components/result-cards"
import { LoadingAnimation } from "./components/loading-animation"
import { ErrorAlert } from "./components/error-alert"
import { Header } from "./components/header"
import { StatsCards } from "./components/stats-cards"
import { AuthForm } from "./components/auth-form"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { HistoryList } from "./components/history-list"
import { ChatBot } from "./components/chat-bot"
import { DiseaseMap } from "./components/disease-map"
import styles from "./App.module.css"

import { API_BASE } from "./config"

export interface AnalysisResult {
  _id?: string
  plant: string
  disease: string
  confidence: number
  description: string
  treatment: string
  cause?: string
  precaution?: string
  pdfUrl: string
  createdAt?: string
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"))
  const [isLoginMode, setIsLoginMode] = useState(true)

  const handleAuthSuccess = (jwtToken: string) => {
    localStorage.setItem("token", jwtToken)
    setToken(jwtToken)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setToken(null)
  }

  if (!token) {
    return (
      <AuthForm
        isLoginMode={isLoginMode}
        onAuthSuccess={handleAuthSuccess}
        switchMode={() => setIsLoginMode(!isLoginMode)}
      />
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard token={token} onLogout={handleLogout} />} />
        <Route path="/chat" element={<ChatPage token={token} onLogout={handleLogout} />} />
      </Routes>
    </BrowserRouter>
  )
}

import { ChatSidebar } from "./components/chat-sidebar"

/* -------------------------- CHAT PAGE -------------------------- */
function ChatPage({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)

  return (
    <div className={styles.container} style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header onLogout={onLogout} />
      
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ChatSidebar 
          token={token} 
          onSelectThread={(id) => setCurrentThreadId(id)}
          onNewChat={() => {
            setCurrentThreadId(null)
            setResetKey(prev => prev + 1)
          }}
          currentThreadId={currentThreadId}
        />
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <ChatBot 
            key={`${currentThreadId || 'new'}-${resetKey}`}
            token={token} 
            isFullPage={true} 
            threadId={currentThreadId}
            onThreadCreated={(id) => setCurrentThreadId(id)}
          />
        </div>
      </main>
    </div>
  )
}

/* -------------------------- DASHBOARD -------------------------- */
function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const { t } = useTranslation()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string>("")
  
  // History State
  const [history, setHistory] = useState<AnalysisResult[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`${API_BASE}/api/analyze/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (err) {
      console.error("Failed to fetch history:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [token])

  const handleImageSelect = (file: File) => {
    setSelectedImage(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
    setError("")
  }

  const handleDownloadReport = async (pdfUrl: string, fileName: string) => {
    try {
      const response = await fetch(`${API_BASE}${pdfUrl}`)
      if (!response.ok) throw new Error("Download failed")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error downloading report:", err)
      alert("Failed to download report. Please try again.")
    }
  }

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError("Please select an image first")
      return
    }

    setIsAnalyzing(true)
    setError("")
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("image", selectedImage)

      const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      })
      const uploadData = await uploadResponse.json()
      if (!uploadResponse.ok) throw new Error(uploadData.error || "Image upload failed")

      const analyzeResponse = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ filePath: uploadData.filePath }),
      })

      const resultData = await analyzeResponse.json()
      if (!analyzeResponse.ok) throw new Error(resultData.error || "Analysis failed")

      setResult(resultData)
      fetchHistory() // ✅ Refresh history after successful analysis
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setSelectedImage(null)
    setPreviewUrl("")
    setResult(null)
    setError("")
  }

  const handleDeleteDiagnosis = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this analysis result?")) return
    try {
      const response = await fetch(`${API_BASE}/api/analyze/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        fetchHistory()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete")
      }
    } catch (err) {
      console.error(err)
      setError("Connection error during deletion")
    }
  }

  return (
    <div className={styles.container}>
      <Header onLogout={onLogout} />

      <main className={styles.main}>
        <div className={styles.content}>
          <StatsCards />
          {error && <ErrorAlert message={error} onClose={() => setError("")} />}
          
          <div className={styles.grid}>
            {/* Left: Upload & Active Analysis */}
            <div className={styles.mainColumn}>
              <div className={styles.uploadSection}>
                <ImageUpload
                  onImageSelect={handleImageSelect}
                  previewUrl={previewUrl}
                  isAnalyzing={isAnalyzing}
                />

                <div className={styles.buttonGroup}>
                  <button
                    onClick={handleAnalyze}
                    disabled={!selectedImage || isAnalyzing}
                    className={`${styles.analyzeButton} ${isAnalyzing ? styles.analyzing : ""}`}
                  >
                    {isAnalyzing ? t('analyzing') : t('analyze_btn')}
                  </button>

                  <button onClick={handleReset} className={styles.resetButton}>
                    {t('reset')}
                  </button>
                </div>
              </div>

              {/* Active Results Area */}
              <div className={styles.resultsSection}>
                {isAnalyzing && <LoadingAnimation />}
                {result && !isAnalyzing && <ResultCard result={result} />}
                {!result && !isAnalyzing && (
                  <div className={styles.emptyState}>
                    <h3>{t('ready_title')}</h3>
                    <p>{t('ready_desc')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: History List */}
            <div className={styles.sideColumn}>
              <HistoryList 
                history={history} 
                onDownload={handleDownloadReport} 
                onDelete={handleDeleteDiagnosis}
                loading={loadingHistory}
              />
              <div style={{ marginTop: "2rem" }}>
                <DiseaseMap token={token} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <ChatBot token={token} />
    </div>
  )
}
