import { Star } from 'lucide-react'
import styles from './StarRating.module.css'

export default function StarRating({ rating = 0, maxRating = 5, size = 16, interactive = false, onChange }) {
  return (
    <div className={styles.stars} role={interactive ? 'radiogroup' : undefined} aria-label={`${rating} étoiles sur ${maxRating}`}>
      {Array.from({ length: maxRating }, (_, i) => (
        <button
          key={i}
          type={interactive ? 'button' : undefined}
          className={`${styles.star} ${i < rating ? styles.filled : ''}`}
          onClick={interactive && onChange ? () => onChange(i + 1) : undefined}
          aria-label={interactive ? `${i + 1} étoile${i > 0 ? 's' : ''}` : undefined}
          disabled={!interactive}
          style={{ '--size': `${size}px` }}
        >
          <Star size={size} />
        </button>
      ))}
    </div>
  )
}
