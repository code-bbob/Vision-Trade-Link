
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './pages/login'
import Signup from './pages/signup'
import { useSelector } from "react-redux";
import ProtectedRoute from './redux/protectedRoute'
import UserRegister from './pages/userRegister'
import Homepage from './pages/home';
import { InventoryPageComponent } from './pages/inventory-page';
import BrandPhones from './pages/singleBrand';
import PurchaseTransactions from './pages/purchase';
import PurchaseTransactionForm from './components/purchase-transaction-form';
import SinglePhone from './pages/singlePhone';
import SalesTransactionForm from './components/sales-transaction-form';
import SalesTransactions from './pages/sales';
import SchemePageComponent from './pages/schemes';
import BrandSchemePage from './pages/brandscheme';


function App() {
  const { isAuthenticated } = useSelector((state) => state.root);
  return (
   <Routes>
    <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
    <Route path="/" element={<Homepage/>}/>
    <Route path="/inventory" element={<InventoryPageComponent/>} />
    <Route path = "/brand/:id" element={<BrandPhones/>}/>
    <Route path = "/phone/:id" element={<SinglePhone/>}/>
    <Route path = "/purchases/" >
    <Route path = "" element = {<PurchaseTransactions/>} />
    <Route path = "form" element = {<PurchaseTransactionForm/>}/>
    </Route>
    <Route path = "/sales/" >
    <Route path = "" element = {<SalesTransactions/>}/>
    <Route path = "form" element = {<SalesTransactionForm/>}/>
    </Route>
    </Route>
    <Route path = "/schemes/" >
    <Route path = "" element = {<SchemePageComponent/>} />
    <Route path = ":id" element = {<BrandSchemePage/>} />

    </Route>

    <Route path="/login" element={<Login/>}/>
    <Route path="/signup" element={<Signup/>}/>
    <Route path='/register' element={<UserRegister/>}/>

    
      </Routes>
  )
}

export default App
