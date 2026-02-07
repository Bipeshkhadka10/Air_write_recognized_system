import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../api/authContex.jsx'

export default function Settings() {
  const {user,setUser} = useAuth();
  console.log(user)
  return (
    <div>
      setting
      
    </div>
  )
}
