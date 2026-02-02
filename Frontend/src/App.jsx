import React from 'react';
import './App.css'
import Header from './components/header';
import { Outlet } from 'react-router-dom';
import Features from './pages/features';
import Footer from'./components/footer';
function App (){
  return(
    <>
    <Header />
    <Outlet />
    <Footer/>
    </>
  )
}

export default App;