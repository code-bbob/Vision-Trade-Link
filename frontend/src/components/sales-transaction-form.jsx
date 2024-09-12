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
import { useNavigate } from "react-router-dom";
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
  const [openPhone, setOpenPhone] = useState(Array(formData.sales.length).fill(false));
  const [openBrand, setOpenBrand] = useState(false);
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
    const newOpenPhone = [...openPhone];
    newOpenPhone[index] = false;
    setOpenPhone(newOpenPhone);
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

  const handleAddSale = () => {
    setFormData({
      ...formData,
      sales: [...formData.sales, { phone: '', imei_number: '', unit_price: '' }]
    });
    setOpenPhone([...openPhone, false]);
  };

  const handleRemoveSale = (index) => {
    const newSales = formData.sales.filter((_, i) => i !== index);
    setFormData({ ...formData, sales: newSales });
    const newOpenPhone = openPhone.filter((_, i) => i !== index);
    setOpenPhone(newOpenPhone);
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
                      {sale.phone
                        ? phones.find((phone) => phone.id.toString() === sale.phone)?.name
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
                                    sale.phone === phone.id.toString() ? "opacity-100" : "opacity-0"
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
                          <CommandItem>No phones available</CommandItem>
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