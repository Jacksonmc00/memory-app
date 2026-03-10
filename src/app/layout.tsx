import { Inter, Lora } from 'next/font/google' // Add Lora here
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans', // Define a variable
})

const lora = Lora({ 
  subsets: ['latin'],
  variable: '--font-serif', // Define a variable
  style: ['italic', 'normal'],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="font-sans antialiased text-[#2D2926] bg-[#FDFCF8]">
        {children}
      </body>
    </html>
  )
}