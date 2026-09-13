import { Leaf, Brain } from "lucide-react"
import styles from "./loading-animation.module.css"

export function LoadingAnimation() {
  return (
    <div className={styles.container}>
      <div className={styles.animation}>
        <div className={styles.brain}>
          <Brain />
        </div>
        <div className={styles.orbit}>
          <div className={styles.leaf}>
            <Leaf />
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>AI Analysis in Progress</h3>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.dot}></div>
            <span>Processing image data...</span>
          </div>
          <div className={styles.step}>
            <div className={styles.dot}></div>
            <span>Running neural networks...</span>
          </div>
          <div className={styles.step}>
            <div className={styles.dot}></div>
            <span>Generating insights...</span>
          </div>
        </div>

        <div className={styles.progressBar}>
          <div className={styles.progress}></div>
        </div>
        <p className={styles.message}>This may take a few moments...</p>
      </div>
    </div>
  )
}
