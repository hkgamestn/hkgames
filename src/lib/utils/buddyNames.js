const PREFIXES = [
  'Slimzilla', 'BloboBob', 'GlitchMon', 'PlopPop', 'ZorBlob', 'MutaGlob',
  'GooGuru', 'SlimBot', 'BubbloX', 'GelMaster', 'SlimKing', 'BlobZard',
  'GooBoss', 'SlimVader', 'MucusMon', 'GelZilla', 'PloppyX', 'BlobBoss',
  'SlimCraft', 'GooWizard',
]

const SUFFIXES = [
  'le Violet', 'la Rose', 'le Teal', "l'Électrique", 'le Bizarre', 'le Fou',
  'le Grand', 'le Magique', 'le Lumineux', "l'Invisible", 'le Sauvage',
  'le Doux', 'le Pétillant', 'le Majestueux', 'le Mystérieux',
]

export function generateBuddyName() {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)]
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]
  return `${prefix} ${suffix}`
}
