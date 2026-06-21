// Helpers navigateur pour l'attribution Meta.
// Lit les cookies _fbp / _fbc posés par le pixel de base, et reconstruit _fbc
// depuis le paramètre fbclid de l'URL s'il manque (cas in-app browser).

function getCookie(name) {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match('(^|;\\s*)' + name + '=([^;]*)')
  return m ? decodeURIComponent(m[2]) : null
}

// _fbc absent ? le reconstruire au format fb.1.<timestamp>.<fbclid>
function resolveFbc() {
  const existing = getCookie('_fbc')
  if (existing) return existing
  if (typeof location === 'undefined') return null
  const fbclid = new URLSearchParams(location.search).get('fbclid')
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : null
}

// Retourne { fbp, fbc } à passer à la server action confirmOrder
export function getFbIds() {
  return { fbp: getCookie('_fbp') || undefined, fbc: resolveFbc() || undefined }
}
