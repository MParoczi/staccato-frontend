import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error(
    'VITE_API_BASE_URL is not set. Copy .env.example to .env and configure it.',
  );
}

export const rawClient = axios.create({
  baseURL,
  withCredentials: true,
});
