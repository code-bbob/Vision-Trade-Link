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
import { PlusCircle, Trash2 } from 'lucide-react';
import { useNavigate } from "react-router-dom";



function SalesTransactionForm() {
  const api = useAxios()
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sales: [{ phone: '', imei_number: '', unit_price: '' }]
  });
  const [phones, setPhones] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewPhoneDialog, setShowNewPhoneDialog] = useState(false);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [newPhoneData, setNewPhoneData] = useState({ name: '', brand: '' });
  const [newBrandName, setNewBrandName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [phonesResponse, brandsResponse] = await Promise.all([
          api.get('inventory/phone/'),
          api.get('inventory/brand/')
        ]);
        setPhones(phonesResponse.data);
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

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const newSales = [...formData.sales];
    newSales[index] = { ...newSales[index], [name]: value };
    setFormData({ ...formData, sales: newSales });
  };

  const handlePhoneChange = (index, value) => {
    if (value === 'new') {
      setShowNewPhoneDialog(true);
    } else {
      const newSales = [...formData.sales];
      newSales[index] = { ...newSales[index], phone: value };
      setFormData({ ...formData, sales: newSales });
    }
  };

  const handleNewPhoneChange = (e) => {
    const { name, value } = e.target;
    setNewPhoneData({ ...newPhoneData, [name]: value });
  };

  const handleNewPhoneBrandChange = (value) => {
    if (value === 'new') {
      setShowNewBrandDialog(true);
    } else {
      setNewPhoneData({ ...newPhoneData, brand: value });
    }
  };

  const handleNewBrandChange = (e) => {
    setNewBrandName(e.target.value);
  };

  const handleAddSale = () => {
    setFormData({
      ...formData,
      sales: [...formData.sales, { phone: '', imei_number: '', unit_price: '' }]
    });
  };

  const handleRemoveSale = (index) => {
    const newSales = formData.sales.filter((_, i) => i !== index);
    setFormData({ ...formData, sales: newSales });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('transaction/salestransaction/', formData);
      console.log('Response:', response.data);
      navigate('/login')
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

  const handleAddBrand = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('inventory/brand/', { name: newBrandName });
      console.log('New Brand Added:', response.data);
      setBrands([...brands, response.data]);
      setNewBrandName('');
      setShowNewBrandDialog(false);
      setNewPhoneData({ ...newPhoneData, brand: response.data.id.toString() });
    } catch (error) {
      console.error('Error adding brand:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 p-8 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">Add Sales Transaction</h2>
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
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        {formData.sales.map((sale, index) => (
          <div key={index} className="bg-white p-4 rounded-md shadow">
            <h3 className="text-lg font-semibold mb-2">Sale {index + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <Label htmlFor={`phone-${index}`} className="text-sm font-medium text-gray-800 mb-1">
                  Phone
                </Label>
                <Select onValueChange={(value) => handlePhoneChange(index, value)} value={sale.phone}>
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
                      <SelectItem value="no-phones">No phones available</SelectItem>
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
                  value={sale.imei_number}
                  onChange={(e) => handleChange(index, e)}
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
                  value={sale.unit_price}
                  onChange={(e) => handleChange(index, e)}
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
                onClick={() => handleRemoveSale(index)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Sale
              </Button>
            )}
          </div>
        ))}

        <Button type="button" onClick={handleAddSale} className="w-full">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Another Sale
        </Button>

        <Button type="submit" className="w-full">
          Submit Transaction
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

export default SalesTransactionForm;