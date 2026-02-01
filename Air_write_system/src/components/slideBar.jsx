import React, { createContext, useContext, useState } from 'react'
import logo  from '../assets/logo1.webp'
import { FiLogOut,FiArrowLeft } from 'react-icons/fi';
import { StepBack,ChevronLeft,ChevronRight } from "lucide-react";
import Dashboard from './dashboard';


const sidebarContext = createContext();

export default function Slidebar({children}) {
 const [expand , setExpand] = useState(true);
  return (
   <div className='flex h-full w-full p-2'>
     <aside className={`h-screen transition-all ease duration-300 ${expand ? 'w-50':'w-15'}`}>
      <nav className='h-full flex flex-col bg-white-500 shadow-md'>
        <div className="ms-3 p-4 pb-2 flex justify-around items-center mx-2.5 border-b h-17 overflow-hidden">
          <img src={logo} alt="air-write-logo" className={`transition-all ease duration-300 ${expand?'w-32':'w-0'}`}/>
          <button onClick={()=>setExpand(!expand)} className=' w-8 h-8 flex justify-center items-center cursor-pointer rounded-md hover:bg-indigo-500 hover:text-white transition' >
            {expand ? <ChevronLeft  size={18}/>:<ChevronRight  size={18}/>}</button>
        </div>
        <sidebarContext.Provider value={{expand}} >
          <ul className='flex-1 mt-5'>{children}</ul>
        </sidebarContext.Provider>
        <div className='p-3 border-t'>
          <div className={`flex flex-1 w-full ${expand ? 'gap-5': 'justify-center'}`}>
            <div className='h-12 w-12 px-5 flex justify-center items-center overflow-hidden'>
              <img src="/right.webp" alt=""  className='rounded-md h-10 w-10 '/>
            </div>
            <div className={`flex justify-left items-center overflow-hidden transition-all ease duration-300 ${expand ? 'w-full':'w-0'}`}>
              <div className='leading-4 text-left'>
                <h4 className='font-semibold'>{`Joy Boss`}</h4>
                <span className='text-xs text-gray-600'>{`Joy@gmail.com`}</span>
              </div>
            </div>
          </div>
            <div className='flex justify-center gap-2 items-center h-10 bg-indigo-600 rounded-b-sm'>
              <span ><FiLogOut size={18}/></span>
              {expand ? <button className='font-semibold text-0'>Signout</button> : null}
            </div>
           
        </div>
      </nav>
    </aside>
    <Dashboard expand={expand}/>
   </div>  
  )
}


export function SlidebarItems({icon,text,active,clicked}){
  let alert = !!active;
  const{ expand} = useContext(sidebarContext)
 return (
  <li onClick={clicked} className={`h-11 relative flex items-center px-4 rounded-md  transform hover:translate-x-1.5 transition-all duration-300 cursor-pointer 
  group ${active ? "bg-linear-to-tr from-indigo-200 to-indigo-600 text-indigo-950":"hover:bg-sky-200"}`}>
    <div className={`flex items-center gap-3 pl-4 ${active ? "text-indigo-950":"text-gray-600 hover:text-gray-900"} w-full transition-all ease duration-300 ${expand ? '' : 'justify-center'}`}>
      <span className="flex items-center justify-center w-5 h-5">
        {icon}
      </span>
       <span
          className={`text-sm text-left font-medium transition-all duration-300 ${
            expand ? "opacity-100 ml-0" : "opacity-0 -ml-2 w-0 overflow-hidden"
          }`}
        >
          {text}
        </span>
    </div>
    {alert && <div className={`absolute h-1.5 w-1.5 rounded-full bg-indigo-700 right-4 transition-all ease duration-300 ${expand ? '': 'top-2'}`}></div>}
  </li>
)
}



