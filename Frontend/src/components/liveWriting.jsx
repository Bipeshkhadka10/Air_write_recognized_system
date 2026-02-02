import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { User, Trash2, Download  } from 'lucide-react'
export default function LiveWriting() {
  return (
    <div>
          <nav className='h-16 px-4 mb-3 w-full border-b flex items-center justify-between ' >
              <div className='flex flex-col text-left' >
                  <span className='text-2xl font-medium'>Live Air Writing</span>
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
            <div className="mx-auto max-w-7xl px-4 py-6">
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

    {/* LEFT MAIN AREA */}
    <div className="lg:col-span-9">
      <div className="relative h-[560px] rounded-2xl  bg-white shadow-md overflow-hidden">

        {/* Status */}
        <div className="absolute right-5 top-5 z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-white  rounded-full shadow-md">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300"></span>
            <span className="text-sm font-medium text-gray-700">Idle</span>
          </div>
        </div>

        {/* Live Feed */}
        <div className="absolute left-5 top-5 z-10 w-52 rounded-2xl bg-white/70 p-4 shadow backdrop-blur">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-blue-600 flex items-center gap-1">
              📷 Live Feed
            </span>
            <span className="cursor-pointer text-gray-500">⤢</span>
          </div>

          <div className="mt-4 h-28 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
            Camera Off
          </div>
        </div>

        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.15)_1px,transparent_1px)] bg-[size:48px_48px]" />

        {/* Center Play */}
        <div className="relative flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center cursor-pointer hover:bg-blue-100 transition">
              ▶
            </div>
            <p className="mt-4 text-gray-500">
              Press <span className="font-semibold text-gray-700">Start</span> to begin writing
            </p>
          </div>
        </div>

      </div>
    </div>

    {/* RIGHT SIDEBAR */}
    <div className="lg:col-span-3 space-y-6">

      {/* Controls */}
      <div className="bg-white rounded-2xl  shadow-md p-5">
        <h3 className="text-lg font-semibold mb-4">Controls</h3>

        <button className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold mb-4 hover:bg-green-600 transition">
          ▶ Start
        </button>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button className="border rounded-xl py-2 font-semibold text-gray-700 hover:bg-gray-50">
            🗑 Clear
          </button>
          <button className="border rounded-xl py-2 font-semibold text-gray-700 hover:bg-gray-50">
            💾 Save
          </button>
        </div>

        <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
          ⬇ Export PDF
        </button>
      </div>

      {/* Recognized Text */}
      <div className="bg-white rounded-2xl  shadow-md p-5">
        <h3 className="text-lg font-semibold mb-3">Recognized Text</h3>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 font-mono">
          Text will appear here...
        </div>
      </div>

      {/* Session Stats */}
      <div className="bg-white rounded-2xl  shadow-md p-5">
        <h3 className="text-lg font-semibold mb-3">Session Stats</h3>

        <div className="flex justify-between border rounded-xl px-4 py-2 mb-2">
          <span className="text-gray-500 text-sm">Characters</span>
          <span className="font-semibold">0</span>
        </div>

        <div className="flex justify-between  rounded-xl px-4 py-2 mb-2">
          <span className="text-gray-500 text-sm">Words</span>
          <span className="font-semibold">0</span>
        </div>

        <div className="flex justify-between  rounded-xl px-4 py-2">
          <span className="text-gray-500 text-sm">Time</span>
          <span className="font-semibold">00:00</span>
        </div>
      </div>

    </div>
  </div>
</div>

    </div>
  )
}
