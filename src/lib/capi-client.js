// Envoie un événement CAPI depuis le client via notre API route
export async function trackCAPI({ eventName, userData = {}, customData = {}, sourceUrl }) {
  try {
    await fetch('/api/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventId: eventName + '-' + Date.now(),
        userData,
        customData,
        sourceUrl: sourceUrl || window.location.href,
      }),
    })
  } catch {}
}
