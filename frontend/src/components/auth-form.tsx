import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import styles from "./auth-form.module.css"
import logo from "../assets/logo.png"
import { API_BASE } from "../config"

interface AuthFormProps {
  isLoginMode: boolean
  onAuthSuccess: (token: string) => void
  switchMode: () => void
}

export const AuthForm: React.FC<AuthFormProps> = ({
  isLoginMode,
  onAuthSuccess,
  switchMode,
}) => {
  const { t } = useTranslation()
  const [gmail, setGmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const endpoint = isLoginMode
        ? `${API_BASE}/api/user/login`
        : `${API_BASE}/api/user/signup`

      const body = isLoginMode 
        ? JSON.stringify({ gmail, password })
        : JSON.stringify({ username, gmail, password })

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Authentication failed")

      onAuthSuccess(data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.backgroundAura}></div>
      <div className={styles.glassCard}>
        <div className={styles.logoSection}>
          <div className={styles.logoWrapper}>
            <img src={logo} alt="AgroVision Logo" className={styles.logo} />
          </div>
          <h1 className={styles.title}>AgroVision</h1>
          <p className={styles.subtitle}>
            {isLoginMode ? t('welcome_login') : t('welcome_signup')}
          </p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
            <button onClick={() => setError("")} className={styles.dismissBtn}>&times;</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLoginMode && (
            <div className={styles.inputGroup}>
              <label>{t('username')}</label>
              <input
                type="text"
                placeholder={t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLoginMode}
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label>{t('email')}</label>
            <input
              type="email"
              placeholder="e.g. farmer@agrovision.com"
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.labelRow}>
              <label>{t('password')}</label>
              {isLoginMode && <button type="button" className={styles.forgotPass}>Forgot?</button>}
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner}></span> : (isLoginMode ? t('login_btn') : t('signup_btn'))}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            {isLoginMode ? t('new_user') : t('existing_user')}
            <button onClick={switchMode} className={styles.switchBtn}>
              {isLoginMode ? t('switch_signup') : t('switch_login')}
            </button>
          </p>
        </div>
      </div>
      
      {/* Decorative floating elements */}
      <div className={`${styles.blob} ${styles.blob1}`}></div>
      <div className={`${styles.blob} ${styles.blob2}`}></div>
    </div>
  )
}
