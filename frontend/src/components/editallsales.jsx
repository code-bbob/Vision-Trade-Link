"use client";

import React, { useState, useEffect } from "react";
import useAxios from "../utils/useAxios";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
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
import Sidebar from "./allsidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "./ui/checkbox";

export default function EditAllSalesTransactionForm() {
  const api = useAxios();
  const navigate = useNavigate();
  const { salesId, branchId } = useParams();

  // Original data
  const [originalSalesData, setOriginalSalesData] = useState(null);
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    phone_number: "",
    bill_no: "",
    branch: "",
    sales: [],
    method: "",
    debtor: null,
    amount_paid: null,
    credited_amount: "",
    bonusSales: [],
    cheque_number: "",
    cashout_date: "",
    bonus_percent: 0,
    discount_percent: 0,
  });

  // Data lists
  const [products, setProducts] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [userBranch, setUserBranch] = useState({});

  // UI state
  const [openProduct, setOpenProduct] = useState([]);
  const [openDebtor, setOpenDebtor] = useState(false);

  // Loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [returns, setReturns] = useState([]);
  const [returned, setReturned] = useState(false);

  // Return dialog state
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [currentReturnSale, setCurrentReturnSale] = useState(null);
  const [returnQuantity, setReturnQuantity] = useState("");

  // Delete confirmation
  const [isChecked, setIsChecked] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [modifyStock, setModifyStock] = useState(true);

  // Computed fields
  const [subtotal, setSubtotal] = useState(0);
  const [discountType, setDiscountType] = useState("amount");
  const [discountValue, setDiscountValue] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, saleRes, debtorRes] = await Promise.all([
          api.get(`allinventory/product/branch/${branchId}/`),
          api.get(`alltransaction/salestransaction/${salesId}/`),
          api.get(`alltransaction/debtors/branch/${branchId}/`),
        ]);
        setProducts(prodRes.data);
        setDebtors(debtorRes.data);

        const data = saleRes.data;
        setOriginalSalesData(data);
        setFormData({
          date: data.date,
          name: data.name,
          phone_number: data.phone_number,
          bill_no: data.bill_no,
          branch: data.branch?.toString() || "",
          sales: data.sales.map((s) => ({
            ...s,
            product: s.product.toString(),
            unit_price: s.unit_price.toString(),
            quantity: s.quantity.toString(),
            total_price: s.total_price.toString(),
            returned: s.returned,
          })),
          method: data.method,
          debtor: data.debtor,
          amount_paid: data.amount_paid,
          discount: data.discount,
          credited_amount: data.credited_amount?.toString() || "",
          bonusSales: data.bonus || [],
          cheque_number: data.cheque_number || "",
          cashout_date: data.cashout_date || "",
          bonus_percent: data.bonus_percent || 0,
          discount_percent: data.discount_percent || 0,
        });
        setDiscountValue(data.discount?.toString() || "");
        setOpenProduct(new Array(data.sales.length).fill(false));
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data");
        setLoading(false);
      }
    }
    fetchData();
  }, [salesId, branchId]);

  // Fetch branch info
  useEffect(() => {
    async function fetchBranch() {
      try {
        const ubRes = await api.get("enterprise/getbranch/");
        setUserBranch(ubRes.data);
        if (ubRes.data.id) {
          setFormData((prev) => ({
            ...prev,
            branch: ubRes.data.id.toString(),
          }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchBranch();
  }, []);

  // Detect if any sale already returned
  useEffect(() => {
    originalSalesData?.sales.forEach((s) => {
      if (s.returned) setReturned(true);
    });
  }, [originalSalesData]);

  // Calculate subtotal
  useEffect(() => {
    const sum = formData.sales.reduce(
      (acc, sale) => acc + (parseFloat(sale.total_price) || 0),
      0
    );
    setSubtotal(sum);
  }, [formData.sales]);

  // Calculate totalAmount after discount
  useEffect(() => {
    const discAmt =
      discountType === "percent"
        ? subtotal * ((parseFloat(discountValue) || 0) / 100)
        : parseFloat(discountValue) || 0;
    setTotalAmount(subtotal - discAmt);
  }, [subtotal, discountType, discountValue]);

  // Update credited_amount when amount_paid changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      credited_amount: (
        totalAmount - (parseFloat(prev.amount_paid) || 0)
      ).toFixed(2),
    }));
  }, [formData.amount_paid, totalAmount]);

  // Checkbox confirmation handlers
  const handleCheckboxClick = () => {
    if (!isChecked) {
      setIsDialogOpen(true);
    } else {
      setIsChecked(false);
      setModifyStock(true);
    }
  };

  const handleConfirm = () => {
    setIsChecked(true);
    setModifyStock(false);
    setIsDialogOpen(false);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
  };

  // Handlers
  const calculateTotalPrice = (price, qty) => price * qty;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaleChange = (index, e) => {
    if (formData.sales[index].returned) return;
    const { name, value } = e.target;
    const updated = [...formData.sales];
    updated[index] = { ...updated[index], [name]: value };
    const { unit_price, quantity } = updated[index];
    if (unit_price && quantity) {
      updated[index].total_price = calculateTotalPrice(
        parseFloat(unit_price),
        parseFloat(quantity)
      ).toString();
    }
    setFormData({ ...formData, sales: updated });
  };

  const handleProductChange = (index, value) => {
    const prod = products.find((p) => p.id.toString() === value);
    const updated = [...formData.sales];
    updated[index] = {
      ...updated[index],
      product: value,
      unit_price: prod
        ? prod.selling_price.toString()
        : updated[index].unit_price,
    };
    updated[index].total_price = calculateTotalPrice(
      parseFloat(updated[index].unit_price),
      parseFloat(updated[index].quantity) || 0
    ).toString();
    setFormData({ ...formData, sales: updated });

    const op = [...openProduct];
    op[index] = false;
    setOpenProduct(op);
  };

  // Modified return handlers
  const handleReturnClick = (sale) => {
    setCurrentReturnSale(sale);
    setReturnQuantity("");
    setReturnDialogOpen(true);
  };

  const handleReturnConfirm = () => {
    if (!currentReturnSale || !returnQuantity) return;

    const qty = parseFloat(returnQuantity);
    const maxQty = parseFloat(currentReturnSale.quantity);

    if (qty <= 0 || qty > maxQty) {
      setError(`Return quantity must be between 1 and ${maxQty}`);
      return;
    }

    setReturns((r) => [
      ...r,
      {
        id: currentReturnSale.id,
        quantity: qty,
      },
    ]);

    setFormData((prev) => ({
      ...prev,
      sales: prev.sales.map((s) =>
        s.id === currentReturnSale.id ? { ...s, returned: true } : s
      ),
    }));

    setReturnDialogOpen(false);
    setCurrentReturnSale(null);
    setReturnQuantity("");
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    setSubLoading(true);
    try {
      await api.post("alltransaction/sales-return/", {
        returns: returns, // Changed to send array of {id, quantity}
        sales_transaction_id: salesId,
        branch: branchId,
      });
      navigate("/sales");
    } catch (err) {
      console.error(err);
      setError("Failed to process return. Please try again.");
    } finally {
      setSubLoading(false);
    }
  };

  const handleAddSale = () => {
    setFormData({
      ...formData,
      sales: [
        ...formData.sales,
        {
          product: "",
          unit_price: "",
          quantity: "",
          total_price: "",
          returned: false,
        },
      ],
    });
    setOpenProduct((o) => [...o, false]);
  };

  const handleRemoveSale = (index) => {
    if (formData.sales[index].returned) return;
    setFormData({
      ...formData,
      sales: formData.sales.filter((_, i) => i !== index),
    });
    setOpenProduct((o) => o.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    try {
      const url = modifyStock
        ? `alltransaction/salestransaction/${salesId}/?flag=${modifyStock}`
        : `alltransaction/salestransaction/${salesId}/`;
      await api.delete(url);
      navigate("/sales");
    } catch (err) {
      console.error(err);
      setError("Failed to delete sales transaction. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubLoading(true);
    try {
      const discAmt =
        discountType === "percent"
          ? subtotal * ((parseFloat(discountValue) || 0) / 100)
          : parseFloat(discountValue) || 0;
      const payload = {
        ...formData,
        subtotal,
        discount: discAmt,
        total_amount: totalAmount,
      };
      await api.patch(`alltransaction/salestransaction/${salesId}/`, payload);
      navigate("/sales");
    } catch (err) {
      console.error(err);
      setError("Failed to update sales transaction. Please try again.");
    } finally {
      setSubLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        Loading...
      </div>;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar />
      <div className="flex-1 p-4 lg:ml-64">
        <div className="flex justify-end mt-10 lg:mt-3">
          <Button
            onClick={() => navigate("/sales")}
            variant="outline"
            className="mb-4 w-full sm:w-auto px-5 text-black border-white hover:bg-gray-700 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-3" /> Back to Sales
          </Button>
        </div>
        <div className="max-w-2xl mx-auto bg-slate-800 p-4 sm:p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">
            Edit Sales Transaction
          </h2>
          {error && <p className="text-red-400 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
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

            {/* Debtor */}
            <div className="flex flex-col">
              <Label
                htmlFor="debtor"
                className="text-sm font-medium text-white mb-2"
              >
                Debtor
              </Label>
              <Popover open={openDebtor} onOpenChange={setOpenDebtor}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openDebtor}
                    className="w-full justify-between bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                  >
                    {formData?.debtor
                      ? debtors.find((d) => d.id === formData.debtor)?.name
                      : "Select a debtor..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                  <Command className="bg-slate-700 border-slate-600">
                    <CommandInput
                      placeholder="Search debtor..."
                      className="bg-slate-700 text-white"
                    />
                    <CommandList>
                      <CommandEmpty>No debtor found.</CommandEmpty>
                      <CommandGroup>
                        {debtors.map((debtor) => (
                          <CommandItem
                            key={debtor.id}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                debtor: debtor.id.toString(),
                              });
                              setOpenDebtor(false);
                            }}
                            className="text-white hover:bg-slate-600"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.debtor === debtor?.id?.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {debtor.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Bill No */}
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
                value={formData.bill_no}
                onChange={handleChange}
                className="w-full bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            {/* Sales items */}
            <h3 className="text-xl font-semibold mb-2 text-white">Sales</h3>
            {formData.sales.map((sale, index) => (
              <div
                key={index}
                className="bg-slate-700 p-4 rounded-md shadow mb-4"
              >
                <div className="flex justify-between">
                  <h4 className="text-lg font-semibold text-white">
                    Sale {index + 1}
                  </h4>
                  <Button
                    type="button"
                    className="bg-blue-500 hover:bg-blue-600"
                    disabled={sale.returned}
                    onClick={() => handleReturnClick(sale)}
                  >
                    Return
                  </Button>
                </div>

                {/* Product */}
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
                      onOpenChange={(o) => {
                        const op = [...openProduct];
                        op[index] = o;
                        setOpenProduct(op);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openProduct[index]}
                          disabled={sale.returned}
                          className="w-full bg-slate-600 border-slate-500 text-white hover:bg-slate-500 justify-between"
                        >
                          {sale.product
                            ? products.find(
                                (p) => p.id.toString() === sale.product
                              )?.name
                            : "Select a product..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                        <Command className="bg-slate-700">
                          <CommandInput
                            placeholder="Search product..."
                            className="bg-slate-700 text-white"
                          />
                          <CommandList>
                            <CommandEmpty>No product found.</CommandEmpty>
                            <CommandGroup>
                              {products.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  onSelect={() =>
                                    handleProductChange(index, p.id.toString())
                                  }
                                  className="text-white hover:bg-slate-600"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      sale.product === p.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {p.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Unit price */}
                  <div className="flex flex-col">
                    <Label
                      htmlFor={`unit_price-${index}`}
                      className="text-sm font-medium text-white mb-1"
                    >
                      Unit Price
                    </Label>
                    <Input
                      type="number"
                      id={`unit_price-${index}`}
                      name="unit_price"
                      value={sale.unit_price}
                      onChange={(e) => handleSaleChange(index, e)}
                      disabled={sale.returned}
                      className="w-full bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>

                  {/* Quantity */}
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
                      disabled={sale.returned}
                      className="w-full bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>

                  {/* Total price */}
                  <div className="flex flex-col">
                    <Label
                      htmlFor={`total_price-${index}`}
                      className="text-sm font-medium text-white mb-1"
                    >
                      Total Price
                    </Label>
                    <Input
                      type="number"
                      id={`total_price-${index}`}
                      name="total_price"
                      value={sale.total_price}
                      disabled
                      className="w-full bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Remove sale */}
                {index > 0 && !sale.returned && (
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

            {/* Totals and discount */}
            <div className="bg-slate-700 text-white p-4 rounded-md shadow mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <Label
                    htmlFor="subtotal"
                    className="text-sm font-medium mb-2"
                  >
                    Subtotal
                  </Label>
                  <Input
                    type="number"
                    id="subtotal"
                    name="subtotal"
                    value={subtotal.toFixed(2)}
                    readOnly
                    className="bg-slate-600 border-slate-500"
                  />
                </div>
                <div className="flex flex-col">
                  <Label
                    htmlFor="discount"
                    className="text-sm font-medium mb-2"
                  >
                    Discount ({formData.discount_percent ? formData.discount_percent : 0}%)
                  </Label>
                  <div className="flex space-x-2">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="bg-slate-600 border-slate-500 p-2 rounded"
                    >
                      <option value="amount">Amount</option>
                      <option value="percent">Percent</option>
                    </select>
                    <Input
                      type="number"
                      id="discountValue"
                      name="discountValue"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder="Enter discount"
                      className="bg-slate-600 border-slate-500"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <Label
                    htmlFor="total_amount"
                    className="text-sm font-medium mb-2"
                  >
                    Total Amount
                  </Label>
                  <Input
                    type="number"
                    id="total_amount"
                    name="total_amount"
                    value={totalAmount.toFixed(2)}
                    readOnly
                    className="bg-slate-600 border-slate-500"
                  />
                </div>
                {/* Payment method */}
                <div className="flex flex-col">
                  <Label htmlFor="method" className="text-sm font-medium mb-2">
                    Payment Method
                  </Label>
                  <Select
                    onValueChange={(v) =>
                      setFormData({ ...formData, method: v })
                    }
                    value={formData.method}
                    required
                  >
                    <SelectTrigger className="w-full bg-slate-600 border-slate-500">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 text-white border-slate-700">
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {formData.method !== "credit" && (
              <>
                <div className="flex flex-col">
                  <Label className="text-sm font-medium text-white mb-2">
                    Amount Paid
                  </Label>
                  <Input
                    type="number"
                    value={formData.amount_paid}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        amount_paid: e.target.value,
                      }))
                    }
                    className="bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="flex flex-col">
                  <Label className="text-sm font-medium text-white mb-2">
                    Credited Amount
                  </Label>
                  <Input
                    type="text"
                    value={formData.credited_amount}
                    readOnly
                    className="bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </>
            )}

            {formData.method === "cheque" && (
              <div className="bg-slate-700 text-white p-4 rounded-md shadow mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-white mb-2">
                      Cheque Number
                    </Label>
                    <Input
                      type="text"
                      value={formData.cheque_number}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          cheque_number: e.target.value,
                        }))
                      }
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-white mb-2">
                      Cashout Date
                    </Label>
                    <Input
                      type="date"
                      value={formData.cashout_date}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          cashout_date: e.target.value,
                        }))
                      }
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                </div>
              </div>
            )}
            
              {formData.bonusSales.length > 0 && (
                <div className="bg-slate-700 text-white p-4 rounded-md shadow mb-4">
                  <h3 className="text-xl font-semibold mb-4">Bonus Items ({formData.bonus_percent?formData.bonus_percent:0}%)</h3>

                  {/* Header Row */}
                  <div className="grid grid-cols-2 gap-4 font-medium border-b border-slate-600 pb-2">
                    <span>Product</span>
                    <span>Quantity</span>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-slate-600">
                    {formData.bonusSales.map((b, idx) => {
                      
                        
                      return (
                        <div key={idx} className="grid grid-cols-2 gap-4 py-2">
                          <span className="truncate">{b.product_name}</span>
                          <span className="">{b.quantity}</span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-sm text-gray-300 mt-3">
                    * Bonus items do not affect totals.
                  </p>
                </div>
              )}

          </form>

          {
            returned && (
              <p className="text-red-400 mt-4">
                Returned sales cannot be modified or deleted. Please delete the sales return if you want to make changes.
              </p>
            )
          }
          {/* Return & delete actions */}
          <Button
            type="button"
            onClick={handleReturn}
            disabled={returns.length === 0 || subLoading || returned}
            className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
          >
            Process Returns
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button disabled={subLoading || returned} className="w-full bg-red-600 hover:bg-red-700 text-white mt-4">
                Delete Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription className="text-slate-300">
                  This action cannot be undone. Permanently delete this
                  transaction.
                  
                  
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex justify-end space-x-2">
                <DialogClose asChild>
                  <Button variant="outline" className="bg-white text-black">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={subLoading}
                >
                  {subLoading ? "Deleting..." : "Delete Transaction"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Return Quantity Dialog */}
          <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
            <DialogContent className="bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Return Item</DialogTitle>
                <DialogDescription className="text-slate-300">
                  Enter the quantity you'd like to return for this item. Maximum
                  allowed: {currentReturnSale?.quantity}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <Label htmlFor="returnQuantity" className="text-sm mb-1 block">
                  Quantity to return
                </Label>
                <Input
                  id="returnQuantity"
                  type="number"
                  value={returnQuantity}
                  min="1"
                  max={currentReturnSale?.quantity}
                  onChange={(e) => setReturnQuantity(e.target.value)}
                  className="bg-slate-600 border-slate-500 text-white"
                />
              </div>
              {error && <p className="text-red-400 mt-2">{error}</p>}
              <DialogFooter className="flex justify-end space-x-2 mt-4">
                <Button
                  onClick={() => setReturnDialogOpen(false)}
                  variant="outline"
                  className="text-white bg-gray-600 hover:bg-gray-700 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReturnConfirm}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Confirm Return
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
