'use client'

import React, { useState, useEffect } from 'react';
import useAxios from '../utils/useAxios';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  CommandList,
} from "./ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"
import Sidebar from './sidebar';

export default function EditSalesTransactionForm() {
  const api = useAxios()
  const navigate = useNavigate()
  const { salesId } = useParams()

  const [originalSalesData, setOriginalSalesData] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    sales: []
  });
  const [phones, setPhones] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewPhoneDialog, setShowNewPhoneDialog] = useState(false);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [newPhoneData, setNewPhoneData] = useState({ name: '', brand: '' });
  const [newBrandName, setNewBrandName] = useState('');
  const [openPhone, setOpenPhone] = useState([]);
  const [openIMEI, setOpenIMEI] = useState([]);
  const [openBrand, setOpenBrand] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [phonesResponse, brandsResponse, salesResponse] = await Promise.all([
          api.get('inventory/phone/'),
          api.get('inventory/brand/'),
          api.get(`transaction/salestransaction/${salesId}/`)
        ]);
        setPhones(phonesResponse.data);
        setBrands(brandsResponse.data);
        setOriginalSalesData(salesResponse.data);
        setFormData({
          date: salesResponse.data.date,
          name: salesResponse.data.name,
          sales: salesResponse.data.sales.map(s => ({
            ...s,
            phone: s.phone.toString(),
            unit_price: s.unit_price.toString()
          }))
        });
        setOpenPhone(new Array(salesResponse.data.sales.length).fill(false));
        setOpenIMEI(new Array(salesResponse.data.sales.length).fill(false));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, [salesId]);

  const handleDelete = async () => {
    try {
      await api.delete(`transaction/salestransaction/${salesId}/`);
      navigate('/sales');
    } catch (error) {
      console.error('Error deleting sales transaction:', error);
      setError('Failed to delete sales transaction. Please try again.');
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaleChange = (index, e) => {
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
      newSales[index] = { ...newSales[index], phone: value, imei_number: '' };
      setFormData({ ...formData, sales: newSales });
    }
    const newOpenPhone = [...openPhone];
    newOpenPhone[index] = false;
    setOpenPhone(newOpenPhone);
  };

  const handleIMEIChange = (index, value) => {
    const newSales = [...formData.sales];
    newSales[index] = { ...newSales[index], imei_number: value };
    setFormData({ ...formData, sales: newSales });
    const newOpenIMEI = [...openIMEI];
    newOpenIMEI[index] = false;
    setOpenIMEI(newOpenIMEI);
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
    setOpenIMEI([...openIMEI, false]);
  };

  const handleRemoveSale = (index) => {
    const newSales = formData.sales.filter((_, i) => i !== index);
    setFormData({ ...formData, sales: newSales });
    const newOpenPhone = openPhone.filter((_, i) => i !== index);
    setOpenPhone(newOpenPhone);
    const newOpenIMEI = openIMEI.filter((_, i) => i !== index);
    setOpenIMEI(newOpenIMEI);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.patch(`transaction/salestransaction/${salesId}/`, formData);
      console.log('Response:', response.data);
      navigate('/sales');
    } catch (error) {
      console.error('Error updating data:', error);
      setError('Failed to update sales transaction. Please try again.');
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
    } catch (error) {
      console.error('Error adding phone:', error);
      setError('Failed to add new phone. Please try again.');
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
    } catch (error) {
      console.error('Error adding brand:', error);
      setError('Failed to add new brand. Please try again.');
    }
  };

  const hasFormChanged = () => {
    if (!originalSalesData) return false;
    
    return (
      formData.date !== originalSalesData.date ||
      formData.name !== originalSalesData.name ||
      formData.sales.length !== originalSalesData.sales.length ||
      formData.sales.some((sale, index) => {
        const originalSale = originalSalesData.sales[index];
        return (
          sale.phone !== originalSale.phone.toString() ||
          sale.imei_number !== originalSale.imei_number ||
          sale.unit_price !== originalSale.unit_price.toString()
        );
      })
    );
  };

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar />
      <div className=''>
        <Button
          onClick={() => navigate('/sales')}
          variant="outline"
          className="w-full sm:w-auto px-5 text-slate-900 border-white hover:bg-gray-500 mx-9 ml-80 mt-4 hover:text-slate-900 items-right"
        >
          <ArrowLeft className="mr-2 h-4 w-3" />
          Back to Sales
        </Button>

        <div className="max-w-2xl mx-auto ml-96 bg-slate-800 p-8 m-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-white">Edit Sales Transaction</h2>
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
              <Label htmlFor="name" className="text-lg font-medium text-white mb-2">
                Customer's Name
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            <h3 className="text-xl font-semibold mb-2 text-white">Sales</h3>
            {formData.sales.map((sale, index) => (
              <div key={index} className="bg-slate-700 p-4 rounded-md shadow">
                <h4 className="text-lg font-semibold mb-2 text-white">Sale {index + 1}</h4>
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
                          {sale.phone
                            ? phones.find((phone) => phone.id.toString() === sale.phone)?.name
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
                              {phones.map((phone) => (
                                <CommandItem
                                  key={phone.id}
                                  onSelect={() => handlePhoneChange(index, phone.id.toString())}
                                  className="text-white hover:bg-slate-600"
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
                              <CommandItem onSelect={() => handlePhoneChange(index, 'new')} className="text-white hover:bg-slate-600">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add a new phone
                              </CommandItem>
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
                    <Popover open={openIMEI[index]} onOpenChange={(open) => {
                      const newOpenIMEI = [...openIMEI];
                      newOpenIMEI[index] = open;
                      setOpenIMEI(newOpenIMEI);
                    }}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openIMEI[index]}
                          className="w-full justify-between bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                        >
                          {sale.imei_number || "Select IMEI..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                        <Command className='bg-slate-700 border-slate-600 h-60 overflow-y-scroll'>
                          <CommandInput placeholder="Search IMEI..." className="bg-slate-700 text-white" />
                          <CommandList>
                            <CommandEmpty>No IMEI found.</CommandEmpty>
                            <CommandGroup>
                              {sale.phone && phones.find(phone => phone.id.toString() === sale.phone)?.imeis.map((imei) => (
                                <CommandItem
                                  key={imei}
                                  onSelect={() => handleIMEIChange(index, imei)}
                                  className="text-white hover:bg-slate-600"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      sale.imei_number === imei ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {imei}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col">
                    <Label htmlFor={`price-${index}`} className="text-sm font-medium text-white mb-1">
                      Unit Price
                    </Label>
                    <Input
                      type="number"
                      id={`price-${index}`}
                      name="unit_price"
                      value={sale.unit_price}
                      onChange={(e) => handleSaleChange(index, e)}
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
                    onClick={() => handleRemoveSale(index)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Sale
                  </Button>
                )}
              </div>
            ))}

            <Button type="button" onClick={handleAddSale} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Another Sale
            </Button>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={!hasFormChanged()}
            >
              Update Sales Transaction
            </Button>
          </form>
          
          <Dialog>
            <DialogTrigger className='w-full'>
              <Button 
                type="button" 
                className="w-full bg-red-600 mt-6 hover:bg-red-700 text-white"
              >
                Delete Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your sales transaction
                  and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <Button 
                type="button" 
                className="w-full bg-red-600 mt-6 hover:bg-red-700 text-white"
                onClick={handleDelete}
              >
                Delete Transaction
              </Button>
            </DialogContent>
          </Dialog>

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