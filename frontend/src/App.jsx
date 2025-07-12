import { Route, Routes } from "react-router-dom";
import "./App.css";
import Login from "./pages/login";
import Signup from "./pages/signup";
import { useSelector } from "react-redux";
import ProtectedRoute from "./redux/protectedRoute";
import UserRegister from "./pages/userRegister";
import AllLandingPage from "./pages/allLandingPage";
import AllPurchaseTransactions from "./pages/allPurchase";
import AllPurchaseTransactionForm from "./components/allpurchasetransactionform";
import EditAllPurchaseTransactionForm from "./components/editallpurchase";
import {AllInventoryPageComponent} from "./pages/allInventoryPage";
import AllBrandProducts from "./pages/allsinglebrand";
import AllSalesTransactions from "./pages/allSales";
import AllSalesTransactionForm from "./components/allsalestransactionform";
import useGlobalKeyPress from "./hooks/globalKeyPress";
import AllVendorPage  from "./pages/allvendors";
import EditAllSalesTransactionForm from "./components/editallsales";
import AllVendorTransactions from "./pages/allvendortransactions";
import AllVendorTransactionForm from "./pages/allvendortransactionform";
import EditAllVendorTransactionForm from "./components/editallvendortransactions";
import AllSalesReport from "./pages/allSalesReport";
import AllPurchaseReturns from "./pages/allPurchaseReturn";
import InvoicePage from "./pages/invoicePage";
import EditProductForm from "./components/editProductForm";
import AllSalesReturns from "./pages/allSalesReturn";
import StaffPage from "./pages/staffs";
import StaffTransactions from "./pages/stafftransactions";
import StaffTransactionForm from "./pages/staffTransactionForm";
import StaffTransactionEditForm from "./pages/editStaffTransactionForm";
import AllDebtorsPage from "./pages/allDebtorsPage";
import AllDebtorTransactions from "./pages/allDebtorTransactions";
import EditDebtorTransactionForm from "./pages/editAllDebtors";
import DebtorTransactionForm from "./pages/allDebtorTransactionForm";
import AllVendorStatementPage from "./pages/allVendorStatementPage";
import AllDebtorStatementPage from "./pages/allDebtorStatementPage";
import BranchSelection from "./pages/branchSelection";

function App() {
  const { isAuthenticated, branchSelected } = useSelector((state) => state.root);
  useGlobalKeyPress();
  return (
    <Routes>
      {/* Protected Routes */}
      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} branchSelected={branchSelected} />}>
        {/* All Landing Page */}
        <Route path="/" element={<AllLandingPage />} />

        <Route path="/purchases" element={<AllPurchaseTransactions />} />
        <Route path="/purchases/branch/:branchId" element={<AllPurchaseTransactions />} />
        <Route path="/purchases/bform" element={<AllPurchaseTransactionForm />} />
        <Route path="/purchases/form/branch/:branchId" element={<AllPurchaseTransactionForm />} />
        <Route path="/purchases/editform/:purchaseId/branch/:branchId" element={<EditAllPurchaseTransactionForm />} />

        <Route path="/purchase-returns" element={<AllPurchaseReturns/>}/>
        <Route path="/purchase-returns/branch/:branchId" element={<AllPurchaseReturns/>}/>

        <Route path="/inventory" element={<AllInventoryPageComponent />} />
        <Route path="/inventory/branch/:branchId" element={<AllInventoryPageComponent />} />
        <Route path="/inventory/brand/:id" element={<AllBrandProducts />} />
        <Route path="/inventory/brand/:id/branch/:branchId" element={<AllBrandProducts />} />
        <Route path="/inventory/editproduct/:productId/branch/:branchId" element={<EditProductForm/>} />

        <Route path="/sales" element={<AllSalesTransactions />} />
        <Route path="/sales/branch/:branchId" element={<AllSalesTransactions />} />
        <Route path="/sales/form" element={<AllSalesTransactionForm />} />
        <Route path="/sales/form/branch/:branchId" element={<AllSalesTransactionForm />} />
        <Route path="/sales/editform/:salesId/branch/:branchId" element={<EditAllSalesTransactionForm />} />

        <Route path="/sales-returns" element={<AllSalesReturns/>}/>
        <Route path="/sales-returns/branch/:branchId" element={<AllSalesReturns/>}/>
        <Route path="/sales-report/branch/:branchId" element={<AllSalesReport/>}/>
        <Route path="/staff" element={<StaffPage/>}/>
        <Route path="/staff/branch/:branchId" element={<StaffPage/>}/>

        <Route path="/vendors" element={<AllVendorPage />} />
        <Route path="/vendors/branch/:branchId" element={<AllVendorPage />} />
        <Route path="/vendors/statement/:vendorId" element={<AllVendorStatementPage />} />

        <Route path="/invoice/:transactionId" element={<InvoicePage />} />

        <Route path="/vendor-transactions/branch/:branchId" element={<AllVendorTransactions />}/>
        <Route path="/vendor-transactions/form/branch/:branchId" element={<AllVendorTransactionForm />} />
        <Route path="/vendor-transactions/editform/:vendorTransactionId/branch/:branchId" element={<EditAllVendorTransactionForm />} />
        <Route path="/vendor-transactions/branch/:branchId/editform/:vendorTransactionId" element={<EditAllVendorTransactionForm />} />

        <Route path="/staff-transactions" element={<StaffTransactions />}/>
        <Route path="/staff-transactions/branch/:branchId" element={<StaffTransactions />}/>
        <Route path="/staff-transactions/:id" element={<StaffTransactions />}/> 
        <Route path="/staff-transactions/form" element={<StaffTransactionForm />}/>
        <Route path="/staff-transactions/form/branch/:branchId" element={<StaffTransactionForm />}/>
        <Route path="/staff-transactions/editform/:id" element={<StaffTransactionEditForm />}/> 
        <Route path="/staff-transactions/branch/:branchId/editform/:id" element={<StaffTransactionEditForm />}/> 

        <Route path="/debtors" element={<AllDebtorsPage />} />
        <Route path="/debtors/branch/:branchId" element={<AllDebtorsPage />} />
        <Route path="/debtor-transactions" element={<AllDebtorTransactions />} />
        <Route path="/debtor-transactions/branch/:branchId" element={<AllDebtorTransactions />} />
        <Route path="/debtor-transactions/form" element={<DebtorTransactionForm />} />
        <Route path="/debtor-transactions/form/branch/:branchId" element={<DebtorTransactionForm />} />
        <Route path="/debtor-transactions/editform/:debtorTransactionId" element={<EditDebtorTransactionForm />} />
        <Route path="/debtor-transactions/branch/:branchId/editform/:debtorTransactionId" element={<EditDebtorTransactionForm />} />
        <Route path="/debtors/statement/:debtorId" element={<AllDebtorStatementPage />} />


        
      </Route>

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/register" element={<UserRegister />} />
    </Routes>
  );
}

export default App;
