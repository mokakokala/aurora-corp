import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log(
  '%c' +
`
        |    |    |
       )_)  )_)  )_)
      )___))___))___) \\
     )____)____)_____) \\
   _____|____|____|____\\__
---------\\              /---------
  ~~~^~~~^~~^~~~^~~~^~~~^~~~^~~~
    ~~~^~~^~~~^~~~^~~^~~~^~~~^~~
       A . U . R . O . R . A
`,
  'color: #f97316; font-family: monospace; font-size: 12px; font-weight: bold; line-height: 1.5;'
)
console.log(
  '%cSi tu lis ceci, tu es un petit malin plein d\'avenir,\nmais sache qu\'il ne nous reste que 2 heures avant la coupure totale.',
  'color: #ef4444; font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 1px; line-height: 2;'
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
