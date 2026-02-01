import React, { createContext, useContext, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import logo from '../assets/logo1.webp'
import { FiLogOut } from 'react-icons/fi'
import { ChevronLeft, ChevronRight } from "lucide-react"

const sidebarContext = createContext();

export default function Slidebar({ children }) {
  const [expand, setExpand] = useState(true);

  return (
    <div className='flex h-full w-full'>
      <aside className={`h-screen transition-all duration-300 ${expand ? 'w-64' : 'w-16'}`}>
        <nav className='h-full flex flex-col bg-white shadow-md'>

          {/* Header */}
          <div className="p-4 flex justify-between items-center border-b h-16 overflow-hidden">
            <img src={logo} alt="air-write-logo"
              className={`transition-all duration-300 ${expand ? 'w-32' : 'w-0'}`} />
            <button
              onClick={() => setExpand(!expand)}
              className='w-8 h-8 flex justify-center items-center rounded-md hover:bg-indigo-500 hover:text-white transition'>
              {expand ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          <sidebarContext.Provider value={{ expand }}>
            <ul className='flex-1 mt-5'>{children}</ul>
          </sidebarContext.Provider>

          {/* Footer */}
          <div className='p-3 border-t'>
            <div className={`flex w-full px-2 ${expand ? 'gap-3' : 'justify-center'}`}>
              <img src="/right.webp" alt="" className='rounded-md h-10 w-10' />
              {expand && (
                <div className='leading-4'>
                  <h4 className='font-semibold'>Joy Boss</h4>
                  <span className='text-xs text-gray-600'>Joy@gmail.com</span>
                </div>
              )}
            </div>

            <div className='flex justify-center gap-2 items-center h-10 bg-indigo-600 text-white rounded mt-3 cursor-pointer'>
              <FiLogOut size={18} />
              {expand && <button className='font-semibold text-sm'>Signout</button>}
            </div>
          </div>

        </nav>
      </aside>

      {/* Page Content */}
      <div className='flex-1 h-screen overflow-auto bg-gray-50'>
        <Outlet />
      </div>
    </div>
  )
}

export function SlidebarItems({ icon, text, active, clicked }) {
  const { expand } = useContext(sidebarContext);
  const navigate = useNavigate();

  const handleClick = () => {
    if (clicked) clicked();

    const routes = {
      'Dashboard': '/dashboard',
      'Live Writing': '/dashboard/livewriting',
      'Notes': '/dashboard/notes',
      'Model Status': '/dashboard/modelstatus',
      'Settings': '/dashboard/settings'
    };

    navigate(routes[text]);
  };

  return (
    <li
      onClick={handleClick}
      className={`h-11 relative flex items-center px-4 rounded-md transition-all duration-300 cursor-pointer group
      ${active ? "bg-gradient-to-tr from-indigo-200 to-indigo-600 text-indigo-950" : "hover:bg-sky-200"}`}>

      <div className={`flex items-center gap-3 w-full transition-all duration-300 ${expand ? '' : 'justify-center'}`}>
        <span className="w-5 h-5 flex items-center justify-center">{icon}</span>

        <span className={`text-sm font-medium transition-all duration-300
          ${expand ? "opacity-100 ml-0" : "opacity-0 -ml-2 w-0 overflow-hidden"}`}>
          {text}
        </span>
      </div>

      {active && (
        <div className={`absolute h-1.5 w-1.5 rounded-full bg-indigo-700 right-4 ${expand ? '' : 'top-2'}`} />
      )}
    </li>
  )
}
