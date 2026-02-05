import React, { createContext, useState,useEffect, useContext } from 'react'
import api from './axios';


const AuthContext = createContext();

export default function AuthProvider({children}) {
    const [user,setUser] = useState(null);
    const [loading,setloading] = useState(true);

    useEffect(()=>{
        // check user login status
        const checkAuth = async()=>{
            try {
                const res = await api.get("/user/profile",{withCredientials:true});
                setUser(res.data.data);
            } catch (err) {
                setUser(null);
            }finally{
                setloading(false);
            }
        };
        checkAuth();
    },[])

    const logOut = async ()=>{
        try{
            await api.post("/user/logout",{},{withCredientials:true});
            setUser(null);
        }
        catch(err){
            console.error("Logout failed",err);
        }
    };

  return (
    <AuthContext.Provider value={{user,setUser,loading,setloading,logOut}}>
        {children}
    </AuthContext.Provider>
  )
}




export const useAuth = ()=> useContext(AuthContext);