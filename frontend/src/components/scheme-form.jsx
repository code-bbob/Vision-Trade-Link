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

function SchemeForm() {
  const api = useAxios()
  const [formData, setFormData] = useState({
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    phone: '',
    subscheme: [{ lowerbound: '', upperbound: '', cashback: '' }]
  });
  const [phones, setPhones] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewPhoneDialog, setShowNewPhoneDialog] = useState(false);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [newPhoneData, setNewPhoneData] = useState({ name: '', brand: '' });
  const [newBrandName, setNewBrandName] = useState('');

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubschemeChange = (index, e) => {
    const { name, value } = e.target;
    const newSubscheme = [...formData.subscheme];
    newSubscheme[index] = { ...newSubscheme[index], [name]: value };
    setFormData({ ...formData, subscheme: newSubscheme });
  };

  const handlePhoneChange = (value) => {
    if (value === 'new') {
      setShowNewPhoneDialog(true);
    } else {
      setFormData({ ...formData, phone: value });
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

  const handleAddSubscheme = () => {
    setFormData({
      ...formData,
      subscheme: [...formData.subscheme, { lowerbound: '', upperbound: '', cashback: '' }]
    });
  };

  const handleRemoveSubscheme = (index) => {
    const newSubscheme = formData.subscheme.filter((_, i) => i !== index);
    setFormData({ ...formData, subscheme: newSubscheme });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('transaction/scheme/', formData);
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
      setFormData({ ...formData, phone: response.data.id.toString() });
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
    (<div className="max-w-2xl mx-auto bg-gray-100 p-8 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">Add Scheme</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <Label htmlFor="from_date" className="text-lg font-medium text-gray-800 mb-2">
              From Date
            </Label>
            <Input
              type="date"
              id="from_date"
              name="from_date"
              value={formData.from_date}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required />
          </div>
          <div className="flex flex-col">
            <Label htmlFor="to_date" className="text-lg font-medium text-gray-800 mb-2">
              To Date
            </Label>
            <Input
              type="date"
              id="to_date"
              name="to_date"
              value={formData.to_date}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required />
          </div>
        </div>

        <div className="flex flex-col">
          <Label htmlFor="phone" className="text-lg font-medium text-gray-800 mb-2">
            Phone
          </Label>
          <Select onValueChange={handlePhoneChange} value={formData.phone}>
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

        <h3 className="text-xl font-semibold mb-2">Subschemes</h3>
        {formData.subscheme.map((subscheme, index) => (
          <div key={index} className="bg-white p-4 rounded-md shadow">
            <h4 className="text-lg font-semibold mb-2">Subscheme {index + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <Label
                  htmlFor={`lowerbound-${index}`}
                  className="text-sm font-medium text-gray-800 mb-1">
                  Lower Bound
                </Label>
                <Input
                  type="number"
                  id={`lowerbound-${index}`}
                  name="lowerbound"
                  value={subscheme.lowerbound}
                  onChange={(e) => handleSubschemeChange(index, e)}
                  className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter lower bound"
                  required />
              </div>
              <div className="flex flex-col">
                <Label
                  htmlFor={`upperbound-${index}`}
                  className="text-sm font-medium text-gray-800 mb-1">
                  Upper Bound
                </Label>
                <Input
                  type="number"
                  id={`upperbound-${index}`}
                  name="upperbound"
                  value={subscheme.upperbound}
                  onChange={(e) => handleSubschemeChange(index, e)}
                  className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter upper bound"
                  required />
              </div>
              <div className="flex flex-col">
                <Label
                  htmlFor={`cashback-${index}`}
                  className="text-sm font-medium text-gray-800 mb-1">
                  Cashback
                </Label>
                <Input
                  type="number"
                  id={`cashback-${index}`}
                  name="cashback"
                  value={subscheme.cashback}
                  onChange={(e) => handleSubschemeChange(index, e)}
                  className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter cashback amount"
                  required />
              </div>
            </div>
            {index > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-2"
                onClick={() => handleRemoveSubscheme(index)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Subscheme
              </Button>
            )}
          </div>
        ))}

        <Button type="button" onClick={handleAddSubscheme} className="w-full">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Another Subscheme
        </Button>

        <Button type="submit" className="w-full">
          Submit Scheme
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
                placeholder="Enter phone name" />
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
                placeholder="Enter brand name" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleAddBrand}>Add Brand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>)
  );
}

export default SchemeForm;