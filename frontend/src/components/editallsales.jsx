"use client";

import React, { useState, useEffect } from "react";
import useAxios from "../utils/useAxios";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  PlusCircle,
  Trash2,
  Check,
  ChevronsUpDown,
  ArrowLeft,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Sidebar from "./sidebar";

export default function EditAllSalesTransactionForm() {
  const api = useAxios();
  const navigate = useNavigate();
  const { salesId } = useParams();

  const [originalSalesData, setOriginalSalesData] = useState(null);
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    bill_no: "",
    phone_number: "",
    sales: [],
  });
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [newProductData, setNewProductData] = useState({ name: "", brand: "" });
  const [newBrandName, setNewBrandName] = useState("");
  const [openProduct, setOpenProduct] = useState([]);
  const [openBrand, setOpenBrand] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, brandsResponse, salesResponse] =
          await Promise.all([
            api.get("allinventory/product/"),
            api.get("allinventory/brand/"),
            api.get(`alltransaction/salestransaction/${salesId}/`),
          ]);
        setProducts(productsResponse.data);
        setBrands(brandsResponse.data);
        setOriginalSalesData(salesResponse.data);
        setFormData({
          date: salesResponse.data.date,
          name: salesResponse.data.name,
          phone_number: salesResponse.data.phone_number,
          bill_no: salesResponse.data.bill_no,
          sales: salesResponse.data.sales.map((s) => ({
            ...s,
            product: s.product.toString(),
            unit_price: s.unit_price.toString(),
            quantity: s.quantity.toString(),
            total_price: s.total_price.toString(),
          })),
        });
        setOpenProduct(new Array(salesResponse.data.sales.length).fill(false));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data");
        setLoading(false);
      }
    };

    fetchData();
  }, [salesId]);

  const handleDelete = async () => {
    try {
      await api.delete(`alltransaction/salestransaction/${salesId}/`);
      navigate("/sales");
    } catch (error) {
      console.error("Error deleting sales transaction:", error);
      setError("Failed to delete sales transaction. Please try again.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaleChange = (index, e) => {
    const { name, value } = e.target;
    const newSales = [...formData.sales];
    newSales[index] = { ...newSales[index], [name]: value };
    setFormData({ ...formData, sales: newSales });

    const { unit_price, quantity } = newSales[index];
    if (unit_price && quantity) {
      newSales[index].total_price = calculateTotalPrice(unit_price, quantity);
    }
    setFormData({ ...formData, sales: newSales });
  };

  const handleProductChange = (index, value) => {
    if (value === "new") {
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
    if (value === "new") {
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
      sales: [
        ...formData.sales,
        { product: "", unit_price: "", quantity: "", total_price: "" },
      ],
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
      setSubLoading(true);
      const response = await api.patch(
        `alltransaction/salestransaction/${salesId}/`,
        formData
      );
      console.log("Response:", response.data);
      navigate("/sales");
    } catch (error) {
      console.error("Error updating data:", error);
      setError("Failed to update sales transaction. Please try again.");
    } finally {
      setSubLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("inventory/product/", newProductData);
      console.log("New Product Added:", response.data);
      setProducts((prevProducts) => [...prevProducts, response.data]);
      setNewProductData({ name: "", brand: "" });
      setShowNewProductDialog(false);
    } catch (error) {
      console.error("Error adding product:", error);
      setError("Failed to add new product. Please try again.");
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("inventory/brand/", {
        name: newBrandName,
      });
      console.log("New Brand Added:", response.data);
      setBrands((prevBrands) => [...prevBrands, response.data]);
      setNewBrandName("");
      setShowNewBrandDialog(false);
      setNewProductData((prevData) => ({
        ...prevData,
        brand: response.data.id.toString(),
      }));
    } catch (error) {
      console.error("Error adding brand:", error);
      setError("Failed to add new brand. Please try again.");
    }
  };

const calculateTotalPrice = (quantity, unit_price) => {
    return quantity * unit_price;
    };


  const hasFormChanged = () => {
    if (!originalSalesData) return false;

    return (
      formData.date !== originalSalesData.date ||
      formData.name !== originalSalesData.name ||
      formData.phone_number !== originalSalesData.phone_number?.toString() ||
      formData.bill_no !== originalSalesData.bill_no?.toString() ||
      formData.sales.length !== originalSalesData.sales.length ||
      formData.sales.some((sale, index) => {
        const originalSale = originalSalesData.sales[index];
        return (
          sale.product !== originalSale.product.toString() ||
          sale.unit_price !== originalSale.unit_price.toString() ||
          sale.quantity !== originalSale.quantity.toString() ||
          sale.total_price !== originalSale.total_price.toString()
        );
      })
    );
  };

  if (loading) {
    return <div className="text-white min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar />
      <div className="flex-1 p-4 lg:ml-64">
        <div className="flex justify-end mt-10 lg:mt-3">
          <Button
            onClick={() => navigate("/mobile/sales")}
            variant="outline"
            className="mb-4 w-full sm:w-auto px-5 text-black border-white hover:bg-gray-700 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-3" />
            Back to Sales
          </Button>
        </div>

        <div className="max-w-2xl mx-auto bg-slate-800 p-4 sm:p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">
            Edit Sales Transaction
          </h2>
          {error && <p className="text-red-400 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col">
              <Label
                htmlFor="date"
                className="text-lg font-medium text-white mb-2"
              >
                Date
              </Label>
              <Input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            <div className="flex flex-col">
              <Label
                htmlFor="name"
                className="text-lg font-medium text-white mb-2"
              >
                Customer's Name
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <Label
                htmlFor="phone_number"
                className="text-lg font-medium text-white mb-2"
              >
                Customer's Phone number
              </Label>
              <Input
                type="text"
                id="phone_number"
                name="phone_number"
                placeholder="Customer's Phone number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full border border-slate-600 text-white rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <Label
                htmlFor="bill_no"
                className="text-lg font-medium text-white mb-2"
              >
                Bill No.
              </Label>
              <Input
                type="text"
                id="bill_no"
                name="bill_no"
                placeholder="Enter bill number"
                value={formData.bill_no}
                onChange={handleChange}
                className="w-full border border-slate-600 text-white rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <h3 className="text-xl font-semibold mb-2 text-white">Sales</h3>
            {formData.sales.map((sale, index) => (
              <div key={index} className="bg-slate-700 p-4 rounded-md shadow">
                <h4 className="text-lg font-semibold mb-4 text-white">
                  Sale {index + 1}
                </h4>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <Label
                      htmlFor={`product-${index}`}
                      className="text-sm font-medium text-white mb-1"
                    >
                      Product
                    </Label>
                    <Popover
                      open={openProduct[index]}
                      onOpenChange={(open) => {
                        const newOpenProduct = [...openProduct];
                        newOpenProduct[index] = open;
                        setOpenProduct(newOpenProduct);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openProduct[index]}
                          className="w-full justify-between bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                        >
                          {sale.product
                            ? products.find(
                                (product) =>
                                  product.id.toString() === sale.product
                              )?.name
                            : "Select a product..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                        <Command className="bg-slate-700 border-slate-600">
                          <CommandInput
                            placeholder="Search product..."
                            className="bg-slate-700 text-white"
                          />
                          <CommandList>
                            <CommandEmpty>No product found.</CommandEmpty>
                            <CommandGroup>
                              {products.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  onSelect={() =>
                                    handleProductChange(
                                      index,
                                      product.id.toString()
                                    )
                                  }
                                  className="text-white hover:bg-slate-600"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      sale.product === product.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {product.name}
                                </CommandItem>
                              ))}
                              <CommandItem
                                onSelect={() =>
                                  handleProductChange(index, "new")
                                }
                                className="text-white hover:bg-slate-600"
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add a new product
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex flex-col">
                    <Label
                      htmlFor={`price-${index}`}
                      className="text-sm font-medium text-white mb-1"
                    >
                      Unit Price
                    </Label>
                    <Input
                      type="number"
                      id={`price-${index}`}
                      name="unit_price"
                      value={sale.unit_price}
                      onChange={(e) => handleSaleChange(index, e)}
                      className="w-full bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter unit price"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label
                      htmlFor={`quantity-${index}`}
                      className="text-sm font-medium text-white mb-1"
                    >
                      Quantity
                    </Label>
                    <Input
                      type="number"
                      id={`quantity-${index}`}
                      name="quantity"
                      value={sale.quantity}
                      onChange={(e) => handleSaleChange(index, e)}
                      className="w-full bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter quantity"
                      required
                    />
                    </div>
                    <div className="flex flex-col">
                        <Label
                            htmlFor={`total-${index}`}
                            className="text-sm font-medium text-white mb-1"
                        >
                            Total Price
                        </Label>
                        <Input
                            type="number"
                            id={`total-${index}`}
                            name="total_price"
                            value={sale.total_price}
                            onChange={(e) => handleSaleChange(index, e)}
                            className="w-full bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
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
                    className="mt-4 w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleRemoveSale(index)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Sale
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              onClick={handleAddSale}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Another Sale
            </Button>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={!hasFormChanged() || subLoading}
            >
              Update Sales Transaction
            </Button>
          </form>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                className="w-full bg-red-600 mt-6 hover:bg-red-700 text-white"
              >
                Delete Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription className="text-slate-300">
                  This action cannot be undone. This will permanently delete
                  your sales transaction and remove your data from our servers.
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

          <Dialog
            open={showNewProductDialog}
            onOpenChange={setShowNewProductDialog}
          >
            <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription className="text-slate-300">
                  Enter the details of the new product you want to add.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="newProductName"
                    className="text-right text-white"
                  >
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
                  <Label
                    htmlFor="newProductBrand"
                    className="text-right text-white"
                  >
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
                            ? brands.find(
                                (brand) =>
                                  brand.id.toString() === newProductData.brand
                              )?.name
                            : "Select a brand..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                        <Command className="bg-slate-700 border-slate-600">
                          <CommandInput
                            placeholder="Search brand..."
                            className="bg-slate-700 text-white"
                          />
                          <CommandList>
                            <CommandEmpty>No brand found.</CommandEmpty>
                            <CommandGroup>
                              {brands.map((brand) => (
                                <CommandItem
                                  key={brand.id}
                                  onSelect={() =>
                                    handleNewProductBrandChange(
                                      brand.id.toString()
                                    )
                                  }
                                  className="text-white hover:bg-slate-600"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newProductData.brand ===
                                        brand.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {brand.name}
                                </CommandItem>
                              ))}
                              <CommandItem
                                onSelect={() =>
                                  handleNewProductBrandChange("new")
                                }
                                className="text-white hover:bg-slate-600"
                              >
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
                <Button
                  type="button"
                  onClick={handleAddProduct}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Add Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showNewBrandDialog}
            onOpenChange={setShowNewBrandDialog}
          >
            <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Brand</DialogTitle>
                <DialogDescription className="text-slate-300">
                  Enter the name of the new brand you want to add.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="newBrandName"
                    className="text-right text-white"
                  >
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
                <Button
                  type="button"
                  onClick={handleAddBrand}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Add Brand
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
