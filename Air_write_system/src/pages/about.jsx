import React from 'react'
import { FiCamera } from "react-icons/fi";
import { FiCpu } from "react-icons/fi";
import { GiBrain } from "react-icons/gi";
import { FiFileText } from "react-icons/fi";

export default function About() {
  return (
    <div className='content-wapper'>
         <div className="content-title">
           <h1>How it <span className='title-edt'>Works</span></h1>
           <p>A seamless pipeline from hand gesture to digital text, powered by state-of-the- <br /> art AI.</p>
         </div>
         
         <div className="card2-warpper">
           <div className="card2-content">
             <div className="card2 card-line">
                <div className="icon-box">
                  <FiCamera size={26} />
                </div>
                <span>step 1</span>
                <h2 className='card2-title'>Video Capture</h2>
                <p className='card2-text'>Webcam captures hand movements</p>
             </div>
             <div className="card2">
                <div className="icon-box">
                  <FiCpu size={26} />
                </div>
                <span>step 2</span>
                <h2 className='card2-title'>MediaPipe Processing</h2>
                <p className='card2-text'>Fingertip detection & tracking</p>
             </div>
             <div className="card2">
                <div className="icon-box">
                  <GiBrain size={26} />
                </div>
                <span>step 3</span>
                <h2 className='card2-title'>CNN Recognition</h2>
                <p className='card2-text'>Character classification</p>
             </div>
             <div className="card2">
                <div className="icon-box">
                  <FiFileText size={26} />
                </div>
                <span>step 4</span>
                <h2 className='card2-title'>Output</h2>
                <p className='card2-text'>Digital text & notes</p>
             </div>
           </div> 
         </div>
   
         
   
       </div>
  )
}
