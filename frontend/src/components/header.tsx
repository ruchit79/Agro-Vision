import { LogOut, LayoutDashboard, BotMessageSquare, Languages } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import styles from "./header.module.css"

interface HeaderProps {
  onLogout: () => void
}

export function Header({ onLogout }: HeaderProps) {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.navLinks}>
          <Link to="/" className={`${styles.navLink} ${location.pathname === '/' ? styles.active : ''}`}>
             <LayoutDashboard size={18} />
             <span>{t('dashboard')}</span>
          </Link>
          <Link to="/chat" className={`${styles.navLink} ${location.pathname === '/chat' ? styles.active : ''}`}>
             <BotMessageSquare size={18} />
             <span>{t('ai_assistant')}</span>
          </Link>
        </div>

        <div className={styles.topRight}>
          <div className={styles.langSelector}>
            <Languages size={16} className={styles.langIcon} />
            <select 
              value={i18n.language} 
              onChange={(e) => changeLanguage(e.target.value)}
              className={styles.select}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="gu">ગુજરાતી</option>
            </select>
          </div>

          <button onClick={onLogout} className={styles.logoutButton}>
            <LogOut size={16} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            <span className={styles.emoji}>🌱</span>
            AgroVision
          </h1>
          <p className={styles.subtitle}>{t('plant_exp')}</p>
          {location.pathname === '/' && (
            <p className={styles.description}>{t('upload_instruction')}</p>
          )}
        </div>
      </div>
    </header>
  )
}
