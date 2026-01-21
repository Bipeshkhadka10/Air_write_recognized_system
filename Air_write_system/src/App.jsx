import React from 'react';


function App (){
  return(
    <>
    <div className='hello-world'>
       <video id="webcam" autoplay playsinline></video>
       <canvas class="output_canvas" id="output_canvas" width="1280" height="720" style="position: absolute; left: 0px; top: 0px;"></canvas>
    </div>
    
    </>
  )
}

export default App;