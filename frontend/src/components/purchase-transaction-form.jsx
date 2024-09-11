'use client'

import React, { useState, useEffect } from 'react';
import useAxios from '../utils/useAxios';
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { PlusCircle, Trash2 } from 'lucide-react'

function PurchaseTransactionForm() {
  const api = useAxios()
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    purchase: [{ phone: '', imei_number: '', unit_price: '' }],
    vendor: ''
  });
  const [phones, setPhones] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewPhoneDialog, setShowNewPhoneDialog] = useState(false);
  const [showNewVendorDialog, setShowNewVendorDialog] = useState(false);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [newPhoneData, setNewPhoneData] = useState({ name: '', brand: '' });
  const [newVendorData, setNewVendorData] = useState({ name: '', brand: '' });
  const [newBrandName, setNewBrandName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [phonesResponse, vendorsResponse, brandsResponse] = await Promise.all([
          api.get('inventory/phone/'),
          api.get('transaction/vendor/'),
          api.get('inventory/brand/')
        ]);
        setPhones(phonesResponse.data);
        setVendors(vendorsResponse.data);
        setBrands(brandsResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePurchaseChange = (index, e) => {
    const { name, value } = e.target;
    const newPurchase = [...formData.purchase];
    newPurchase[index] = { ...newPurchase[index], [name]: value };
    setFormData({ ...formData, purchase: newPurchase });
  };

  const handlePhoneChange = (index, value) => {
    if (value === 'new') {
      setShowNewPhoneDialog(true);
    } else {
      const newPurchase = [...formData.purchase];
      newPurchase[index] = { ...newPurchase[index], phone: value };
      setFormData({ ...formData, purchase: newPurchase });
    }
  };

  const handleVendorChange = (value) => {
    if (value === 'new') {
      setShowNewVendorDialog(true);
    } else {
      setFormData({ ...formData, vendor: value });
    }
  };

  const handleNewPhoneChange = (e) => {
    const { name, value } = e.target;
    setNewPhoneData({ ...newPhoneData, [name]: value });
  };

  const handleNewVendorChange = (e) => {
    const { name, value } = e.target;
    setNewVendorData({ ...newVendorData, [name]: value });
  };

  const handleNewPhoneBrandChange = (value) => {
    if (value === 'new') {
      setShowNewBrandDialog(true);
    } else {
      setNewPhoneData({ ...newPhoneData, brand: value });
    }
  };

  const handleNewVendorBrandChange = (value) => {
    if (value === 'new') {
      setShowNewBrandDialog(true);
    } else {
      setNewVendorData({ ...newVendorData, brand: value });
    }
  };

  const handleNewBrandChange = (e) => {
    setNewBrandName(e.target.value);
  };

  const handleAddPurchase = () => {
    setFormData({
      ...formData,
      purchase: [...formData.purchase, { phone: '', imei_number: '', unit_price: '' }]
    });
  };

  const handleRemovePurchase = (index) => {
    const newPurchase = formData.purchase.filter((_, i) => i !== index);
    setFormData({ ...formData, purchase: newPurchase });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('transaction/purchasetransaction/', formData);
      console.log('Response:', response.data);
      // Optionally clear the form or show a success message
    } catch (error) {
      console.error('Error posting data:', error);
    }
  };

  const handleAddPhone = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('inventory/phone/', newPhoneData);
      console.log('New Phone Added:', response.data);
      setPhones([...phones, response.data]);
      setNewPhoneData({ name: '', brand: '' });
      setShowNewPhoneDialog(false);
    } catch (error) {
      console.error('Error adding phone:', error);
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('transaction/vendor/', newVendorData);
      console.log('New Vendor Added:', response.data);
      setVendors([...vendors, response.data]);
      setFormData({ ...formData, vendor: response.data.id.toString() });
      setNewVendorData({ name: '', brand: '' });
      setShowNewVendorDialog(false);
    } catch (error) {
      console.error('Error adding vendor:', error);
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('inventory/brand/', { name: newBrandName });
      console.log('New Brand Added:', response.data);
      setBrands([...brands, response.data]);
      setNewBrandName('');
      setShowNewBrandDialog(false);
      setNewPhoneData({ ...newPhoneData, brand: response.data.id.toString() });
      setNewVendorData({ ...newVendorData, brand: response.data.id.toString() });
    } catch (error) {
      console.error('Error adding brand:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 p-8 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">Add Purchase Transaction</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col">
          <Label htmlFor="date" className="text-lg font-medium text-gray-800 mb-2">
            Date
          </Label>
          <Input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor="vendor" className="text-lg font-medium text-gray-800 mb-2">
            Vendor
          </Label>
          <Select onValueChange={handleVendorChange} value={formData.vendor}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a vendor" />
            </SelectTrigger>
            <SelectContent>
              {!loading && vendors.length > 0 ? (
                <>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor?.id} value={vendor?.id?.toString()}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">Add a new vendor</SelectItem>
                </>
              ) : loading ? (
                <SelectItem value="loading">Loading...</SelectItem>
              ) : (
                <>
                <SelectItem value="no-vendors">No vendors available</SelectItem>
                <SelectItem value="new">Add a new vendor</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <h3 className="text-xl font-semibold mb-2">Purchases</h3>
        {formData.purchase.map((purchase, index) => (
          <div key={index} className="bg-white p-4 rounded-md shadow">
            <h4 className="text-lg font-semibold mb-2">Purchase {index + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <Label htmlFor={`phone-${index}`} className="text-sm font-medium text-gray-800 mb-1">
                  Phone
                </Label>
                <Select onValueChange={(value) => handlePhoneChange(index, value)} value={purchase.phone}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a phone" />
                  </SelectTrigger>
                  <SelectContent>
                    {!loading && phones.length > 0 ? (
                      <>
                        {phones.map((phone) => (
                          <SelectItem key={phone.id} value={phone.id.toString()}>
                            {phone.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">Add a new phone</SelectItem>
                      </>
                    ) : loading ? (
                      <SelectItem value="loading">Loading...</SelectItem>
                    ) : (
                      <>
                      <SelectItem value="no-phones">No phones available</SelectItem>
                      <SelectItem value="new">Add a new phone</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col">
                <Label htmlFor={`imei-${index}`} className="text-sm font-medium text-gray-800 mb-1">
                  IMEI Number
                </Label>
                <Input
                  type="text"
                  id={`imei-${index}`}
                  name="imei_number"
                  value={purchase.imei_number}
                  onChange={(e) => handlePurchaseChange(index, e)}
                  className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter IMEI number"
                  required
                />
              </div>
              <div className="flex flex-col">
                <Label htmlFor={`price-${index}`} className="text-sm font-medium text-gray-800 mb-1">
                  Unit Price
                </Label>
                <Input
                  type="number"
                  id={`price-${index}`}
                  name="unit_price"
                  value={purchase.unit_price}
                  onChange={(e) => handlePurchaseChange(index, e)}
                  className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter unit price"
                  required
                />
              </div>
            </div>
            {index > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-2"
                onClick={() => handleRemovePurchase(index)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Purchase
              </Button>
            )}
          </div>
        ))}

        <Button type="button" onClick={handleAddPurchase} className="w-full">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Another Purchase
        </Button>

        <Button type="submit" className="w-full">
          Submit Purchase Transaction
        </Button>
      </form>

      <Dialog open={showNewPhoneDialog} onOpenChange={setShowNewPhoneDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Phone</DialogTitle>
            <DialogDescription>
              Enter the details of the new phone you want to add.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newPhoneName" className="text-right">
                Name
              </Label>
              <Input
                id="newPhoneName"
                name="name"
                value={newPhoneData.name}
                onChange={handleNewPhoneChange}
                className="col-span-3"
                placeholder="Enter phone name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newPhoneBrand" className="text-right">
                Brand
              </Label>
              <div className="col-span-3">
                <Select onValueChange={handleNewPhoneBrandChange} value={newPhoneData.brand}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="new">Add a new brand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleAddPhone}>Add Phone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewVendorDialog} onOpenChange={setShowNewVendorDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
            <DialogDescription>
              Enter the details of the new vendor you want to add.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newVendorName" className="text-right">
                Name
              </Label>
              <Input
                id="newVendorName"
                name="name"
                value={newVendorData.name}
                onChange={handleNewVendorChange}
                className="col-span-3"
                placeholder="Enter vendor name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newVendorBrand" className="text-right">
                Brand
              </Label>
              <div className="col-span-3">
                <Select onValueChange={handleNewVendorBrandChange} value={newVendorData.brand}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="new">Add a new brand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleAddVendor}>Add Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewBrandDialog} onOpenChange={setShowNewBrandDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Brand</DialogTitle>
            <DialogDescription>
              Enter the name of the new brand you want to add.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newBrandName" className="text-right">
                Brand Name
              </Label>
              <Input
                id="newBrandName"
                value={newBrandName}
                onChange={handleNewBrandChange}
                className="col-span-3"
                placeholder="Enter brand name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleAddBrand}>Add Brand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PurchaseTransactionForm;