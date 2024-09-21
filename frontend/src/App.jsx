
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './pages/login'
import Signup from './pages/signup'
import { useSelector } from "react-redux";
import ProtectedRoute from './redux/protectedRoute'
import UserRegister from './pages/userRegister'
import { InventoryPageComponent } from './pages/inventory-page';
import BrandPhones from './pages/singleBrand';
import PurchaseTransactions from './pages/purchase';
import PurchaseTransactionForm from './components/purchase-transaction-form';
import SinglePhone from './pages/singlePhone';
import SalesTransactionForm from './components/sales-transaction-form';
import SalesTransactions from './pages/sales';
import SchemePageComponent from './pages/schemes';
import BrandSchemePage from './pages/brandscheme';
import SchemeForm from './components/scheme-form';
import SingleScheme from './pages/singlescheme';
import PPPageComponent from './pages/priceprotection';
import BrandPPPage from './pages/brandpp';
import SinglePP from './pages/singlepp';
import PriceProtectionForm from './components/price-protection-form';
import LandingPage from './components/landing-page';
import { VendorPage } from './pages/vendors';
import VendorBrand from './pages/vendorsbrand';
import EditPurchaseTransactionForm from './components/editpurchase';
import EditSalesTransactionForm from './components/editsales';
import EditSchemeForm from './components/editschemes';
import EditPriceProtectionForm from './components/editpp';
import VendorForm from './components/postVendors';
// import VendorTransactionForm from './pages/transaction-vendors';

function App() {
  const { isAuthenticated } = useSelector((state) => state.root);
  return (
   <Routes>
    <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
    <Route path="/" element={<LandingPage/>}/>
    <Route path="/inventory" element={<InventoryPageComponent/>} />
    <Route path = "/brand/:id" element={<BrandPhones/>}/>
    <Route path = "/phone/:id" element={<SinglePhone/>}/>
    <Route path = "/purchases/" >
    <Route path = "" element = {<PurchaseTransactions/>} />
    <Route path = "form" element = {<PurchaseTransactionForm/>}/>
    <Route path = "editform/:purchaseId" element = {<EditPurchaseTransactionForm/>} />
    </Route>
    <Route path = "/sales/" >
    <Route path = "" element = {<SalesTransactions/>}/>
    <Route path = "form" element = {<SalesTransactionForm/>}/>
    <Route path = "editform/:salesId" element = {<EditSalesTransactionForm/>} />

    </Route>
    </Route>
    <Route path = "/schemes/" >
    <Route path = "" element = {<SchemePageComponent/>} />
    <Route path = "brand/:id" element = {<BrandSchemePage/>} />
    <Route path = "new" element = {<SchemeForm/>} />
    <Route path = ":id" element = {<SingleScheme/>} />
    <Route path = "editform/:schemeId" element = {<EditSchemeForm/>} />


    </Route>

    <Route path = "/price-protection/" >
    <Route path='' element = {<PPPageComponent/>}/>
    <Route path = "brand/:id" element = {<BrandPPPage/>} />
    <Route path = ":id" element = {<SinglePP/>} />
    <Route path = "new" element = {<PriceProtectionForm/>} />
    <Route path = "editform/:priceProtectionId" element = {<EditPriceProtectionForm/>} />

    </Route>

    <Route path = "/vendors/"  >
    <Route path = "" element = {<VendorPage/>} />
    <Route path = "brand/:id" element = {<VendorBrand/>} />
    </Route>
    
    {/* <Route path = "/test" element = {<VendorTransactionForm/>} /> */}


    <Route path="/login" element={<Login/>}/>
    <Route path="/signup" element={<Signup/>}/>
    <Route path='/register' element={<UserRegister/>}/>

    
      </Routes>
  )
}

export default App
