'use client'

import React, { useState, useEffect } from 'react';
import useAxios from '@/utils/useAxios';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Trash2, Check, ChevronsUpDown, ArrowLeft } from 'lucide-react'
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Sidebar from '@/components/allsidebar';

function AllSalesTransactionForm() {
  const api = useAxios()
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    phone_number: '',
    bill_no: '',
    sales: [{ product: '', unit_price: '',quantity: '', total_price: '' }]
  });
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [newProductData, setNewProductData] = useState({ name: '', brand: '' });
  const [newBrandName, setNewBrandName] = useState('');
  const [openProduct, setOpenProduct] = useState(Array(formData.sales.length).fill(false));
  const [openBrand, setOpenBrand] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [nextBill,setNextBill] = useState('');
  const navigate = useNavigate();


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, brandsResponse, nextBill] = await Promise.all([
          api.get('allinventory/product/'),
          api.get('allinventory/brand/'),
          api.get('alltransaction/next-bill-no/'),
        ]);
        setProducts(productsResponse.data);
        setBrands(brandsResponse.data);
        setNextBill(nextBill.data.bill_no);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (nextBill) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        bill_no: nextBill,
      }));
    }
  }, [nextBill]);
  

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const newSales = [...formData.sales];
    newSales[index] = { ...newSales[index], [name]: value };
    setFormData({ ...formData, sales: newSales });

    
    const { unit_price, quantity } = newSales[index];
    if (unit_price && quantity) {
      newSales[index].total_price = calculateTotalPrice(unit_price, quantity);
    }
    console.log(newSales[index])
  
    setFormData({ ...formData, sales: newSales });
  };

  const handleProductChange = (index, value) => {
    if (value === 'new') {
      setShowNewProductDialog(true);
    } else {
      const newSales = [...formData.sales];
      newSales[index] = { ...newSales[index], product: value };
      setFormData({ ...formData, sales: newSales });
    }
    const newOpenProduct = [...openProduct];
    newOpenProduct[index] = false;
    setOpenProduct(newOpenProduct);


  };

  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProductData({ ...newProductData, [name]: value });
  };

  const handleNewProductBrandChange = (value) => {
    if (value === 'new') {
      setShowNewBrandDialog(true);
    } else {
      setNewProductData({ ...newProductData, brand: value });
    }
    setOpenBrand(false);
  };

  const handleNewBrandChange = (e) => {
    setNewBrandName(e.target.value);
  };

  const handleAddSale = () => {
    setFormData({
      ...formData,
      sales: [...formData.sales, { product: '',unit_price: '', quantity:'', total_price: '' }]
    });
    setOpenProduct([...openProduct, false]);
  };

  const handleRemoveSale = (index) => {
    const newSales = formData.sales.filter((_, i) => i !== index);
    setFormData({ ...formData, sales: newSales });
    const newOpenProduct = openProduct.filter((_, i) => i !== index);
    setOpenProduct(newOpenProduct);

  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubLoading(true)
      const response = await api.post('alltransaction/salestransaction/', formData);
      console.log('Response:', response.data);
      navigate('/invoice/' + response.data.id);
    } catch (error) {
      console.error('Error posting data:', error);
    } finally {
      setSubLoading(false)
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('inventory/product/', newProductData);
      console.log('New Product Added:', response.data);
      setProducts([...products, response.data]);
      setNewProductData({ name: '', brand: '' });
      setShowNewProductDialog(false);
    } catch (error) {
      console.error('Error adding product:', error);
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
      setNewProductData({ ...newProductData, brand: response.data.id.toString() });
    } catch (error) {
      console.error('Error adding brand:', error);
    }
  };

  const calculateTotalPrice = (quantity,unit_price) => {
    return quantity * unit_price;
    };

  const [currentWord, setCurrentWord] = useState('');
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
        console.log("Word is:", currentWord.slice(0,-1));
        const matchingProduct = products.find((product) => product.uid === currentWord.slice(0,-1));
        console.log("Matching product:", matchingProduct);
        
        if (matchingProduct) {
            // Check if there is an existing sale with an empty product field
            const emptySaleIndex = formData.sales.findIndex(sale => !sale.product);
            
            if (emptySaleIndex !== -1) {
                // If an empty sale exists, update it with the matched product
                const updatedSales = [...formData.sales];
                updatedSales[emptySaleIndex].product = matchingProduct.id.toString();
                updatedSales[emptySaleIndex].unit_price = matchingProduct.unit_price;
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    sales: updatedSales
                }));
            } else {
                // If no empty sale exists, add a new sale with the scanned product
                const newSale = {
                    product: matchingProduct.id.toString(),
                    unit_price: matchingProduct.unit_price, // You can pre-fill this if you have default unit prices
                    quantity: '',
                    total_price: ''
                };
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    sales: [...prevFormData.sales, newSale]
                }));
            }
        } else {
            console.log("Product not found");
        }
        setCurrentWord(''); // Clear the current word after processing
    } else {
        setCurrentWord((prev) => prev + e.key); // Accumulate the key pressed
    }
};



  useEffect(() => {

  window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        }
    }, [currentWord,products]);


  return (


    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar className="hidden lg:block w-64 flex-shrink-0" />
      <div className="flex-grow p-4 lg:p-6 lg:ml-64 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => navigate('/mobile/')}
            variant="outline"
            className="mb-6 px-4 py-2 text-black border-white hover:bg-gray-700 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-white">Add Sales Transaction</h2>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <Label htmlFor="date" className="text-sm font-medium text-white mb-2">
                    Date
                  </Label>
                  <Input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="name" className="text-sm font-medium text-white mb-2">
                    Customer's name
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Customer's Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="phone_number" className="text-sm font-medium text-white mb-2">
                    Customer's Phone number
                  </Label>
                  <Input
                    type="text"
                    id="phone_number"
                    name="phone_number"
                    placeholder="Customer's Phone number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="bill_no" className="text-sm font-medium text-white mb-2">
                    Bill No.
                  </Label>
                  <Input
                    type="text"
                    id="bill_no"
                    name="bill_no"
                    placeholder="Enter bill number"
                    value={nextBill}
                    onChange={(e) => setFormData({ ...formData, bill_no: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              {formData.sales.map((sale, index) => (
                <div key={index} className="bg-slate-700 text-white p-4 rounded-md shadow">
                  <h3 className="text-lg font-semibold mb-4">Sale {index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <Label htmlFor={`product-${index}`} className="text-sm font-medium text-white mb-2">
                        Product
                      </Label>
                      <Popover open={openProduct[index]} onOpenChange={(open) => {
                        const newOpenProduct = [...openProduct];
                        newOpenProduct[index] = open;
                        setOpenProduct(newOpenProduct);
                      }}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openProduct[index]}
                            className="w-full justify-between bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                          >
                            {sale.product
                              ? products.find((product) => product.id.toString() === sale.product)?.name
                              : "Select a product..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command className='bg-slate-700 border-slate-600'>
                            <CommandInput className="bg-slate-700 text-white" placeholder="Search product..." />
                            <CommandList>
                              <CommandEmpty>No product found.</CommandEmpty>
                              <CommandGroup>
                                {!loading && products.length > 0 ? (
                                  <>
                                    {products.map((product) => (
                                      <CommandItem
                                        key={product.id}
                                        onSelect={() => handleProductChange(index, product.id.toString())}
                                        className="bg-slate-700 text-white hover:bg-slate-600"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            sale.product === product.id.toString() ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {product.name}
                                      </CommandItem>
                                    ))}
                                    <CommandItem className="bg-slate-700 text-white hover:bg-slate-600" onSelect={() => handleProductChange(index, 'new')}>
                                      <PlusCircle className="mr-2 h-4 w-4" />
                                      Add a new product
                                    </CommandItem>
                                  </>
                                ) : loading ? (
                                  <CommandItem>Loading...</CommandItem>
                                ) : (
                                  <CommandItem>No products available</CommandItem>
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                   
                    <div className="flex flex-col">
                      <Label htmlFor={`price-${index}`} className="text-sm font-medium text-white mb-2">
                        Unit Price
                      </Label>
                      <Input
                        type="number"
                        id={`price-${index}`}
                        name="unit_price"
                        value={sale.unit_price}
                        onChange={(e) => handleChange(index, e)}
                        className="bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter unit price"
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label htmlFor={`price-${index}`} className="text-sm font-medium text-white mb-2">
                        Quantity
                      </Label>
                      <Input
                        type="number"
                        id={`quantity-${index}`}
                        name="quantity"
                        value={sale.quantity}
                        onChange={(e) => handleChange(index, e)}
                        className="bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter quantity"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <Label htmlFor={`price-${index}`} className="text-sm font-medium text-white mb-2">
                        Total Price
                      </Label>
                      <Input
                        type="number"
                        id={`total_price-${index}`}
                        name="total_price"
                        value={calculateTotalPrice(sale.quantity,sale.unit_price)}
                        onChange={(e) => handleChange(index, e)}
                        className="bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter total price"
                        required
                      />
                    </div>
                  </div>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-4"
                      onClick={() => handleRemoveSale(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Sale
                    </Button>
                  )}
                </div>
              ))}

              <Button type="button" onClick={handleAddSale} className="w-full bg-purple-600 hover:bg-purple-700">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Another Sale
              </Button>

              <Button type="submit" disabled={subLoading} className="w-full bg-green-600 hover:bg-green-700">
                Submit Transaction
              </Button>
            </form>

            <Dialog open={showNewProductDialog} onOpenChange={setShowNewProductDialog}>
              <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new product you want to add.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newProductName" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="newProductName"
                      name="name"
                      value={newProductData.name}
                      onChange={handleNewProductChange}
                      className="col-span-3 bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newProductBrand" className="text-right">
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
                            {newProductData.brand
                              ? brands.find((brand) => brand.id.toString() === newProductData.brand)?.name
                              : "Select a brand..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command className="bg-slate-700 border-slate-600">
                            <CommandInput className="bg-slate-700 text-white" placeholder="Search brand..." />
                            <CommandList>
                              <CommandEmpty>No brand found.</CommandEmpty>
                              <CommandGroup>
                                {brands.map((brand) => (
                                  <CommandItem
                                    key={brand.id}
                                    onSelect={() => handleNewProductBrandChange(brand.id.toString())}
                                    className="text-white hover:bg-slate-600"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        newProductData.brand === brand.id.toString() ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {brand.name}
                                  </CommandItem>
                                ))}
                                <CommandItem className="text-white hover:bg-slate-600" onSelect={() => handleNewProductBrandChange('new')}>
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
                  <Button type="button" onClick={handleAddProduct} className="bg-purple-600 hover:bg-purple-700 text-white">Add Product</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showNewBrandDialog} onOpenChange={setShowNewBrandDialog}>
              <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
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
                      className="col-span-3 bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter brand name"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleAddBrand} className="bg-purple-600 hover:bg-purple-700 text-white">Add Brand</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AllSalesTransactionForm;