import React from 'react'
import { FiSearch,FiZap } from 'react-icons/fi'
import { User,FileText,Activity,PenTool } from 'lucide-react'
import { Outlet ,useNavigate } from 'react-router-dom'
export default function Dashboard({expand}) {
    const navigate = useNavigate();
  return (
    <div className='h-screen w-full'>
      {/* Header */}
      <nav className='h-16 px-4 mb-3 w-full border-b flex items-center justify-between ' >
        <div className='flex flex-col text-left' >
            <span className='text-2xl font-medium'>Dashboard</span>
            <h4 className='text-gray-700 text-sm w-full'>Welcome back! Here's your overview.</h4>
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
    

      {/* status containers */}
      <div className='w-full flex justify-around items-center px-2'>
        <div className='flex items-center p-1.5'>
            <div className='reletive h-20 w-50 rounded-md flex  justify-around  items-center shadow-md'>
                <div className='text-left'>
                    <span className='text-sm'>Total Notes</span>
                    <h3 className='text-2xl font-semibold'>24</h3>
                </div>
                <div className='h-8 w-8 rounded-md flex justify-center items-center bg-gray-200'>
                    <FileText size={24} className='text-gray-600'/> </div>
            </div>
        </div>

        <div className='flex items-center p-1.5'>
            <div className='reletive h-20 w-50 rounded-md flex  justify-around  items-center shadow-md'>
                <div className='text-left'>
                    <span className='text-sm'>Accuracy Rate</span>
                    <h3 className='text-2xl font-semibold'>97.8%</h3>
                </div>
                <div className='h-8 w-8 rounded-md flex justify-center items-center bg-gray-200'>
                    <Activity size={24} className='text-gray-600'/> </div>
            </div>
        </div>
        <div className='flex items-center p-1.5'>
            <div className='reletive h-20 w-50 rounded-md flex  justify-around  items-center shadow-md'>
                <div className='text-left'>
                    <span className='text-sm'>Avg.Response</span>
                    <h3 className='text-2xl font-semibold'>28ms</h3>
                </div>
                <div className='h-8 w-8 rounded-md flex justify-center items-center bg-gray-200'>
                    <FiZap size={24} className='text-gray-600'/> </div>
            </div>
        </div>
      </div>

      {/* Action containers */}
      <div className='h-78 w-full p-6 flex  items-center justify-center'>
        <div className=' h-60 w-170 flex flex-col items-center rounded-md transform transition-all ease-out duration-300 hover:scale-101 hover:shadow-indigo-300 shadow-lg'>
            <div className='relative flex flex-col w-full items-start h-20'>
                <div className='absolute left-3 top-4'>
                    <h3 className='font-semibold text-[1rem] px-4  text-left'>Quick Actions</h3>
                    <span className='text-sm font-light text-gray-600'>Get started with air writing</span>
                </div>
            </div>
            <div className=' h-50 p-4 flex justify-between gap-3 items-center'>
                <button onClick={()=>{ navigate('/dashboard/livewriting')}} className='h-25 w-80 flex flex-col justify-center items-center bg-linear-to-tr from-indigo-400 to-indigo-700 text-cyan-100 transform transition-all ease-out duration-300 hover:scale-107 hover:shadow-lg rounded-md'>
                    <PenTool size={14} />
                    <span className='font-medium'>Start Writing</span>
                    <span className='text-sm'>Begin a new session</span>
                </button>
                <button onClick={()=>{ navigate('/dashboard/notes')}} className='h-25 w-80 flex flex-col justify-center items-center text-indigo-400 tarnsition-all ease duration-300  hover:bg-gray-200 border rounded-md'>
                    <FileText size={14} />
                    <span className='font-medium'>View Notes</span>
                    <span className='text-sm'>Browse your notes</span>
                </button>
            </div>
        </div>
        <Outlet/>
      </div>

      {/* Recent notes */}
      <div className='w-full px-6 flex flex-col justify-self-center items-center'>
        <div className='w-full flex flex-col justify-start items-center border rounded-md'>
            <div className='w-full p-2 flex justify-between items-center border-b relative'>
                <div className='flex flex-col'>
                    <span className='font-semibold text-left'>Recent Notes</span>
                    <span className='text-sm font-light text-gray-600'>Your latest air-written notes</span>
                </div>
                <button onClick={()=>{ navigate('/dashboard/notes')}} className= 'h-7 w-20 absolute right-6 top-3 hover:bg-linear-to-tr from-indigo-400 to-indigo-700 hover:text-cyan-100 rounded-md'>
                    <span  className='font-semibold text-[15px]'>View All</span>
                </button>
            </div>

            {/* notes */}
             <div className='h-full p-2.5 w-full justify-evenly flex  items-center gap-2'>
                    <div className='w-90 p-2 flex flex-col  justify-start bg-white shadow-lg rounded-md border transform transition-all duration-300 hover:scale-[1.02]'>
                    <span className='font-semibold text-left'>Meeting</span>
                    <span className='text-sm text-left'>Discuss about project timeline</span>
                    <span className='text-sm text-left'>2 hour ago</span>
                </div>
                <div className='w-90 p-2 flex flex-col  justify-start bg-white shadow-lg rounded-md border transform transition-all duration-300 hover:scale-[1.02]'>
                    <span className='font-semibold text-left'>Meeting</span>
                    <span className='text-sm text-left'>Discuss about project timeline</span>
                    <span className='text-sm text-left'>2 hour ago</span>
                </div>
                   <div className='w-90 p-2 flex flex-col  justify-start bg-white shadow-lg rounded-md border transform transition-all duration-300 hover:scale-[1.02]'>
                    <span className='font-semibold text-left'>Meeting</span>
                    <span className='text-sm text-left'>Discuss about project timeline</span>
                    <span className='text-sm text-left'>2 hour ago</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
