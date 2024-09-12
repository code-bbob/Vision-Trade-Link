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
import { PlusCircle, Trash2, Check, ChevronsUpDown } from 'lucide-react'
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
import { CommandList, CommandLoading } from 'cmdk';

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
  const [openPhone, setOpenPhone] = useState(Array(formData.purchase.length).fill(false));
  const [openVendor, setOpenVendor] = useState(false);
  const [openBrand, setOpenBrand] = useState(false);

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
    const newOpenPhone = [...openPhone];
    newOpenPhone[index] = false;
    setOpenPhone(newOpenPhone);
  };

  const handleVendorChange = (value) => {
    if (value === 'new') {
      setShowNewVendorDialog(true);
    } else {
      setFormData({ ...formData, vendor: value });
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
    setFormData({
      ...formData,
      purchase: [...formData.purchase, { phone: '', imei_number: '', unit_price: '' }]
    });
    setOpenPhone([...openPhone, false]);
  };

  const handleRemovePurchase = (index) => {
    const newPurchase = formData.purchase.filter((_, i) => i !== index);
    setFormData({ ...formData, purchase: newPurchase });
    const newOpenPhone = openPhone.filter((_, i) => i !== index);
    setOpenPhone(newOpenPhone);
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
          <Popover open={openVendor} onOpenChange={setOpenVendor}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openVendor}
                className="w-full justify-between"
              >
                {formData.vendor
                  ? vendors.find((vendor) => vendor.id.toString() === formData.vendor)?.name
                  : "Select a vendor..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search vendor..." />
                <CommandList>
                <CommandEmpty>No vendor found.</CommandEmpty>
                <CommandGroup>
                  {!loading && vendors.length > 0 ? (
                    <>
                      {vendors.map((vendor) => (
                        <CommandItem
                        key={vendor.id}
                          onSelect={() => handleVendorChange(vendor.id.toString())}
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
                      <CommandItem onSelect={() => handleVendorChange('new')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add a new vendor
                      </CommandItem>
                    </>
                  ) : loading ? (
                    <CommandItem>Loading...</CommandItem>
                  ) : (
                    <>
                      <CommandItem>No vendors available</CommandItem>
                      <CommandItem onSelect={() => handleVendorChange('new')}>
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

        <h3 className="text-xl font-semibold mb-2">Purchases</h3>
        {formData.purchase.map((purchase, index) => (
          <div key={index} className="bg-white p-4 rounded-md shadow">
            <h4 className="text-lg font-semibold mb-2">Purchase {index + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <Label htmlFor={`phone-${index}`} className="text-sm font-medium text-gray-800 mb-1">
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
                      className="w-full justify-between"
                    >
                      {purchase.phone
                        ? phones.find((phone) => phone.id.toString() === purchase.phone)?.name
                        : "Select a phone..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search phone..." />
                      <CommandList>
                      <CommandEmpty>No phone found.</CommandEmpty>
                      <CommandGroup>
                        {!loading && phones.length > 0 ? (
                          <>
                            {phones.map((phone) => (
                              <CommandItem
                                key={phone.id}
                                onSelect={() => handlePhoneChange(index, phone.id.toString())}
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
                            <CommandItem onSelect={() => handlePhoneChange(index, 'new')}>
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Add a new phone
                            </CommandItem>
                          </>
                        ) : loading ? (
                          <CommandItem>Loading...</CommandItem>
                        ) : (
                          <>
                            <CommandItem>No phones available</CommandItem>
                            <CommandItem onSelect={() => handlePhoneChange(index, 'new')}>
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
                <Popover open={openBrand} onOpenChange={setOpenBrand}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openBrand}
                      className="w-full justify-between"
                    >
                      {newPhoneData.brand
                        ? brands.find((brand) => brand.id.toString() === newPhoneData.brand)?.name
                        : "Select a brand..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search brand..." />
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
                <Popover open={openBrand} onOpenChange={setOpenBrand}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openBrand}
                      className="w-full justify-between"
                    >
                      {newVendorData.brand
                        ? brands.find((brand) => brand.id.toString() === newVendorData.brand)?.name
                        : "Select a brand..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search brand..." />
                      <CommandList>
                      <CommandEmpty>No brand found.</CommandEmpty>
                      <CommandGroup>
                        {brands.map((brand) => (
                          <CommandItem
                            key={brand.id}
                            onSelect={() => handleNewVendorBrandChange(brand.id.toString())}
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
                        <CommandItem onSelect={() => handleNewVendorBrandChange('new')}>
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