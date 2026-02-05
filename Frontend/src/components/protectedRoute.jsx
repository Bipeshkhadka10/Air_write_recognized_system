import React from 'react'
import { Navigate } from 'react-router-dom';
import { useAuth } from '../api/authContex.jsx';

export default function ProtectedRoute({children}) {
    const {user,loading} = useAuth();

    if(loading) return <div>loading....</div>;
    return user ? children : <Navigate to="/signin" />;
}
