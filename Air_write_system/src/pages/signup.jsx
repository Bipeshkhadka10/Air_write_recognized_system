import React from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import { useState,useEffect,useActionState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {FiUser,FiMail,FiLock,FiUnlock} from "react-icons/fi";
import { Link } from "react-router-dom";


async function handleFormSubmit(prev, formData) {
    //taking data from form
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');


    // regex for validating each fields
    const nameRegex = /^[a-zA-Z\s]{3,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/


    // performing validation here
    const error={};
    
    // name validation
    if(name === ''){
        error.name = "Name is required";
    }else if(name.trim().length < 3){
        error.name = "Name must be at least 3 characters long";
    }else if(!nameRegex.test(name)){
        error.name = "Name can only contain letters and spaces";
    }
    // email validation
    if(email ===''){
        error.email = "Email is required";
    }else if(!emailRegex.test(email)){
        error.email = "Invalid email format";
    }else if(!password){
        error.password = "Password is required";
    }else if(password.length < 8 || password.length >20){
        error.password = "Password must be between 8 and 20 characters";
    }else if(!passwordRegex.test(password)){
        error.password = "Password must contain at least one uppercase letter, lowercase letter, number, and special character";
    }
    // confirm password validation
    if(!confirmPassword){
        error.confirmPassword = "Please confirm your password";
    }else if(password !== confirmPassword){
        error.confirmPassword = "passwords do not match";
    }

    //checking for any error to send data to server
    if(Object.keys(error).length > 0){
        return{
            success:false,
            error:error
        }
    }

    // sending data to server
    try {
        const response = await api.post('/user/register',{name,email,password});
        console.log(response);
        return({success:true,
            message:"successfuly signup"
        })
    } catch (error) {
        if(error.response?.status === 409){
            return({
                success:false,
                error:{email:"Email already exists. Please use a different email."}
            })
        }
        return({
            success:false,
            error:"failed to signup. Please try again."
        })
    }

} 



function Signup(){

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [data,formAction,isPending] = useActionState(handleFormSubmit,{
        success:false,
        error:{}
    });
    const navigate = useNavigate();

    useEffect(()=>{
        if(data?.success){
            // redirect to dashboard or signin page
            navigate('/signin');
            console.log('signup successfully');
        }
    },[data])
    return(
        <div className="login-container">
        <div className="login-content">

        <div id="logo-content">
            <div id="logo">
                <Link to='/'><img src="../public/logo.jpg" alt="logo" title="Air_write_system" /></Link>
            </div>
            <div id="logo-discp">
                <h2 className="font-bold">Create Account</h2>
                <p className="text">Start writing in the air today.</p>
            </div>
        </div>

        {/* form for user to signin  */}
        <form action={formAction} method="post">
        
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
                <input type={showConfirmPassword ? "text" : "password"} name="confirm-password" id="confirm-password" placeholder="confirm your password"  required/>
                <span className="toggle-eye" onClick={()=>{setShowConfirmPassword(!showConfirmPassword)}}>{ showConfirmPassword ? <FiUnlock/> :<FiLock/> }</span>
            </div>
        </div>
         
        <div className="login-controls">
            <div id="remember-content" style={{margin:"14px 0px", float:"left"}}>
                <input type="checkbox" id="remember-password" />
                <label htmlFor="remember-password">I agree to the <span className="links">Terms of Service </span> and <span className="links">Privacy policy</span></label>
            </div>
            
        </div>

        <button type="submit" disabled={isPending} id="signin-btn">{isPending ? "Creating Account":"Create Account"}</button>

        <br />
        <p id="continue-line"><span>or continue with</span></p>

        <br />
        <div className="btn-other">
            <button className="continue-btn social-btn"><FcGoogle className="icon" /> Google</button>
            <button className="continue-btn social-btn"><FaGithub className="icon" /> GitHub</button>
        </div>
        <p className="text">Already have an account? <span className="links"><Link to='/signin'>Sign In</Link></span></p>
        </form>
       
        </div>
        <svg width="100%" height="100%" id="svg" viewBox="0 0 1440 490" xmlns="http://www.w3.org/2000/svg" className="transition duration-300 ease-in-out delay-150"><defs><linearGradient id="gradient" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="5%" stop-color="#F78DA7"></stop><stop offset="95%" stop-color="#8ED1FC"></stop></linearGradient></defs><path d="M 0,500 L 0,187 C 100.53571428571428,213.53571428571428 201.07142857142856,240.07142857142858 319,210 C 436.92857142857144,179.92857142857142 572.25,93.24999999999999 709,110 C 845.75,126.75000000000001 983.9285714285713,246.92857142857144 1106,277 C 1228.0714285714287,307.07142857142856 1334.0357142857142,247.03571428571428 1440,187 L 1440,500 L 0,500 Z" stroke="none" stroke-width="0" fill="url(#gradient)" fill-opacity="1" class="transition-all duration-300 ease-in-out delay-150 path-0"></path></svg>
        </div>
    )
}

export default  Signup;