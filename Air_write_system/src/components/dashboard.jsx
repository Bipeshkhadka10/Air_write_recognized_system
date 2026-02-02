import React from 'react'
import { FiSearch,FiZap } from 'react-icons/fi'
import { User,FileText,Activity,PenTool } from 'lucide-react'
export default function Dashboard({expand}) {
    
  return (
    <div className='h-screen w-full'>
      <nav className='h-17 border-b flex items-center justify-between ' >
        <div className='flex flex-col text-left px-50 py-50' >
            <span className='text-2xl font-medium my-5 px-5'>Dashboard</span>
            <h4 className='text-gray-700 text-sm'>Welcome back! Here's your overview.</h4>
        </div>
        <div className='flex gap-10 p-3'>
            <div className='relative flex  items-center'>
            <FiSearch className='absolute left-1' size={16} />
            <input type="text" placeholder='search...' className='text-sm border h-7 px-10 py-10 text-center  rounded-md'/>
        </div>
        <div className='h-full w-20 flex justify-center items-center '>
            <User size={20} className='text-gray-800' />
        </div>
        </div>
      </nav>


      {/* status containers */}
      <div className='w-full flex justify-evenly'>
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
      <div className='h-80 w-full p-2 flex justify-around items-center'>
        <div className=' h-60 w-170 flex flex-col  items-center rounded-md transform transition-all ease-out duration-300 hover:scale-101 hover:shadow-indigo-300 shadow-lg'>
            <div className='relative flex flex-col w-full items-start h-20'>
                <div className='absolute left-3 top-4'>
                    <h3 className='font-semibold text-[1rem] px-4  text-left'>Quick Actions</h3>
                    <span className='text-sm font-light text-gray-600'>Get started with air writing</span>
                </div>
            </div>
            <div className=' h-50 flex justify-evenly gap-3 items-center'>
                <button className='h-25 w-80 flex flex-col justify-center items-center bg-linear-to-tr from-indigo-400 to-indigo-700 text-cyan-100 transform transition-all ease-out duration-300 hover:scale-107 hover:shadow-lg rounded-md'>
                    <PenTool size={14} />
                    <span className='font-medium'>Start Writing</span>
                    <span className='text-sm'>Begin a new session</span>
                </button>
                <button className='h-25 w-80 flex flex-col justify-center items-center text-indigo-400 tarnsition-all ease duration-300  hover:bg-gray-200 border rounded-md'>
                    <FileText size={14} />
                    <span className='font-medium'>View Notes</span>
                    <span className='text-sm'>Browse your notes</span>
                </button>
            </div>
        </div>
        
      </div>

      {/* Recent notes */}
      <div className='w-full flex flex-col justify-self-center items-center'>
        <div className='w-[90%] flex flex-col justify-start items-center border rounded-md'>
            <div className='h-15 w-full relative flex flex-col'>
                <div className='absolute flex flex-col left-5 top-2'>
                    <span className='font-semibold text-[1rem] px-4 text-left'>Recent Notes</span>
                    <span className='text-sm font-light text-gray-600'>Your latest air-written notes</span>
                </div>
                <button className= 'h-7 w-20 absolute right-6 top-3 hover:bg-linear-to-tr from-indigo-400 to-indigo-700 hover:text-cyan-100 rounded-md'>
                    <span className='font-semibold text-[15px]'>View All</span>
                </button>
            </div>

            {/* notes */}
             <div className='h-27 w-full justify-evenly flex  items-center gap-2'>
                <div className='w-90 flex flex-col  justify-start shadow-lg rounded-md border'>
                    <span className='font-semibold text-left'>Meeting</span>
                    <span className='text-sm text-left'>Discuss about project timeline</span>
                    <span className='text-sm text-left'>2 hour ago</span>
                </div>
                <div className='w-90 flex flex-col  justify-start shadow-lg rounded-md border'>
                    <span className='font-semibold text-left'>Meeting</span>
                    <span className='text-sm text-left'>Discuss about project timeline</span>
                    <span className='text-sm text-left'>2 hour ago</span>
                </div>
                <div className='w-90 flex flex-col  justify-start shadow-lg rounded-md border'>
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
