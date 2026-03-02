import { Link , useNavigate } from "react-router-dom";

function Header() {
    const navigate = useNavigate();
  return (
    <nav>
       <div className="header">
            <div className="logo" onClick={()=>{navigate('/')}} style={{cursor:"pointer"}}>
                <img src="/logo2.png" alt="Air_write_logo" className="w-50 transition hover:scale-102" />
            </div>
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/features">Features</Link></li>
                <li><Link to='/about'>About</Link></li>
                <li><Link to='/documentation'>Documentation</Link></li>
            </ul>
      
            <div className="user-controls">
                <span className="register-left"><Link to='/signin' >Sign in</Link></span>
                <span className="register-right"><Link to='/signup' >Get Started</Link></span>
            </div>
        </div>
    </nav>
  );
}

export default Header;
