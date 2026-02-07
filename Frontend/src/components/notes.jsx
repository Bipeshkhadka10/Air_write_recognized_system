import React, { useEffect } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
// import getnotes from '../api/getnotes.js'
import { User, Trash2, Download  } from 'lucide-react'
import api from '../api/axios.js'



export default function Notes() {
  const navigate = useNavigate()
  const [listView, setListView] = useState(false);
  const [notes, setNotes] = useState([]);
  const [show,setShow] = useState(false);

  // getting notes from backend
  const getnotes = async()=>{
    try {
      const noteslist = await api.get('/notes',{withCredentials:true})
      if(noteslist.data && noteslist.data.data){
        setNotes(noteslist.data.data);
        console.log("notes fetched successfully",noteslist.data.data);
      }
    } catch (error) {
      console.log("error while fetching notes",error);
    }
  }

  useEffect(()=>{
    getnotes()
  },[])


  // handle delete note
  const handleDelete = async(noteId)=>{
    try {
      const response = await api.delete(`/note/${noteId}`, {withCredentials:true});
      if(response.status === 200){
        getnotes(); // refresh the notes list
      }
    } catch (error) {
      console.log("error while deleting note",error);
    }
  }
  
  return (
//   <!-- Page Container -->
  <div className="min-h-screen">

    {/* <!-- Header --> */}
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
    

    {/* <!-- Notes Toolbar --> */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 px-6">

      {/* <!-- Search Notes --> */}
      <div className="relative w-full md:w-96">
        <input type="text" placeholder="Search notes..." className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none w-full" />
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
      </div>

      {/* <!-- View Toggle + New Note --> */}
      <div className="flex items-center gap-3">
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={()=>setListView(false)} className={`px-3 py-2 transition-all ease duration-200 ${listView ? 'bg-white text-gray-500' : 'bg-blue-500 text-white'}`}>▦</button>
          <button onClick={()=>setListView(true)} className={`px-3 py-2 transition-all ease duration-200 ${listView ? 'bg-blue-500 text-white' : 'bg-white text-gray-500'}`}>☰</button>
        </div>

        <button onClick={()=>navigate('/dashboard/livewriting')} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition">
          + New Note
        </button> 
      </div>
    </div>
{/* 
    <!-- Notes Grid --> */}
    <div className={`${!listView ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6 px-6 mb-10' : 'flex flex-col px-6 mb-10'}`}>

     {notes.length > 0 ? notes.map((item,index)=>(
        <div key={item._id} className={`${!listView ? 'bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition' : 'hidden'}`}>
        <div className="relative flex justify-between items-start mb-3">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">📄</div>
          <button onMouseOver={()=>{setShow(!show)}} className="text-gray-500 w-3 h-6 rounded-sm cursor-pointer hover:text-gray-600 hover:bg-blue-100 ">⋮</button>
            {show && (<div className='absolute right-0 top-6 bg-white shadow-md rounded-md p-0.5 flex flex-col gap-1'>
              <button className='flex items-center  px-3  hover:bg-gray-300 rounded-md w-full text-left ' >edit</button>
              <button onClick={async(noteId)=>{await api.delete(`/note/${item._id}`)}} className='flex items-center  px-3  hover:bg-gray-300 rounded-md w-full text-left' >delete</button>
              <button className='flex items-center  px-3  hover:bg-gray-300 rounded-md w-full text-left' >share</button>
            </div>)}
        </div>
        <h3 className="font-semibold mb-1 text-left">{item?.title}</h3>
        <p className="text-sm text-gray-500 mb-3 text-left">{item?.recognizedText}</p>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{new Date(item.createdAt).toLocaleDateString() || 'No date'}</span>
          <span>{item?.recognizedText?.length || 0} chars</span>
        </div>
      </div>
     ))
     :listView ? null : <p className="text-left  text-gray-500">No notes available</p>}

      {/* listing notes */}
       <div className={`${listView ? ' bg-white py-5 px-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition': 'hidden'}`}>
        {notes.length > 0 ? notes.map((item, index)=>(
          <div key={item._id} className="flex justify-between items-center px-2 mb-3 hover:shadow-sm hover:scale-101 transform transition-all ease duration-300 rounded-xl hover:border">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">📄</div>
          <div className="flex flex-col px-4 w-full">
            <h3 className="font-semibold text-left">{item?.title}</h3>
            <p className="text-sm text-gray-500  text-left">{item?.recognizedText}</p>
          </div>
          <span className="text-xs w-32 text-gray-400">{new Date(item?.createdAt).toLocaleString() || "No date"}</span>
          <div className="flex gap-4 px-2">
            <button className="text-gray-400 hover:text-gray-600"><Download className="w-4 h-4" /></button>
            <button className="text-gray-400 hover:text-gray-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        ))
      : <p className="text-left  text-gray-500">No notes available</p>}
      </div>

    </div>
  </div>

  )
}



