import { Link } from "react-router-dom";

function Header() {
  return (
    <nav>
       <div className="header">
            <div className="logo">
                <h1>AirWrite</h1>
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
