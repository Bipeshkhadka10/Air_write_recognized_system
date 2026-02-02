import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { User, Trash2, Download  } from 'lucide-react'

export default function LiveWriting() {
  return (
    <div className='flex flex-col'>
       <nav className='h-16 px-4 mb-3 w-full border-b flex items-center justify-between ' >
        <div className='flex flex-col text-left' >
            <span className='text-2xl font-medium'>Notes</span>
            <h4 className='text-gray-700 text-sm w-full'>Manage your air-written notes</h4>
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
    </div>
  )
}
