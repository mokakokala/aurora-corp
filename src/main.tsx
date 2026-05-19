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
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
