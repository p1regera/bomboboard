import './globals.css'

export const metadata = {
  title: 'BomboBoard',
  description: 'Bomboclat soundboard that goes crazy 🔊',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}