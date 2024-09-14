import React, { useEffect, useState } from 'react';
import useAxios from '../utils/useAxios';
// import VendorForm from './postVendors';
import GetVendors from './getVendors';
import GetBrands from './getBrands';
import GetSales from './Sales';
import SalesTransactionForm from '../components/sales-transaction-form';
import SchemeForm from '../components/scheme-form';
import PurchaseTransactionForm from '../components/purchase-transaction-form';
import  LandingPage  from '../components/landing-page';
import { InventoryPageComponent } from './inventory-page';
import  BrandPhones  from './singleBrand';
import  PurchaseTransactions  from './purchase';
import PriceProtectionForm from '../components/price-protection-form';

const Homepage = () => {
  const [vendors, setVendors] = useState([]);
  const api = useAxios(); // Hook is used properly



  return (
      <div>
        {/* <GetVendors/> */}
        {/* <VendorForm/> */}
        <LandingPage/>
        {/* <BrandPhones/> */}
        {/* <GetBrands/> */}
        {/* <GetSales/> */}
        <PurchaseTransactions/>
        <SalesTransactionForm/>
        <SchemeForm/>
        <PurchaseTransactionForm/>
        <PriceProtectionForm/>
      {/* <h1>Homepage</h1> */}
      <ul>
        {vendors.map((vendor, index) => (
          <li key={index}>{vendor.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default Homepage;
