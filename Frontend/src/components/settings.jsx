import React, { useEffect, useState } from "react";
import { FiSearch,FiZap } from 'react-icons/fi'
import { Bell, Shield, User, Camera, Download, Search } from "lucide-react";
import ProfileTab from "./profile";
import api from "../api/axios.js";
import jsPDF from "jspdf";
import { useAuth } from "../api/authContex.jsx";
export default function Settings() {
  const [activeTab, setActiveTab] = useState("General");
  const [pushNoti, setPushNoti] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [theme, setTheme] = useState("Dark");
  const {user,setUser,loading,setLoading} = useAuth();

  const tabs = ["Profile", "General"];

 
  return (
    <div className="min-h-screen bg-[#f6f7fb] flex flex-col">

      {/* Header */}
            <nav className='h-16 px-4 mb-3 w-full border-b flex items-center justify-between ' >
              <div className='flex flex-col text-left' >
                  <span className='text-2xl font-medium'>Settings</span>
                  <h4 className='text-gray-700 text-sm w-full'>Customize your AirWrite experience</h4>
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
      {/* TABS */}
        <div className=" bg-white border rounded-md p-1 mb-6 w-2xl ml-16 ">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition w-[50%] ${
                activeTab === t 
                  ? " shadow-2xl rounded-md text-gray-900 bg-gray-200"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>



              {/* CONTENT */}
        {activeTab === "Profile" && <ProfileTab />}
        {activeTab === "General" && (
          <GeneralTab
            pushNoti={pushNoti}
            setPushNoti={setPushNoti}
            soundEffects={soundEffects}
            setSoundEffects={setSoundEffects}
            autoSave={autoSave}
            setAutoSave={setAutoSave}
            theme={theme}
            setTheme={setTheme}
          />
        )}
        
      {/* MAIN */}
    </div>
  );
}





/* ---------------------------- COMPONENTS ---------------------------- */

export function Card({ children }) {
  return (
    <div className="bg-white border rounded-3xl p-6 shadow-md w-3xl ml-16">{children}</div>
  );
}

export function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-semibold leading-6">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function ToggleRow({ title, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>

      <button
        onClick={() => onChange(!value)}
        className={`w-14 h-8 rounded-full relative transition ${
          value ? "bg-indigo-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`w-6 h-6 bg-white rounded-full absolute top-1 transition ${
            value ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function GeneralTab({
  pushNoti,
  setPushNoti,
  soundEffects,
  setSoundEffects,
  autoSave,
  setAutoSave,
  theme,
  setTheme,
}) {
  const {user,setUser} = useAuth()
  const [note, setNote] = useState([]);
 const fetchImageAsBase64 = async (url) => {
  if (!url) return null;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Image fetch failed");
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
//  fetch users notes
const fetchUserNotes = async()=>{
  try {
    const noteslist = await api.get('/notes',{withCredentials:true})
      if(noteslist.data && noteslist.data.data){
        setNote(noteslist.data.data);
        // console.log("notes fetched successfully",noteslist.data.data);
      }
    } catch (error) {
      console.log("error while fetching notes",error);
    }}

  useEffect(()=>{
    fetchUserNotes();
  },[])


  const downloadData = async (user)=>{
   const doc = new jsPDF();
       //  Add avatar image if exists
    if (user.avatar) {
        try {
            const avatarUrl = `http://localhost:5000${user.avatar}`;
            const base64Img = await fetchImageAsBase64(avatarUrl);
            doc.addImage(base64Img, "JPEG", 100, 10, 40, 40); // adjust position/size
        } catch (err) {
            console.error("Error adding avatar:", err);
        }
    }
      doc.setFontSize(16);
      doc.text(user.name || "Unknown", 10, 20);
      doc.setFontSize(12);
      doc.text(`Email: ${user.email || ""}`, 10, 30);
      doc.text(`Bio: ${user.bio || ""}`, 10, 40)
      doc.text(`Total Notes: ${note.length}`,10,60);
      doc.setFontSize(14);
      doc.text("Notes:",10,70);
      note.forEach((n,index)=>{
        doc.setFontSize(14);
        doc.text(`${index+1}. ${n.title || "Untitled"}`,10,80 + index*20);
        doc.setFontSize(12);
        doc.text(`${n.recognizedText || ""}`,10,85 + index*20);
      });

      doc.text(`Joined on : ${new Date(user.createdAt).toLocaleString()|| "undefined"}`,10,50);
      doc.save(`${user.name || "user"}_Details.pdf`);
  }

   const handleDeleteAccount =async()=>{
    if(window.confirm("Are you sure you want to delete your account? This action cannot be undone.")){
      const response = await api.delete('/user/profile/delete',{withCredentials:true})
      if(response.data){
        console.log("account deleted successfully");
        window.location.href = '/signin';
      }
    }
  }
  return (
    <div className="space-y-6">
      {/* top two cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card>
          <SectionTitle
            icon={<Bell className="w-5 h-5" />}
            title="Notifications"
            subtitle="Manage notification preferences"
          />

          <ToggleRow
            title="Push Notifications"
            desc="Receive browser notifications"
            value={pushNoti}
            onChange={setPushNoti}
          />
          <div className="border-t" />

          <ToggleRow
            title="Sound Effects"
            desc="Play sounds for actions"
            value={soundEffects}
            onChange={setSoundEffects}
          />
          <div className="border-t" />

          <ToggleRow
            title="Auto-Save"
            desc="Automatically save notes"
            value={autoSave}
            onChange={setAutoSave}
          />
        </Card>

        {/* Appearance */}
        <Card>
          <SectionTitle
            icon={<span className="text-lg">🎨</span>}
            title="Appearance"
            subtitle="Customize the interface"
          />

          <p className="text-sm font-medium mb-3">Theme</p>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {["Light", "Dark", "System"].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`border rounded-2xl p-4 text-center transition ${
                  theme === t
                    ? "ring-2 ring-indigo-200 border-indigo-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="w-4 h-4 rounded-full mx-auto mb-2 border" />
                <p className="text-sm font-medium">{t}</p>
              </button>
            ))}
          </div>

          <p className="text-sm font-medium mb-2">Language</p>
          <select className="w-full border rounded-2xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-indigo-200">
            <option>English (US)</option>
            <option>English (UK)</option>
            <option>Nepali</option>
            <option>Korean</option>
          </select>
        </Card>
      </div>

      {/* Security */}
      <Card>
        <SectionTitle
          icon={<Shield className="w-5 h-5" />}
          title="Security"
          subtitle="Manage account security"
        />

        <div className="flex flex-wrap gap-3">
          <button onClick={()=>window.location.href = '/dashboard/change-password'} className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50">
            Change Password
          </button>
          <button onClick={()=>{downloadData(user)}} className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50">
            Download Data
          </button>
          <button onClick={()=>handleDeleteAccount()} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600">
            Delete Account
          </button>
        </div>
      </Card>
    </div>
  );
}



function Placeholder({ title, icon }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-gray-500">
            This section is ready — add your real settings here.
          </p>
        </div>
      </div>
    </Card>
  );
}