import React, { useEffect } from 'react'
import jsPDF from "jspdf";
import { useState ,useActionState} from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiLock, FiUnlock } from 'react-icons/fi'
// import getnotes from '../api/getnotes.js'
import { User, Trash2, Download, Search, Edit  } from 'lucide-react'
import api from '../api/axios.js'

async function handleFormSubmit(prev, formData) {
    //taking data from form
    const password = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    const passwordRegex =/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/


    // performing validation here
    const error={};
    if(!password || !newPassword || !confirmPassword){
        error.password = "Old password is required";
        error.newPassword = "New password is required";
        error.confirmPassword = "Confirm password is required";
    }else if(password.length < 8 || password.length >20){
        error.password = "Password must be between 8 and 20 characters";
    }else if(password === newPassword){
        error.newPassword = "New password must be different from current password";
    }else if(!passwordRegex.test(password)){
        error.password = "Password must contain at least one uppercase letter, lowercase letter, number, and special character";
    }
    else if(newPassword.length < 8 || newPassword.length >20){
        error.newPassword = "New password must be between 8 and 20 characters";
    }else if(!passwordRegex.test(newPassword)){
        error.newPassword = "New password must contain at least one uppercase letter, lowercase letter, number, and special character";
    }
    else if(newPassword !== confirmPassword){
        error.confirmPassword = "passwords do not match";
    }
    
    //checking for any error to send data to server
    if(Object.keys(error).length > 0){
        return{
            success:false,
            error:error
        }
    }

    // sending data to server
    try {
        const response = await api.put('/user/profile/change-password',{password,newPassword},{withCredentials:true});
        
        console.log(response.data && response.data.message);
        if(response.data && response.data.message){
            window.location.href = "/signin";
            return{
                success:true,
                message:response.data.message,
                
            }
        }else{
            return{
                success:false,
                error: response.data && response.data.error ? response.data.error : "Failed to change password. Please try again."
            }
        }
    } catch (error) {
        return({
            success:false,
            error:"failed to change password. Please try again."
        })
    }

} 


export default function ChangePassword() {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [data,formAction,isPending] = useActionState(handleFormSubmit,{
            success:false,
            error:{}
        });
  return (
//   <!-- Page Container -->
  <div className="min-h-screen">

    {/* <!-- Header --> */}
      <nav className='h-16 px-4 mb-3 w-full border-b flex items-center justify-between ' >
        <div className='flex flex-col text-left' >
            <span className='text-2xl font-medium'>Change Password</span>
            <h4 className='text-gray-700 text-sm w-full'>Secure your account with a new password</h4>
        </div>
        {/* search */}
        <div className='flex justify-between items-center'>
            <div className='relative flex  items-center'>
            <FiSearch className='absolute left-1' size={16} />
            <input type="text" placeholder='search...' className='text-sm border h-8 pl-8 w-23 rounded-md md:w-auto'/>
        </div>
        <User onClick={()=>{navigate('/dashboard/settings')}} size={20} className='text-gray-800 ml-4 cursor-pointer' />
        
        </div>
      </nav>

    {/* <!-- Main Content --> */}
    <div className="bg-white border rounded-2xl p-6 shadow-md w-md ml-16">
        <form className="space-y-6"  action={formAction} method='post'>
            <div className='relative'>
                <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">Current Password</label>
                <input type={showPassword ? "text":"password"} name="currentPassword" className="mt-1 w-full border rounded-2xl px-4 py-3 bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200" required />
                <span className="toggle-eye" onClick={()=>{setShowPassword(!showPassword)}}>{ showPassword ? <FiUnlock/> :<FiLock/> }</span>
                {data?.error?.password && <p className="form-error">{data?.error?.password}</p>}
            </div>
            <div className='relative'>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
                <input type={showNewPassword ?"text":"password"} name='newPassword' className="mt-1 w-full border rounded-2xl px-4 py-3 bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200" required />
                <span className="toggle-eye" onClick={()=>{setShowNewPassword(!showNewPassword)}}>{ showNewPassword ? <FiUnlock/> :<FiLock/> }</span>
                {data?.error?.newPassword && <p className="form-error">{data?.error?.newPassword}</p>}
            </div> 
            <div className='relative'>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input type={showConfirmPassword ?"text":"password"} name="confirmPassword" className="mt-1 w-full border rounded-2xl px-4 py-3 bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200" required />
                <span className="toggle-eye" onClick={()=>{setShowConfirmPassword(!showConfirmPassword)}}>{ showConfirmPassword ? <FiUnlock/> :<FiLock/> }</span>
                {data?.error?.confirmPassword && <p className="form-error" > {data?.error?.confirmPassword}</p>}
            </div>
            <button disabled={isPending} type="submit" className="w-full px-4 py-3 rounded-2xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">{isPending ?"updating..." : "Update Password"}</button>
        </form>
        <hr className="my-6 border-gray-300" />
        <div className="text-center">
            <button onClick={()=>window.location.href = '/forgot-password'} className="text-sm text-red-600 hover:underline">Forgot your current password?</button>
        </div>
        <div className="text-center mt-4">
            <button onClick={()=>window.location.href = '/dashboard/settings'} className="text-sm text-gray-600 hover:underline">Back to Settings</button>
        </div>
    </div>
    </div>
  )
}
