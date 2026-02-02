import React from 'react'
import { FaHandPaper } from 'react-icons/fa' ;
import { MdPanTool } from "react-icons/md";
import { FiZap } from "react-icons/fi";
import { FiEye } from "react-icons/fi";
import { GiArtificialIntelligence } from "react-icons/gi";
import { FiCpu } from "react-icons/fi";

import { FiFileText } from "react-icons/fi";
import { FiDownload } from "react-icons/fi";





export default function Features() {
  return (
    <div className='content-wapper'>
      <div className="content-title">
        <h1>Powered by <span className='title-edt'>Advanced AI</span></h1>
        <p>Our system combines cutting-edge technologies to delivers seamless air
          <br />writing recognition.</p>
      </div>
      
      <div className="card-warpper">
        <div className="card-content">
          <div className="card"><span><FaHandPaper size={20} color='#4a6cf7'  /></span>
            <h2 className='card-title'>AI Hand Tracking</h2>
            <p className='card-text'>MediaPipe-powered fingertip detection track your hand movements with precision in real-time.</p>
          </div>
        </div>
        <div className="card-content">
          <div className="card"><span><FiZap size={20} color='#4a6cf7' /></span>
            <h2 className='card-title'>Real-Time Recognition</h2>
            <p className='card-text'>Our CNN model processes and recognizes characters instantly as you write in the air.</p>
          </div>
        </div> 
        <div className="card-content">
          <div className="card"><span><FiEye size={20} color='#4a6cf7'/></span>
            <h2 className='card-title'>OpenCV Processing</h2>
            <p className='card-text'>Advanced stroke processing and noise reduction for clean, accurate character capture.</p>
          </div>
        </div> 
        <div className="card-content">
          <div className="card"><span><FiCpu size={20} color='#4a6cf7'/></span>
            <h2 className='card-title'>Deep Learning Model</h2>
            <p className='card-text'>Trained on thousands of handwritten samples for high accuracy character recognition.</p>
          </div>
        </div> 
        <div className="card-content">
          <div className="card"><span><FiFileText size={20} color='#4a6cf7'  /></span>
            <h2 className='card-title'>Note Management</h2>
            <p className='card-text'>Save, organize, and manage all your air-written notes in one place.</p>
          </div>
        </div> 
        <div className="card-content">
          <div className="card"><span><FiDownload size={20} color='#4a6cf7'  /></span>
            <h2 className='card-title'>Export Options</h2>
            <p className='card-text'>Export your notes as PDF, text files, or images for easy sharing and storage.</p>
          </div>
        </div> 
         
      </div>

      

    </div>
  )
}
