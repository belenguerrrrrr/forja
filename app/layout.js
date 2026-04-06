import './globals.css'

export const metadata = {
  title: 'FORJA — Forja tu mejor versión',
  description: 'Coach de fitness con IA. Plan personalizado de entrenamiento y nutrición para alcanzar tu objetivo físico.',
  keywords: 'fitness, entrenamiento, nutrición, IA, coaching, perder peso, ganar músculo',
  openGraph: {
    title: 'FORJA — Forja tu mejor versión',
    description: 'Coach de fitness con IA. Plan personalizado de entrenamiento y nutrición.',
    url: 'https://forjafit.es',
    siteName: 'FORJA',
    locale: 'es_ES',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
