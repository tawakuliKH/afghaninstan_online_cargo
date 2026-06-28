import { useEffect, useState } from 'react'
import api from '../lib/axios'

function Home() {
  const [status, setStatus] = useState<string>('checking...')

  useEffect(() => {
    api
      .get('/health')
      .then((res) => setStatus(`✅ ${res.data.status} — ${res.data.timestamp}`))
      .catch(() => setStatus('❌ could not reach server'))
  }, [])

  return (
    <div className="p-8 text-2xl">
      <p>Home page</p>
      <p className="mt-4 text-base">Backend status: {status}</p>
    </div>
  )
}

export default Home