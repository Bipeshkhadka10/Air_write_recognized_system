import React from "react";
import { useState,useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { FiLock, FiUnlock } from "react-icons/fi";


function Signin(){

    const [showPassword, setShowPassword] = useState(false);

    return(
        <div className="login-container">
        <div className="login-content">

        <div id="logo-content">
            <div id="logo">
                <img src="../public/logo.jpg" alt="logo" title="Air_write_system" />
            </div>
            <div id="logo-discp">
                <h2>Welcome Back</h2>
                <p className="text">Sign in to continue to AirWrite</p>
            </div>
        </div>

        {/* form for user to signin  */}
        <form action="/submit" method="post">
        
        <div className="form-content">
            <label htmlFor="email">Email</label>
            <input type="email" name="email" id="email" placeholder="name@example.com"  required autoFocus/>
            <br />
            <label htmlFor="password">password</label>
            <div className="password-field">
                <input type={showPassword ? "text" : "password"} name="password" id="password" placeholder="enter your password"  required/>
                <span className="toggle-eye" onClick={()=>{setShowPassword(!showPassword)}}>{ showPassword ? <FiUnlock/> :<FiLock/> }</span>
             </div>
        </div>
         
        <div className="login-controls">
            <div id="remember-content">
                <input type="checkbox" id="remember-password" />
                <label htmlFor="remember-password">Remember me</label>
            </div>
            <p><span className="links">Forgot password?</span></p>
        </div>

        <button type="submit" id="signin-btn">Sign In</button>

        <br />
        <p id="continue-line"><span>or continue with</span></p>

        <br />
        <div className="btn-other">
            <button className="continue-btn social-btn"><FcGoogle className="icon" /> Google</button>
            <button className="continue-btn social-btn"><FaGithub className="icon" /> GitHub</button>
        </div>
        <p className="text">Don't have an account? <span className="links">Sign up</span></p>
        </form>
       
        </div>
        <svg width="100%" height="100%" id="svg" viewBox="0 0 1440 390" xmlns="http://www.w3.org/2000/svg" class="transition duration-300 ease-in-out delay-150"><defs><linearGradient id="gradient" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="5%" stop-color="#F78DA7"></stop><stop offset="95%" stop-color="#8ED1FC"></stop></linearGradient></defs><path d="M 0,400 L 0,225 C 125.19999999999999,276.2 250.39999999999998,327.4 408,292 C 565.6,256.6 755.5999999999999,134.6 933,84 C 1110.4,33.400000000000006 1275.2,54.2 1440,75 L 1440,400 L 0,400 Z" stroke="none" stroke-width="0" fill="url(#gradient)" fill-opacity="1" class="transition-all duration-300 ease-in-out delay-150 path-0"></path></svg>
        </div>
    )
}

export default  Signin;