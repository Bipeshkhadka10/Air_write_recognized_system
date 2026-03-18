import React, { useState , useEffect} from 'react'
import { Card, SectionTitle } from './settings';
import {  User } from "lucide-react";
import api from '../api/axios.js'
import { useAuth } from '../api/authContex.jsx';

 

export default function ProfileTab() {
  const {user, setUser,playSound} = useAuth();
  // console.log("user data in profile tab",user);
  // setting default avatar by user name
  const default_avatar = user?.name
  ? user.name.split(" ").map(word => word[0] ? word[0].toUpperCase() : "").join("")
  : "JD";

  // const getUserData = async()=>{
  //   try{
  //     const response = await api.get('/user',{withCredentials:true})
  //     if(response.data && response.data.data){
  //       console.log("user data fetched successfully",response.data);
  //       setUser(response.data?.data);
  //     }
  //   }
  //   catch(error){
  //     console.log("error while fetching user data",error);
  //   }
  // }
    const [firstname,setFirstname] = useState(user?.name.split(" ")[0] || "John");
    const [lastname,setLastname] = useState(user?.name.split(" ")[1] || "Doe");
    const [email,setEmail] = useState(user?.email || "john@dummy.com");
    const [bio, setBio] = useState(user?.bio);
    const [imgAvatar, setImage] = useState(user.avatar ? user.avatar : null);
    
  //  handling image 
  const handleImage = (e)=>{
  
    const file = e.target.files[0];
    const allowType = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    console.log("selected file",file);
    if(file && file.size <= 2 * 1024 * 1024){
      if(!allowType.includes(file.type)){
        alert("Only JPG, PNG, WEBP and GIF formats are allowed.");
        e.target.value = null;
      }
      else{
        setImage(file);
      }
    }else{
      alert("Image size should be less than 2MB");
      e.target.value = null; // reset the file input
    }
  }
  
  // handling edit profile
  const handleEdit = async(e)=>{
    e.preventDefault();
    try {
      const formData = new FormData();
      const name = `${firstname} ${lastname}`;
      formData.append('name', name);
      formData.append('email', email);
      formData.append('bio', bio);
      if (imgAvatar instanceof File) {
        formData.append('avatar', imgAvatar);
      }
      console.log("image",formData.get('avatar'));
      const response = await api.put('/user/profile/edit',formData,{withCredentials:true,
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if(response.data && response.data.data){
        alert("profile updated successfully")
        setUser(response.data.data);
        setImage(response.data.data.avatar);
      }

    } catch (error) {
      console.log("error while updating profile",error);
    }
  }
 
  
  return (
    <Card>
      <SectionTitle
        icon={<User className="w-5 h-5" />}
        title="Profile Settings"
        subtitle="Manage your account information"
      />
      <form onSubmit={handleEdit}>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-3xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl overflow-hidden">
         {imgAvatar && <img src={imgAvatar instanceof File ? URL.createObjectURL(imgAvatar) : `http://localhost:5000${imgAvatar}`} alt="avatar" className="w-full h-full object-cover"/> || default_avatar}
        </div>
        <div>
          <div className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50">
           <input type="file" name='avatar' className="hidden" id="avatar-upload" accept='image/png, image/jpeg, image/webp, image/gif'  onChange={handleImage} />
           <label htmlFor="avatar-upload"onClick={()=>playSound()} className="cursor-pointer">Change Avatar</label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG or GIF. Max 2MB.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium text-gray-700">First Name</label>
          <input
            className="mt-2 w-full border rounded-2xl px-4 py-3 bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200"
            defaultValue={firstname} onChange={(e)=>setFirstname(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Last Name</label>
          <input
            className="mt-2 w-full border rounded-2xl px-4 py-3 bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200"
            defaultValue={lastname} onChange={(e)=>setLastname(e.target.value)}
          />
        </div>

        <div className="lg:col-span-2">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            className="mt-2 w-full border rounded-2xl px-4 py-3 bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200"
            defaultValue={email} onChange={(e)=>setEmail(e.target.value)}
          />
        </div>

        <div className="lg:col-span-2">
          <label className="text-sm font-medium text-gray-700">Bio</label>
          <input
            className="mt-2 w-full border rounded-2xl px-4 py-3 bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200" value={bio} onChange={(e)=>setBio(e.target.value)}
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>

      <button type='submit'onClick={()=>playSound()} className="mt-8 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">
        Save Changes
      </button>
      </form>
    </Card>
  );
}