import React from "react";
import { useState,useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {FiUser,FiMail,FiLock,FiUnlock} from "react-icons/fi";


function Signup(){

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return(
        <div className="login-container">
        <div className="login-content">

        <div id="logo-content">
            <div id="logo">
                <img src="../public/logo.jpg" alt="logo" title="Air_write_system" />
            </div>
            <div id="logo-discp">
                <h2>Create Account</h2>
                <p className="text">Start writing in the air today.</p>
            </div>
        </div>

        {/* form for user to signin  */}
        <form action="/submit" method="post">
        
        <div className="form-content">
            <div className="name-field">
              <label htmlFor="name">Full Name</label>
              <input type="text" name="name" id="name" placeholder="enter your name"  required autoFocus/>
              <FiUser className="icons"/>
              <br />
            </div>
            <div className="email-field">
              <label htmlFor="email">Email</label>
              <input type="email" name="email" id="email" placeholder="name@example.com"  required />
              <FiMail className="icons"/>
              <br />
            </div>
            <label htmlFor="password">Password</label>
            <div className="password-field">
                <input type={showPassword ? "text" : "password"} name="password" id="password" placeholder="enter your password"  required/>
                <span className="toggle-eye" onClick={()=>{setShowPassword(!showPassword)}}>{ showPassword ? <FiUnlock/> :<FiLock/> }</span>
            </div>
            <br />
            <label htmlFor="confirm-password">Confirm Password</label>
            <div className="password-field">
                <input type={showConfirmPassword ? "text" : "password"} name="password" id="confirm-password" placeholder="confirm your password"  required/>
                <span className="toggle-eye" onClick={()=>{setShowConfirmPassword(!showConfirmPassword)}}>{ showConfirmPassword ? <FiUnlock/> :<FiLock/> }</span>
            </div>
        </div>
         
        <div className="login-controls">
            <div id="remember-content" style={{margin:"14px 0px", float:"left"}}>
                <input type="checkbox" id="remember-password" />
                <label htmlFor="remember-password ">I agree to the <span className="links">Terms of Service </span> and <span className="links">Privacy policy</span></label>
            </div>
            
        </div>

        <button type="submit" id="signin-btn">Create Account</button>

        <br />
        <p id="continue-line"><span>or continue with</span></p>

        <br />
        <div className="btn-other">
            <button className="continue-btn social-btn"><FcGoogle className="icon" /> Google</button>
            <button className="continue-btn social-btn"><FaGithub className="icon" /> GitHub</button>
        </div>
        <p className="text">Already have an account? <span className="links">Sign in</span></p>
        </form>
       
        </div>
        <svg width="100%" height="100%" id="svg" viewBox="0 0 1440 490" xmlns="http://www.w3.org/2000/svg" class="transition duration-300 ease-in-out delay-150"><defs><linearGradient id="gradient" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="5%" stop-color="#F78DA7"></stop><stop offset="95%" stop-color="#8ED1FC"></stop></linearGradient></defs><path d="M 0,500 L 0,187 C 100.53571428571428,213.53571428571428 201.07142857142856,240.07142857142858 319,210 C 436.92857142857144,179.92857142857142 572.25,93.24999999999999 709,110 C 845.75,126.75000000000001 983.9285714285713,246.92857142857144 1106,277 C 1228.0714285714287,307.07142857142856 1334.0357142857142,247.03571428571428 1440,187 L 1440,500 L 0,500 Z" stroke="none" stroke-width="0" fill="url(#gradient)" fill-opacity="1" class="transition-all duration-300 ease-in-out delay-150 path-0"></path></svg>
        </div>
    )
}

export default  Signup;