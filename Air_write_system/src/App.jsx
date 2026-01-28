import React from 'react';
import './App.css'
import Header from './components/header';
import { Outlet } from 'react-router-dom';
import Features from './pages/features';
function App (){
  return(
    <>
    <Header />
    <Outlet />
    </>
  )
}

export default App;