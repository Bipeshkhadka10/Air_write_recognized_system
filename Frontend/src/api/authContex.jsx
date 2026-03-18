import React, { createContext, useState,useEffect, useContext } from 'react'
import api from './axios';
import clickSound from "../sounds/play.mp3"

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


    // useEffect(() => {
    //     const fetchProfile = async () => {
    //     try {
    //         if (!token) return; // skip if no token
    //         const res = await api.get("/user/profile");
    //         setUser(res.data.data);
    //     } catch (err) {
    //         console.log("User not logged in");
    //     }
    // };
    // fetchProfile();
    // }, []);

    const logOut = async ()=>{
        try{
            await api.post("/user/logout",{},{ withCredentials: true });
            setUser(null);
        }
        catch(err){
            console.error("Logout failed",err);
        }
    };
    function playSound(){
    const audio = new Audio(clickSound)
    audio.play();
  }

  return (
    <AuthContext.Provider value={{user,setUser,loading,setloading,logOut , playSound}}>
        {children}
    </AuthContext.Provider>
  )
}




export const useAuth = ()=> useContext(AuthContext);