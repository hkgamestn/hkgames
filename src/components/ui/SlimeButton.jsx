import styles from './SlimeButton.module.css'

export default function SlimeButton({ children, variant = 'cta', size = 'md', onClick, type = 'button', disabled, className = '', ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
