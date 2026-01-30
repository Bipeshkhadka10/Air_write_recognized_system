import React, { useState } from 'react'
import logo  from '../assets/logo1.webp'
import { FiLogOut } from 'react-icons/fi';
import { ArrowLeft } from "lucide-react";

export default function Slidebar({children}) {
 
  return (
    <aside className='h-screen w-50 '>
      <nav className='h-full flex flex-col bg-white-500 shadow-md'>
        <div className="ms-3 p-4 pb-2 flex justify-around items-center border-b h-20 overflow-hidden">
          <img src={logo} alt="air-write-logo" className='w-32'/>
          <button className=' w-8 h-8 flex justify-center items-center cursor-pointer rounded-full bg-sky-400 hover:bg-sky-700 text-white transition' >
            <ArrowLeft  size={18}/></button>
        </div>
        <ul className='flex-1'>{children}</ul>
        <div className='border-t p-3  '>
          <div className='flex flex-1  gap-3 '>
            <div className='h-11 overflow-hidden'>
              <img src="/right.webp" alt=""  className='rounded-md h-10 w-10 p-4'/>
            </div>
            <div className='flex justify-center items-center overflow-hidden'>
              <div className='leading-4 text-left'>
                <h4 className='font-semibold'>{`Joy Boss`}</h4>
                <span className='text-xs text-gray-600'>{`Joy@gmail.com`}</span>
              </div>
            </div>
          </div>
           <div className='flex justify-center gap-2 items-center h-10 bg-gray-400 rounded-b-lg'>
              <span ><FiLogOut size={18}/></span>
              <span className='font-semibold text-0'>Signout</span>
            </div>
        </div>
      </nav>
    </aside>  
  )
}


export function SlidebarItems({icon,text,alert}){
  // const [active,setActive] = useState(false);
  
  console.log(icon,text,active)
 return (
  <li className={`h-11 relative flex items-center px-4 rounded-md  transform hover:translate-x-1.5 transition-all duration-200 cursor-pointer 
  group ${active ? "bg-linear-to-tr from-indigo-200 to-indigo-100 text-indigo-950":"hover:bg-sky-200"}`}>
    <div className={`flex items-center gap-3 pl-4 ${active ? "text-indigo-950":"text-gray-600 hover:text-gray-900"} w-full`}>
      <span className="flex items-center justify-center w-5 h-5">
        {icon}
      </span>
      <span className="text-sm font-medium">{text}</span>
      
    </div>
  </li>
)
}



