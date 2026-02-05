import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import AuthProvider from './api/authContex'
import { RouterProvider } from 'react-router-dom'
import router from './components/mainNav.jsx'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
    
 
)
