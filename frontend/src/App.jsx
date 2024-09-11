
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './pages/login'
import Signup from './pages/signup'
import { useSelector } from "react-redux";
import ProtectedRoute from './redux/protectedRoute'
import UserRegister from './pages/userRegister'
import Homepage from './pages/home';


function App() {
  const { isAuthenticated } = useSelector((state) => state.root);
  return (
   <Routes>
    <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
    <Route path="/" element={<Homepage/>}/>

        </Route>

    <Route path="/login" element={<Login/>}/>
    <Route path="/signup" element={<Signup/>}/>
    <Route path='/register' element={<UserRegister/>}/>

    
      </Routes>
  )
}

export default App
