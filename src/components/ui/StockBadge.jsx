import styles from './StockBadge.module.css'

export default function StockBadge({ stock }) {
  if (stock === null || stock === undefined) return null

  if (stock === 0) {
    return <span className={`${styles.badge} ${styles.outOfStock}`}>Épuisé</span>
  }
  if (stock <= 5) {
    return <span className={`${styles.badge} ${styles.low}`}>Plus que {stock} !</span>
  }
  return <span className={`${styles.badge} ${styles.available}`}>En stock</span>
}
