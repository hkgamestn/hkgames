/**
 * Format Tunisian Dinar amount
 * @param {number} amount
 * @returns {string} e.g. "12,000 DT"
 */
export function formatDT(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '0,000 DT'
  return amount.toFixed(3).replace('.', ',') + ' DT'
}

export function parseDT(str) {
  if (!str) return 0
  return parseFloat(String(str).replace(',', '.')) || 0
}
