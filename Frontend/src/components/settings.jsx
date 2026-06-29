import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { FiSearch,FiZap } from 'react-icons/fi'
import { Bell, Shield, User, Camera, Download, Search } from "lucide-react";
import ProfileTab from "./profile";
import api from "../api/axios.js";
import jsPDF from "jspdf";
import { useTheme } from "../api/themeContex.jsx";
import { useAuth } from "../api/authContex.jsx";

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("General");
  const [pushNoti, setPushNoti] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const {user,setUser,loading,setLoading} = useAuth();

  useEffect(() => {
    const savedSound = localStorage.getItem('aw_sound');
    if (savedSound !== null) setSoundEffects(savedSound === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('aw_sound', String(soundEffects));
  }, [soundEffects]);

  const tabs = ["Profile", "General"];

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-gray-900 flex flex-col transition-colors duration-300">

      {/* Header */}
      <nav className='h-16 px-4 mb-3 w-full border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800'>
        <div className='flex flex-col text-left'>
          <span className='text-2xl font-medium text-gray-900 dark:text-white'>Settings</span>
          <h4 className='text-gray-500 dark:text-gray-400 text-sm w-full'>Customize your AirWrite experience</h4>
        </div>
        <div className='flex justify-between items-center'>
          <div className='relative flex items-center'>
            <FiSearch className='absolute left-1 text-gray-500 dark:text-gray-400' size={16} />
            <input
              type="text"
              placeholder='search...'
              className='text-sm border dark:border-gray-600 h-8 pl-8 w-23 rounded-md md:w-auto bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'
            />
          </div>
          <User onClick={()=>{navigate('/dashboard/settings')}} size={20} className='text-gray-800 dark:text-gray-200 ml-4 cursor-pointer' />
        </div>
      </nav>

      {/* TABS */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md p-1 mb-6 w-2xl ml-16">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition w-[50%] ${
              activeTab === t
                ? "shadow-2xl rounded-md text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-600"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
        />
      )}
    </div>
  );
}

/* ---------------------------- COMPONENTS ---------------------------- */

export function Card({ children }) {
  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-3xl p-6 shadow-md w-2xl ml-16 transition-colors duration-300">
      {children}
    </div>
  );
}

export function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

function ToggleRow({ title, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-14 h-8 rounded-full relative transition ${
          value ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-600"
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
}) {
  const { theme, setTheme } = useTheme();
  const {user,setUser,playSound: _playSound} = useAuth();
  const playSound = () => { if (soundEffects) _playSound(); };
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

  const fetchUserNotes = async () => {
    try {
      const noteslist = await api.get('/notes', {withCredentials:true});
      if (noteslist.data && noteslist.data.data) {
        setNote(noteslist.data.data);
      }
    } catch (error) {
      console.log("error while fetching notes", error);
    }
  };

  useEffect(() => {
    fetchUserNotes();
  }, []);

  const downloadData = async (user) => {
    playSound();
    const doc = new jsPDF();
    if (user.avatar) {
      try {
        const avatarUrl = `http://localhost:5000${user.avatar}`;
        const base64Img = await fetchImageAsBase64(avatarUrl);
        doc.addImage(base64Img, "JPEG", 100, 10, 40, 40);
      } catch (err) {
        console.error("Error adding avatar:", err);
      }
    }
    doc.setFontSize(16);
    doc.text(user.name || "Unknown", 10, 20);
    doc.setFontSize(12);
    doc.text(`Email: ${user.email || ""}`, 10, 30);
    doc.text(`Bio: ${user.bio || ""}`, 10, 40);
    doc.text(`Total Notes: ${note.length}`, 10, 60);
    doc.setFontSize(14);
    doc.text("Notes:", 10, 70);
    note.forEach((n, index) => {
      doc.setFontSize(14);
      doc.text(`${index+1}. ${n.title || "Untitled"}`, 10, 80 + index*20);
      doc.setFontSize(12);
      doc.text(`${n.recognizedText || ""}`, 10, 85 + index*20);
    });
    doc.text(`Joined on : ${new Date(user.createdAt).toLocaleString() || "undefined"}`, 10, 50);
    doc.save(`${user.name || "user"}_Details.pdf`);
  };

  const handleDeleteAccount = async () => {
    playSound();
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      const response = await api.delete('/user/profile/delete', {withCredentials:true});
      if (response.data) {
        console.log("account deleted successfully");
        window.location.href = '/signin';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* System Notifications */}
        <Card>
          <SectionTitle
            icon={<Bell className="w-5 h-5" />}
            title="System Notifications"
            subtitle="Manage notification preferences"
          />
          <ToggleRow
            title="Sound Effects"
            desc="Play sounds for actions"
            value={soundEffects}
            onChange={setSoundEffects}
          />
          <div className="border-t dark:border-gray-700" />
          <ToggleRow
            title="Auto-Save"
            desc="Automatically save notes"
            value={autoSave}
            onChange={setAutoSave}
          />
        </Card>
        <br />

        {/* Appearance */}
        <Card>
          <SectionTitle
            icon={<span className="text-lg">🎨</span>}
            title="Appearance"
            subtitle="Customize the interface"
          />
          <p className="text-sm font-medium mb-3 text-gray-900 dark:text-white">Theme</p>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {["Light", "Dark", "System"].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`border dark:border-gray-600 rounded-2xl p-4 text-center transition ${
                  theme === t
                    ? "ring-2 ring-indigo-200 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/30"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="w-4 h-4 rounded-full mx-auto mb-2 border dark:border-gray-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t}</p>
              </button>
            ))}
          </div>
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
          <button
            onClick={() => window.location.href = '/dashboard/change-password'}
            className="px-4 py-2 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
          >
            Change Password
          </button>
          <button
            onClick={() => downloadData(user)}
            className="px-4 py-2 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
          >
            Download Data
          </button>
          <button
            onClick={() => handleDeleteAccount()}
            className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600"
          >
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
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This section is ready — add your real settings here.
          </p>
        </div>
      </div>
    </Card>
  );
}