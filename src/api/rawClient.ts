import axios from 'axios'
import { env } from '@/env'

export const rawClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
})
