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
import AllVendorPage  from "./pages/allVendors";
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
import AllBranchSelectionPage from "./pages/allBranchSelect";
import StaffTransactions from "./pages/stafftransactions";
import StaffTransactionForm from "./pages/staffTransactionForm";
import StaffTransactionEditForm from "./pages/editStaffTransactionForm";
import AllDebtorsPage from "./pages/allDebtorsPage";
import AllDebtorTransactions from "./pages/allDebtorTransactions";
import EditDebtorTransactionForm from "./pages/editAllDebtors";
import DebtorTransactionForm from "./pages/allDebtorTransactionForm";
import AllVendorStatementPage from "./pages/allVendorStatementPage";
import AllDebtorStatementPage from "./pages/allDebtorStatementPage";


function App() {
  const { isAuthenticated } = useSelector((state) => state.root);
  useGlobalKeyPress();
  return (
    <Routes>
      {/* Protected Routes */}
      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        {/* All Landing Page */}
        <Route path="/" element={<AllLandingPage />} />

        <Route path="/purchases" element={<AllBranchSelectionPage pageName="purchases" />} />
        <Route path="/purchases/branch/:branchId" element={<AllPurchaseTransactions />} />

        <Route path="/purchases/form/branch/:branchId" element={<AllPurchaseTransactionForm />} />
        <Route path="purchases/branch/:branchId/editform/:purchaseId" element={<EditAllPurchaseTransactionForm />} />

        <Route path = "purchase-returns" element = {<AllBranchSelectionPage pageName="purchase-returns" />}/>
        <Route path = "purchase-returns/branch/:branchId" element = {<AllPurchaseReturns/>}/>


        <Route path="inventory" element={<AllBranchSelectionPage pageName="inventory" />} />
        <Route path="inventory/branch/:branchId" element={<AllInventoryPageComponent />} />

        <Route path="inventory/branch/:branchId/brand/:id" element={<AllBrandProducts />} />
        <Route path="/inventory/branch/:branchId/editproduct/:productId" element={<EditProductForm/>} />



        <Route path="brand/:id" element={<AllBrandProducts />} />

        <Route path="sales" element={<AllBranchSelectionPage pageName="sales" />} />
        <Route path="sales/branch/:branchId" element={<AllSalesTransactions />} />

        <Route path="sales/form/branch/:branchId" element={<AllSalesTransactionForm />} />
        <Route path="sales/branch/:branchId/editform/:salesId" element={<EditAllSalesTransactionForm />} />

        <Route path = "sales-returns" element = {<AllBranchSelectionPage pageName="sales-returns" />}/>
        <Route path = "sales-returns/branch/:branchId" element = {<AllSalesReturns/>}/>

        <Route path = "sales-report" element = {<AllBranchSelectionPage pageName="sales-report" />}/>
        <Route path = "sales-report/branch/:branchId" element = {<AllSalesReport/>}/>

        <Route path = "staff" element = {<AllBranchSelectionPage pageName="staff" />}/>
        <Route path = "staff/branch/:branchId" element = {<StaffPage/>}/>




        <Route path="vendors/" element={<AllBranchSelectionPage pageName="vendors" />} />
        <Route path="vendors/statement/:vendorId" element={<AllVendorStatementPage />} />
        <Route path="vendors/branch/:branchId" element={<AllVendorPage />} />
        {/* <Route path="vendors/branch/:branchId/brand/:id" element={<AllVendorBrand />} /> */}

        <Route path="invoice/:transactionId" element={<InvoicePage />} />


        <Route path="vendor-transactions" element={<AllBranchSelectionPage pageName="vendor-transactions" />} />

        <Route path="vendor-transactions/branch/:branchId" element={<AllVendorTransactions />}/>
        <Route path="vendor-transactions/branch/:branchId/form" element={<AllVendorTransactionForm />} />
        <Route path="vendor-transactions/branch/:branchId/editform/:vendorTransactionId" element={<EditAllVendorTransactionForm />} />

        <Route path = "staff-transactions" element = {<AllBranchSelectionPage pageName="staff-transactions" />}/>
        <Route path = "staff-transactions/branch/:branchId" element = {<StaffTransactions />}/>
        <Route path = "staff-transactions/:id" element = {<StaffTransactions />}/> 
        <Route path = "staff-transactions/branch/:branchId/form" element = {<StaffTransactionForm />}/>
        <Route path = "staff-transactions/branch/:branchId/editform/:id" element = {<StaffTransactionEditForm />}/> 

        <Route path="debtors" element={<AllBranchSelectionPage pageName="debtors" />} />
        <Route path="debtors/branch/:branchId" element={<AllDebtorsPage />} />
        <Route path="debtor-transactions" element={<AllBranchSelectionPage pageName="debtor-transactions" />} />
        <Route path="debtor-transactions/branch/:branchId" element={<AllDebtorTransactions />} />
        <Route path="debtor-transactions/branch/:branchId/form" element={<DebtorTransactionForm />} />
        <Route path="debtor-transactions/branch/:branchId/editform/:debtorTransactionId" element={<EditDebtorTransactionForm />} />
        <Route path="debtors/statement/:debtorId" element={<AllDebtorStatementPage />} />


        
      </Route>

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/register" element={<UserRegister />} />
    </Routes>
  );
}

export default App;
