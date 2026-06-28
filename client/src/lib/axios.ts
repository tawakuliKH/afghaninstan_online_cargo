import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true, // sends/receives httpOnly cookies — needed later for refresh tokens
})

export default api