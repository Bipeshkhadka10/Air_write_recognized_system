import React from "react";
import { FiPlay } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Features from "./features";
import About from "./about";
import Documentation from "./documentation";

function Home(){
    const Navigate = useNavigate();
    return(
        <>
        <div className="container">
            <div className="content-left" >
                <div className="content-warp" style={{marginTop:"10vh"}}>
                    <h1 style={{margin:'0'}}>Write in the Air.</h1>
                    <h1 style={{margin:'0', color:"#4a6cf7"}}>Capture it Digitally.</h1>
                </div>
                <div className="content-left-text">
                    <p>Transform yout hand gesture into digital text. Our AI-Powered system tracks your fingertip movement in real-time, recoginzing
                        characters ad you write in the air.
                    </p>
                </div>
                <div className="content-left-btn">
                    <button className="btns primary" onClick={()=>{Navigate('/Signup')}}>Get Started Free</button>
                    <button className="btns secondary"><FiPlay style={{paddingRight:'2px'}} /> PlayTry Demo</button>
                </div>
                <div className="content-left-efficiency">
                    <div className="warp-eff">
                        <span className="sys-efficiency">98%</span>
                        <p>Accuracy</p>
                    </div>
                    <div className="warp-eff">
                        <span className="sys-efficiency">30ms</span>
                        <p>Latency</p>
                    </div>
                    <div className="warp-eff">
                        <span className="sys-efficiency">26</span>
                        <p>Characters</p>
                    </div>
                </div>
            </div>
            <div className="content-right">
                
            </div>
        </div>
        
        <Features/>
        <About />
        <Documentation />
        </>
    )
}

export default Home;