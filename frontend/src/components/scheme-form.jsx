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
import { PlusCircle, Trash2, Check, ChevronsUpDown, ArrowLeft } from 'lucide-react'
import { cn } from "../lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"
import { CommandList } from 'cmdk';
import Sidebar from './sidebar';
import { useNavigate } from 'react-router-dom';

function SchemeForm() {
  const api = useAxios()
  const [formData, setFormData] = useState({
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    phone: '',
    subscheme: [{ lowerbound: '', upperbound: '', cashback: '' }]
  });
  const navigate = useNavigate()
  const [phones, setPhones] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewPhoneDialog, setShowNewPhoneDialog] = useState(false);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [newPhoneData, setNewPhoneData] = useState({ name: '', brand: '' });
  const [newBrandName, setNewBrandName] = useState('');
  const [openPhone, setOpenPhone] = useState(false);
  const [openBrand, setOpenBrand] = useState(false);
  const [subLoading, setSubLoading] = useState(false)

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
    setOpenPhone(false);
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
    setOpenBrand(false);
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
      setSubLoading(true)
      const response = await api.post('transaction/scheme/', formData);
      console.log('Response:', response.data);
      // Optionally clear the form or show a success message
    } catch (error) {
      console.error('Error posting data:', error);
    }
    finally{
      setLoading(false)
      navigate('/mobile/schemes/')
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
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 to-slate-800">
      
      <Sidebar/>
      <div div className=''>
      <Button
                onClick={() => navigate('/mobile')}
                variant="outline"
                className="w-full sm:w-auto px-5 text-slate-900  border-white hover:bg-gray-500 ml-80 mt-4 hover:text-slate-900 items-right"
              >
                <ArrowLeft className="mr-2 h-4 w-3" />
                Back to Dashboard
              </Button>

      
      <div className="max-w-2xl mx-auto ml-96 items-center bg-slate-800 p-8 m-8 rounded-lg shadow-lg">
      
      <h2 className="text-3xl font-bold mb-6 text-white">Add Scheme</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <Label htmlFor="from_date" className="text-lg font-medium text-white mb-2">
              From Date
            </Label>
            <Input
              type="date"
              id="from_date"
              name="from_date"
              value={formData.from_date}
              onChange={handleChange}
              className="border border-gray-300 text-white rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required />
          </div>
          <div className="flex flex-col">
            <Label htmlFor="to_date" className="text-lg font-medium text-white mb-2">
              To Date
            </Label>
            <Input
              type="date"
              id="to_date"
              name="to_date"
              value={formData.to_date}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:outline-none text-white focus:ring-2 focus:ring-indigo-500"
              required />
          </div>
        </div>

        <div className="flex flex-col">
          <Label htmlFor="phone" className="text-lg font-medium text-white mb-2">
            Phone
          </Label>
          <Popover open={openPhone} onOpenChange={setOpenPhone}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openPhone}
                className="w-full justify-between bg-slate-800 text-white"
              >
                {formData.phone
                  ? phones.find((phone) => phone.id.toString() === formData.phone)?.name
                  : "Select a phone..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-slate-800">
              <Command className="bg-slate-800">
                <CommandInput className="bg-slate-800 text-white" placeholder="Search phone..." />
                <CommandList>
                <CommandEmpty >No phone found.</CommandEmpty>
                <CommandGroup>
                  {!loading && phones.length > 0 ? (
                    <>
                      {phones.map((phone) => (
                        <CommandItem 
                          key={phone.id}
                          onSelect={() => handlePhoneChange(phone.id.toString())}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.phone === phone.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                            />
                          {phone.name}
                        </CommandItem>
                      ))}
                      <CommandItem onSelect={() => handlePhoneChange('new')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add a new phone
                      </CommandItem>
                    </>
                  ) : loading ? (
                    <CommandItem>Loading...</CommandItem>
                  ) : (
                    <CommandItem>No phones available</CommandItem>
                  )}
                </CommandGroup>
                  </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <h3 className="text-xl font-semibold text-white mb-2">Subschemes</h3>
        {formData.subscheme.map((subscheme, index) => (
          <div key={index} className=" bg-slate-800 border border-gray-300 p-4 rounded-md shadow">
            <h4 className="text-lg font-semibold text-white mb-2">Subscheme {index + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <Label
                  htmlFor={`lowerbound-${index}`}
                  className="text-sm font-medium text-white mb-1">
                  Lower Bound
                </Label>
                <Input
                  type="number"
                  id={`lowerbound-${index}`}
                  name="lowerbound"
                  value={subscheme.lowerbound}
                  onChange={(e) => handleSubschemeChange(index, e)}
                  className="border border-gray-300 text-white rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter lower bound"
                  required />
              </div>
              <div className="flex flex-col">
                <Label
                  htmlFor={`upperbound-${index}`}
                  className="text-sm font-medium text-white mb-1">
                  Upper Bound
                </Label>
                <Input
                  type="number"
                  id={`upperbound-${index}`}
                  name="upperbound"
                  value={subscheme.upperbound}
                  onChange={(e) => handleSubschemeChange(index, e)}
                  className="border border-gray-300 rounded-lg text-white py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter upper bound"
                  required />
              </div>
              <div className="flex flex-col">
                <Label
                  htmlFor={`cashback-${index}`}
                  className="text-sm font-medium text-white mb-1">
                  Cashback
                </Label>
                <Input
                  type="number"
                  id={`cashback-${index}`}
                  name="cashback"
                  value={subscheme.cashback}
                  onChange={(e) => handleSubschemeChange(index, e)}
                  className="border border-gray-300 rounded-lg text-white py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter cashback amount"
                  required />
              </div>
            </div>
            {index > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-2 hover:bg-red-800"
                onClick={() => handleRemoveSubscheme(index)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Subscheme
              </Button>
            )}
          </div>
        ))}

        <Button type="button" onClick={handleAddSubscheme} className="w-full hover:bg-green-100 hover:text-black">
          <PlusCircle className="w-4 h-4 mr-2 " />
          Add Another Subscheme
        </Button>

        <Button type="submit" disabled = {subLoading} className="w-full hover:bg-green-300 hover:text-black">
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
                <Popover open={openBrand} onOpenChange={setOpenBrand}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openBrand}
                      className="w-full justify-between bg-slate-800"
                    >
                      {newPhoneData.brand
                        ? brands.find((brand) => brand.id.toString() === newPhoneData.brand)?.name
                        : "Select a brand..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command className="bg-slate-800">
                      <CommandInput className="bg-slate-800 text-white" placeholder="Search brand..." />
                      <CommandList>
                      <CommandEmpty>No brand found.</CommandEmpty>
                      <CommandGroup>
                        {brands.map((brand) => (
                          <CommandItem
                          key={brand.id}
                            onSelect={() => handleNewPhoneBrandChange(brand.id.toString())}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                newPhoneData.brand === brand.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {brand.name}
                          </CommandItem>
                        ))}
                        <CommandItem onSelect={() => handleNewPhoneBrandChange('new')}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add a new brand
                        </CommandItem>
                      </CommandGroup>
                              </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
    </div>
    </div>
    </div>
  );
}

export default SchemeForm;