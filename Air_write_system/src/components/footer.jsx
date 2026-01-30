import React from 'react'
import { FiGithub, FiTwitter,FiLinkedin,FiMail } from 'react-icons/fi';
import { Link ,useNavigate} from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  return (
    <div className='footer-container'>
          <div className="footer-warpper">
            <div className="footer-left">
              <div className='footer-logo' onClick={()=>{navigate('/')}}>
                <img src="/logo.jpg" alt="Air_write_system" title='Air-write' />
                <h2 className='logo-name'>AirWrite</h2>
              </div>
              <div className="footer-text">
                <p>Transform your hand gestures into digital text <br /> with our AI-powered air writing recognition <br /> system</p>
              </div>
              <div className="footer-social">
                <div className='social-platform'><FiGithub size={20} color='#4a4d55f5'/></div>
                <div className='social-platform'><FiTwitter size={20} color='#4a4d55f5'/></div>
                <div className='social-platform'><FiLinkedin size={20} color='#4a4d55f5'/></div>
                <div className='social-platform'><FiMail size={20} color='#4a4d55f5'/></div>
              </div>
            </div>
            <div className="footer-right">
              <div className='footer-list'>
                <div className="product-list">
                  <h3>Product an Company</h3>
                  <li><Link>Features</Link></li>
                  <li><Link>Blogs</Link></li>
                  <li><Link>About</Link></li>
                  <li><Link>Documntation</Link></li>
                </div>
                <div className="legal-list">
                  <h3>Legal</h3>
                  <li><Link>Privacy</Link></li>
                  <li><Link>Terms</Link></li>
                  <li><Link>License</Link></li>
                </div>
              </div>
            </div>
           
          </div>
           <div className="copy-right">
            <p className='copy-right-text'>© 2026 AirWrite. All rights reserved.</p>
            <p className='copy-right-text'>Built with ❤️ using MediaPipe, OpenCV & TensorFlow</p>
            
          </div>
    </div>
  )
}
