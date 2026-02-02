import React from 'react'
import Slidebar from '../components/slideBar'
import {SlidebarItems} from '../components/slideBar'
import '../assets/style.css'
import { LayoutDashboardIcon, SquarePen, PenTool,FileText,Activity, Settings2, Sidebar } from 'lucide-react'
import { useState } from 'react'
import Dashboard from '../components/dashboard'
import { Outlet } from 'react-router-dom'

export default function UserDashbord() {
    const [activeIndex, setActiveIndex] = useState(0)
    const items= [
        {icon:<LayoutDashboardIcon/> , text:'Dashboard' },
        {icon:<PenTool/> , text:'Live Writing' },
        {icon:<FileText/> , text:'Notes' },
        {icon:<Activity/> , text:'Model Status' },
        {icon:<Settings2/> , text:'Settings' },
        
    ]
  return (
    <main>
        <Slidebar >
            {items.map((item,index)=>{
                return(
                <SlidebarItems
                key={index}
                icon={item.icon}
                text={item.text}
                active = {activeIndex === index}
                clicked = {()=>{setActiveIndex(index)}}
                />
                )
            })}          
        </Slidebar>
    </main>
  )
}
