import {createBrowserRouter,RouterProvider} from 'react-router-dom';
import Home from '../pages/home';
import App from '../App';
import Signup from '../pages/signup';
import Signin from '../pages/signin';
import Features from '../pages/features';
import About from '../pages/about';
import Documentation from '../pages/documentation';
import ForgetPassword from '../pages/forgetPassword';
import UserDashbord from '../pages/userDashbord';
import Notes from './notes';
import Dashboard from './dashboard';
import LiveWriting from './liveWriting';
import ModelStatus from './modelStatus';
import Settings from './settings';
import ProtectedRoute from './protectedRoute';
    const router = createBrowserRouter([
        {
            path:'/',
            element:<App />,
            children:[
                {index:true, element:<Home/> },
                {path:'features', element:<Features/>},
                {path:'about', element:<About/>},
                {path:'documentation', element:<Documentation/>},
                {path:'signin', element:<Signin/>},
                {path:'signup', element:<Signup/>},
                {path:'forgot-password', element:<ForgetPassword/>},
            ]
        },
        {   
            path:'/dashboard',
            element:<ProtectedRoute><UserDashbord /></ProtectedRoute>,
            children:[
              {index:true ,element:<Dashboard/> },
              {path:'livewriting', element:<LiveWriting/> },
              {path:'notes', element:<Notes/> },
              {path:'modelstatus', element:<ModelStatus/> },
              {path:'settings', element:<Settings/> },
            ]
        }
    ])

export default router;
