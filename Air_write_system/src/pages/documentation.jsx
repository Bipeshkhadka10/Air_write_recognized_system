import React from 'react'
import { FaGraduationCap } from "react-icons/fa";
import { MdAccessibilityNew } from "react-icons/md";
import { FaChalkboardTeacher } from "react-icons/fa";
import { FaUsers } from "react-icons/fa";



export default function Documentation() {
  return (
    <div className='content-wapper'>
          <div className="content-title">
            <h1>Use Cases & <span className='title-edt'>Applications</span></h1>
            <p>Discover how air writing technology transforms various industries and use <br /> cases.</p>
          </div>
          
          <div className="card-warpper">
            <div className="application-card">
              <div className="card-image">
                <img src="/public/edu.webp" alt="education-picture" />
                <div className="icon-disc">
                  <FaGraduationCap size={28} color="#4C6FFF" />
                </div>
              </div>
              <div className='card-disc'>
                <h2 className='card-title edu'>Education</h2>
                <p className='card-text'>Interactive learning for students. Practice writing letters, take notes
                  in class, or solve math problems in the air.</p>
              </div>
            </div> 
            <div className="application-card">
              <div className="card-image">
                <img src="/public/pre.webp" alt="presentation-picture" />
                <div className="icon-disc">
                  <FaChalkboardTeacher size={28} color="#4C6FFF" />
                </div>
              </div>
              <div className='card-disc'>
                <h2 className='card-title edu'>Presentations</h2>
                <p className='card-text'>Annotate slides, draw diagrams, and engage your audience with gesture-based interactions during presentations.</p>
              </div>
            </div>   
             <div className="application-card">
              <div className="card-image">
                <img src="/public/acc.webp" alt="Accessiblity-picture" />
                <div className="icon-disc">
                  <MdAccessibilityNew size={28} color="#4C6FFF" />
                </div>
              </div>
              <div className='card-disc'>
                <h2 className='card-title edu'>Accessibility</h2>
                <p className='card-text'>Enable hands-free text input for users with mobility challenges or those unable to use traditional input methods.</p>
              </div>
            </div>
             <div className="application-card">
              <div className="card-image">
                <img src="/public/coll.webp" alt="collaboration-picture" />
                <div className="icon-disc">
                  <FaUsers size={28} color="#4C6FFF" />
                </div>
              </div>
              <div className='card-disc'>
                <h2 className='card-title edu'>Collaboration</h2>
                <p className='card-text'>Brainstorm together in virtual meetings, sketch ideas, and share air-written notes with team members.</p>
              </div>
            </div>
                      
          </div>
    
          
    
        </div>
  )
}
