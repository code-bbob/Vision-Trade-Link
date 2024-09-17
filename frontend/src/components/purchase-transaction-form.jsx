'use client';

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
import { PlusCircle, Trash2, Check, ChevronsUpDown,ArrowLeft } from 'lucide-react'
import { cn } from "../lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"
import { useNavigate } from 'react-router-dom';
import Sidebar from './sidebar';

function PurchaseTransactionForm() {
  const api = useAxios()
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    purchase: [{ phone: '', imei_number: '', unit_price: '' }],
    vendor: ''
  });
  const [phones, setPhones] = useState([]);
  const [filteredPhones, setFilteredPhones] = useState([]);
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
  const [openPhone, setOpenPhone] = useState(Array(formData.purchase.length).fill(false));
  const [openVendor, setOpenVendor] = useState(false);
  const [openBrand, setOpenBrand] = useState(false);
  const navigate = useNavigate()

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
      setFormData(prevState => ({
        ...prevState,
        purchase: newPurchase
      }));
    }
    const newOpenPhone = [...openPhone];
    newOpenPhone[index] = false;
    setOpenPhone(newOpenPhone);
  };

  const handleVendorChange = (value) => {
    if (value === 'new') {
      setShowNewVendorDialog(true);
    } else {
      setFormData(prevState => ({
        ...prevState,
        vendor: value
      }));
      const selectedVendor = vendors.find(vendor => vendor.id.toString() === value);
      if (selectedVendor) {
        const filteredPhones = phones.filter(phone => phone.brand === selectedVendor.brand);
        setFilteredPhones(filteredPhones);
      }
    }
    setOpenVendor(false);
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
    setOpenBrand(false);
  };

  const handleNewVendorBrandChange = (value) => {
    if (value === 'new') {
      setShowNewBrandDialog(true);
    } else {
      setNewVendorData({ ...newVendorData, brand: value });
    }
    setOpenBrand(false);
  };

  const handleNewBrandChange = (e) => {
    setNewBrandName(e.target.value);
  };

  const handleAddPurchase = () => {
    setFormData(prevState => ({
      ...prevState,
      purchase: [...prevState.purchase, { phone: '', imei_number: '', unit_price: '' }]
    }));
    setOpenPhone(prevState => [...prevState, false]);
  };

  const handleRemovePurchase = (index) => {
    setFormData(prevState => ({
      ...prevState,
      purchase: prevState.purchase.filter((_, i) => i !== index)
    }));
    setOpenPhone(prevState => prevState.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('transaction/purchasetransaction/', formData);
      console.log('Response:', response.data);
      navigate('/purchases')
    } catch (error) {
      console.error('Error posting data:', error);
      setError('Failed to submit purchase transaction. Please try again.');
    }
  };

  const handleAddPhone = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('inventory/phone/', newPhoneData);
      console.log('New Phone Added:', response.data);
      setPhones(prevPhones => [...prevPhones, response.data]);
      setNewPhoneData({ name: '', brand: '' });
      setShowNewPhoneDialog(false);
      window.location.reload();
    } catch (error) {
      console.error('Error adding phone:', error);
      setError('Failed to add new phone. Please try again.');
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('transaction/vendor/', newVendorData);
      console.log('New Vendor Added:', response.data);
      setVendors(prevVendors => [...prevVendors, response.data]);
      setFormData(prevState => ({
        ...prevState,
        vendor: response.data.id.toString()
      }));
      setNewVendorData({ name: '', brand: '' });
      setShowNewVendorDialog(false);
    } catch (error) {
      console.error('Error adding vendor:', error);
      setError('Failed to add new vendor. Please try again.');
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('inventory/brand/', { name: newBrandName });
      console.log('New Brand Added:', response.data);
      setBrands(prevBrands => [...prevBrands, response.data]);
      setNewBrandName('');
      setShowNewBrandDialog(false);
      setNewPhoneData(prevData => ({ ...prevData, brand: response.data.id.toString() }));
      setNewVendorData(prevData => ({ ...prevData, brand: response.data.id.toString() }));
    } catch (error) {
      console.error('Error adding brand:', error);
      setError('Failed to add new brand. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar/>
      <div className=''>
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="w-full sm:w-auto px-5 text-slate-900 border-white hover:bg-gray-500 mx-9 ml-80 mt-4 hover:text-slate-900 items-right"
        >
          <ArrowLeft className="mr-2 h-4 w-3" />
          Back to Dashboard
        </Button>

        <div className="max-w-2xl mx-auto ml-96 bg-slate-800 p-8 m-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-white">Add Purchase Transaction</h2>
          {error && <p className="text-red-400 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col">
              <Label htmlFor="date" className="text-lg font-medium text-white mb-2">
                Date
              </Label>
              <Input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="vendor" className="text-lg font-medium text-white mb-2">
                Vendor
              </Label>
              <Popover open={openVendor} onOpenChange={setOpenVendor}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openVendor}
                    className="w-full justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    {formData.vendor
                      ? vendors.find((vendor) => vendor.id.toString() === formData.vendor)?.name
                      : "Select a vendor..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-slate-800 border-slate-700">
                  <Command className='bg-slate-700 border-slate-600'>
                    <CommandInput placeholder="Search vendor..." className="bg-slate-700 text-white" />
                    <CommandList>
                      <CommandEmpty>No vendor found.</CommandEmpty>
                      <CommandGroup>
                        {!loading && vendors.length > 0 ? (
                          <>
                            {vendors.map((vendor) => (
                              <CommandItem
                                key={vendor.id}
                                onSelect={() => handleVendorChange(vendor.id.toString())}
                                className="text-white hover:bg-slate-700"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.vendor === vendor.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {vendor.name}
                              </CommandItem>
                            ))}
                            <CommandItem onSelect={() => handleVendorChange('new')} className="text-white hover:bg-slate-700">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Add a new vendor
                            </CommandItem>
                          </>
                        ) : loading ? (
                          <CommandItem>Loading...</CommandItem>
                        ) : (
                          <>
                            <CommandItem className="text-white">No vendors available</CommandItem>
                            <CommandItem onSelect={() => handleVendorChange('new')} className="text-white hover:bg-slate-700">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Add a new vendor
                            </CommandItem>
                          </>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <h3 className="text-xl font-semibold mb-2 text-white">Purchases</h3>
            {formData.purchase.map((purchase, index) => (
              <div key={index} className="bg-slate-700 p-4 rounded-md shadow">
                <h4 className="text-lg font-semibold mb-2 text-white">Purchase {index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <Label htmlFor={`phone-${index}`} className="text-sm font-medium text-white mb-1">
                      Phone
                    </Label>
                    <Popover open={openPhone[index]} onOpenChange={(open) => {
                      const newOpenPhone = [...openPhone];
                      newOpenPhone[index] = open;
                      setOpenPhone(newOpenPhone);
                    }}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openPhone[index]}
                          className="w-full justify-between bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                        >
                          {purchase.phone
                            ? phones.find((phone) => phone.id.toString() === purchase.phone)?.name
                            : "Select a phone..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                        <Command className='bg-slate-700 border-slate-600'>
                          <CommandInput placeholder="Search phone..." className="bg-slate-700 text-white" />
                          <CommandList>
                            <CommandEmpty>No phone found.</CommandEmpty>
                            <CommandGroup>
                              {!loading && filteredPhones.length > 0 ? (
                                <>
                                  {filteredPhones.map((phone) => (
                                    <CommandItem
                                      key={phone.id}
                                      onSelect={() => handlePhoneChange(index, phone.id.toString())}
                                      className="text-white hover:bg-slate-600"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          purchase.phone === phone.id.toString() ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {phone.name}
                                    </CommandItem>
                                  ))}
                                  <CommandItem onSelect={() => handlePhoneChange(index, 'new')} className="text-white hover:bg-slate-600">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add a new phone
                                  </CommandItem>
                                </>
                              ) : loading ? (
                                <CommandItem>Loading...</CommandItem>
                              ) : (
                                <>
                                  <CommandItem className="text-white">No phones available</CommandItem>
                                  <CommandItem onSelect={() => handlePhoneChange(index, 'new')} className="text-white hover:bg-slate-600">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add a new phone
                                  </CommandItem>
                                </>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col">
                    <Label htmlFor={`imei-${index}`} className="text-sm font-medium text-white mb-1">
                      IMEI Number
                    </Label>
                    <Input
                      type="text"
                      id={`imei-${index}`}
                      name="imei_number"
                      value={purchase.imei_number}
                      onChange={(e) => handlePurchaseChange(index, e)}
                      className="bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter IMEI number"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label htmlFor={`price-${index}`} className="text-sm font-medium text-white mb-1">
                      Unit Price
                    </Label>
                    <Input
                      type="number"
                      id={`price-${index}`}
                      name="unit_price"
                      value={purchase.unit_price}
                      onChange={(e) => handlePurchaseChange(index, e)}
                      className="bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
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
                    className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleRemovePurchase(index)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Purchase
                  </Button>
                )}
              </div>
            ))}

            <Button type="button" onClick={handleAddPurchase} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Another Purchase
            </Button>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
              Submit Purchase Transaction
            </Button>
          </form>

          <Dialog open={showNewPhoneDialog} onOpenChange={setShowNewPhoneDialog}>
            <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Phone</DialogTitle>
                <DialogDescription className="text-slate-300">
                  Enter the details of the new phone you want to add.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newPhoneName" className="text-right text-white">
                    Name
                  </Label>
                  <Input
                    id="newPhoneName"
                    name="name"
                    value={newPhoneData.name}
                    onChange={handleNewPhoneChange}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter phone name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newPhoneBrand" className="text-right text-white">
                    Brand
                  </Label>
                  <div className="col-span-3">
                    <Popover open={openBrand} onOpenChange={setOpenBrand}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openBrand}
                          className="w-full justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        >
                          {newPhoneData.brand
                            ? brands.find((brand) => brand.id.toString() === newPhoneData.brand)?.name
                            : "Select a brand..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                        <Command className="bg-slate-700 border-slate-600">
                          <CommandInput placeholder="Search brand..." className="bg-slate-700 text-white" />
                          <CommandList>
                            <CommandEmpty>No brand found.</CommandEmpty>
                            <CommandGroup>
                              {brands.map((brand) => (
                                <CommandItem
                                  key={brand.id}
                                  onSelect={() => handleNewPhoneBrandChange(brand.id.toString())}
                                  className="text-white hover:bg-slate-600"
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
                              <CommandItem onSelect={() => handleNewPhoneBrandChange('new')} className="text-white hover:bg-slate-600">
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
                <Button type="button" onClick={handleAddPhone} className="bg-green-600 hover:bg-green-700 text-white">Add Phone</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewVendorDialog} onOpenChange={setShowNewVendorDialog}>
            <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
                <DialogDescription className="text-slate-300">
                  Enter the details of the new vendor you want to add.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newVendorName" className="text-right text-white">
                    Name
                  </Label>
                  <Input
                    id="newVendorName"
                    name="name"
                    value={newVendorData.name}
                    onChange={handleNewVendorChange}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter vendor name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newVendorBrand" className="text-right text-white">
                    Brand
                  </Label>
                  <div className="col-span-3">
                    <Popover open={openBrand} onOpenChange={setOpenBrand}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openBrand}
                          className="w-full justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        >
                          {newVendorData.brand
                            ? brands.find((brand) => brand.id.toString() === newVendorData.brand)?.name
                            : "Select a brand..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                        <Command className="bg-slate-700 border-slate-600">
                          <CommandInput placeholder="Search brand..." className="bg-slate-700 text-white" />
                          <CommandList>
                            <CommandEmpty>No brand found.</CommandEmpty>
                            <CommandGroup>
                              {brands.map((brand) => (
                                <CommandItem
                                  key={brand.id}
                                  onSelect={() => handleNewVendorBrandChange(brand.id.toString())}
                                  className="text-white hover:bg-slate-600"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newVendorData.brand === brand.id.toString() ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {brand.name}
                                </CommandItem>
                              ))}
                              <CommandItem onSelect={() => handleNewVendorBrandChange('new')} className="text-white hover:bg-slate-600">
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
                <Button type="button" onClick={handleAddVendor} className="bg-green-600 hover:bg-green-700 text-white">Add Vendor</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewBrandDialog} onOpenChange={setShowNewBrandDialog}>
            <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Brand</DialogTitle>
                <DialogDescription className="text-slate-300">
                  Enter the name of the new brand you want to add.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newBrandName" className="text-right text-white">
                    Brand Name
                  </Label>
                  <Input
                    id="newBrandName"
                    value={newBrandName}
                    onChange={handleNewBrandChange}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter brand name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleAddBrand} className="bg-green-600 hover:bg-green-700 text-white">Add Brand</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

export default PurchaseTransactionForm;