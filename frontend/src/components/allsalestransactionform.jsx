"use client";

import React, { useState, useEffect } from "react";
import useAxios from "@/utils/useAxios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlusCircle,
  Trash2,
  Check,
  ChevronsUpDown,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useBranchId } from "@/hooks/useBranch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Sidebar from "@/components/allsidebar";
import NewProductDialog from "@/components/newProductDialog";

export default function AllSalesTransactionForm() {
  const api = useAxios();
  const branchId = useBranchId();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [error, setError] = useState(null);

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [nextBill, setNextBill] = useState("");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    bill_no: "",
    branch: branchId,
    sales: [{ product: "", unit_price: "", quantity: "", total_price: "" }],
    method: "credit",
    debtor: "",
    amount_paid: 0,
    credited_amount: "",
    cheque_number: "",
    cashout_date: null,
    bonus: [],
    bonus_percent: 0,
    discount_percent: 0,
  });

  // new-item dialogs/popovers
  const [openProduct, setOpenProduct] = useState([false]);
  const [openDebtor, setOpenDebtor] = useState(false);
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [showNewDebtorDialog, setShowNewDebtorDialog] = useState(false);

  const [newProductData, setNewProductData] = useState({
    name: "",
    brand: "",
    selling_price: "",
    cost_price: "",
    branch: branchId,
  });
  const [newBrandName, setNewBrandName] = useState("");
  const [newDebtorData, setNewDebtorData] = useState({
    name: "",
    phone_number: "",
    due: "",
    branch: branchId,
  });

  // calculations
  const [subtotal, setSubtotal] = useState(0);
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  // bonus
  const [bonusPercent, setBonusPercent] = useState("");
  const [bonusSales, setBonusSales] = useState([]);

  // fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          productsRes,
          brandsRes,
          debtorsRes,
        ] = await Promise.all([
          api.get(`allinventory/product/branch/${branchId}/`),
          api.get(`allinventory/brand/branch/${branchId}/`),
          api.get(`alltransaction/debtors/branch/${branchId}/`),
        ]);
        setProducts(productsRes.data);
        setBrands(brandsRes.data);
        setDebtors(debtorsRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ branchId]);



  // recalc subtotal
  useEffect(() => {
    const sum = formData.sales.reduce(
      (acc, s) => acc + (parseFloat(s.total_price) || 0),
      0
    );
    setSubtotal(sum);
  }, [formData.sales]);

  // recalc total
  useEffect(() => {
    const discAmt =
      discountType === "percent"
        ? subtotal * ((parseFloat(discountValue) || 0) / 100)
        : parseFloat(discountValue) || 0;
      if (discountType === "percent") {
        
        setFormData((f) => ({ ...f, discount_percent: discountValue ? parseFloat(discountValue) : 0 }));
      }
    setTotalAmount(subtotal - discAmt);
  }, [subtotal, discountType, discountValue]);

  // credited amount
  useEffect(() => {
    setFormData((f) => ({
      ...f,
      credited_amount: (totalAmount - (parseFloat(f.amount_paid) || 0)).toFixed(2),
    }));
  }, [formData.amount_paid, totalAmount]);

  // compute bonusSales & sync to formData.bonus
  useEffect(() => {
    const pct = parseFloat(bonusPercent) / 100;
    let bonuses = [];
    if (pct > 0) {
      bonuses = formData.sales
        .map((s) => {
          const qty = parseFloat(s.quantity) || 0;
          const bonusQty = Math.floor(qty * pct);
          return { product: s.product, quantity: bonusQty };
        })
        .filter((b) => b.quantity > 0);
    }
    setBonusSales(bonuses);
    setFormData((f) => ({ ...f, bonus: bonuses }));
  }, [bonusPercent, formData.sales]);

  // handlers
  const handleSaleChange = (idx, e) => {
    const { name, value } = e.target;
    const salesCopy = [...formData.sales];
    salesCopy[idx] = { ...salesCopy[idx], [name]: value };
    if (salesCopy[idx].unit_price && salesCopy[idx].quantity) {
      salesCopy[idx].total_price =
        parseFloat(salesCopy[idx].unit_price) *
        parseFloat(salesCopy[idx].quantity);
    }
    setFormData({ ...formData, sales: salesCopy });
  };

  const handleProductSelect = (idx, val) => {
    if (val === "new") {
      setShowNewProductDialog(true);
    } else {
      const prod = products.find((p) => p.id.toString() === val);
      const salesCopy = [...formData.sales];
      salesCopy[idx] = {
        ...salesCopy[idx],
        product: val,
        unit_price: prod?.selling_price || "",
      };
      setFormData({ ...formData, sales: salesCopy });
    }
    setOpenProduct((o) => {
      const copy = [...o];
      copy[idx] = false;
      return copy;
    });
  };

  const handleAddSale = () => {
    setFormData((f) => ({
      ...f,
      sales: [
        ...f.sales,
        { product: "", unit_price: "", quantity: "", total_price: "" },
      ],
    }));
    setOpenProduct((o) => [...o, false]);
  };

  const handleRemoveSale = (idx) => {
    setFormData((f) => ({
      ...f,
      sales: f.sales.filter((_, i) => i !== idx),
    }));
    setOpenProduct((o) => o.filter((_, i) => i !== idx));
  };

  const addNewProduct = async () => {
    try {
      const res = await api.post("allinventory/product/", newProductData);
      setProducts((p) => [...p, res.data]);
      setNewProductData({
        name: "",
        brand: "",
        selling_price: "",
        cost_price: "",
        branch: branchId,
      });
      setShowNewProductDialog(false);
    } catch {
      setError("Failed to add product");
    }
  };

  const addNewBrand = async () => {
    try {
      const res = await api.post("allinventory/brand/", {
        name: newBrandName,
        branch: branchId,
      });
      setBrands((b) => [...b, res.data]);
      setNewBrandName("");
      setShowNewBrandDialog(false);
      setNewProductData((d) => ({ ...d, brand: res.data.id.toString() }));
    } catch {
      setError("Failed to add brand");
    }
  };

  const addNewDebtor = async () => {
    try {
      const res = await api.post("alltransaction/debtors/", newDebtorData);
      setDebtors((d) => [...d, res.data]);
      setFormData((f) => ({ ...f, debtor: res.data.id.toString() }));
      setNewDebtorData({ name: "", phone_number: "", due: "", branch: branchId });
      setShowNewDebtorDialog(false);
    } catch {
      setError("Failed to add debtor");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubLoading(true);
    try {
      const discountAmt =
        discountType === "percent"
          ? subtotal * ((parseFloat(discountValue) || 0) / 100)
          : parseFloat(discountValue) || 0;

      const payload = {
        ...formData,
        subtotal,
        discount: discountAmt,
        total_amount: totalAmount,
      };
      await api.post("alltransaction/salestransaction/", payload);
      navigate("/sales/branch/" + branchId);
    } catch {
      setError("Failed to submit transaction");
    } finally {
      setSubLoading(false);
    }
  };

 if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar className="hidden lg:block w-64 flex-shrink-0" />
      <div className="flex-grow p-4 lg:p-6 lg:ml-64 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => navigate("/sales/branch/" + branchId)}
            variant="outline"
            className="mb-6 px-4 py-2 text-black border-white hover:bg-gray-700 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sales
          </Button>
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-white">
              Add Sales Transaction
            </h2>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Debtor / Date / Bill No */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="flex flex-col col-span-2">
                  <Label className="text-sm font-medium text-white mb-2">
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
                        {formData.debtor
                          ? debtors.find(
                              (d) => d.id.toString() === formData.debtor
                            )?.name
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
                        <CommandEmpty>No debtor found.</CommandEmpty>
                        <CommandGroup>
                          {debtors.map((debtor) => (
                            <CommandItem
                              key={debtor.id}
                              onSelect={() => {
                                setFormData((f) => ({
                                  ...f,
                                  debtor: debtor.id.toString(),
                                }));
                                setOpenDebtor(false);
                              }}
                              className="text-white hover:bg-slate-600"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.debtor === debtor.id.toString()
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {debtor.name}
                            </CommandItem>
                          ))}
                          <CommandItem
                            onSelect={() => {
                              setShowNewDebtorDialog(true);
                              setOpenDebtor(false);
                            }}
                            className="text-white hover:bg-slate-600"
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add a new debtor
                          </CommandItem>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col col-span-2">
                  <Label className="text-sm font-medium text-white mb-2">
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, date: e.target.value }))
                    }
                    className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <Label className="text-sm font-medium text-white mb-2">
                    Bill No.
                  </Label>
                  <Input
                    type="text"
                    value={formData.bill_no}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, bill_no: e.target.value }))
                    }
                    className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Sales lines */}
              {formData.sales.map((sale, idx) => (
                <div
                  key={idx}
                  className="bg-slate-700 text-white p-4 rounded-md shadow mb-4"
                >
                  <h3 className="text-lg font-semibold mb-4">Sale {idx + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="flex flex-col col-span-2">
                      <Label className="text-sm font-medium text-white mb-2">
                        Product
                      </Label>
                      <Popover
                        open={openProduct[idx]}
                        onOpenChange={(o) => {
                          setOpenProduct((arr) => {
                            const cp = [...arr];
                            cp[idx] = o;
                            return cp;
                          });
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openProduct[idx]}
                            className="w-full justify-between bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                          >
                            {sale.product
                              ? products.find(
                                  (p) => p.id.toString() === sale.product
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
                            <CommandEmpty>No product found.</CommandEmpty>
                            <CommandGroup>
                              {products.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  onSelect={() =>
                                    handleProductSelect(idx, p.id.toString())
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
                              <CommandItem
                                onSelect={() => handleProductSelect(idx, "new")}
                                className="text-white hover:bg-slate-600"
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add a new product
                              </CommandItem>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex flex-col">
                      <Label className="text-sm font-medium text-white mb-2">
                        Unit Price
                      </Label>
                      <Input
                        type="number"
                        name="unit_price"
                        value={sale.unit_price}
                        onChange={(e) => handleSaleChange(idx, e)}
                        className="bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <Label className="text-sm font-medium text-white mb-2">
                        Quantity
                      </Label>
                      <Input
                        type="number"
                        name="quantity"
                        value={sale.quantity}
                        onChange={(e) => handleSaleChange(idx, e)}
                        className="bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <Label className="text-sm font-medium text-white mb-2">
                        Total Price
                      </Label>
                      <Input
                        type="number"
                        name="total_price"
                        value={sale.total_price}
                        readOnly
                        className="bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    {idx > 0 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleRemoveSale(idx)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Sale
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                onClick={handleAddSale}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Another Sale
              </Button>

              {/* Subtotal / Discount / Total / Bonus / Method / Payment */}
              <div className="bg-slate-700 text-white p-4 rounded-md shadow mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-white mb-2">
                      Subtotal
                    </Label>
                    <Input
                      type="text"
                      value={subtotal.toFixed(2)}
                      readOnly
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>

                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-white mb-2">
                      Discount
                    </Label>
                    <div className="flex space-x-2">
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="bg-slate-600 border-slate-500 text-white p-2 rounded"
                      >
                        {/* <option value="amount">Amount</option> */}
                        <option value="percent">Percent</option>
                      </select>
                      <Input
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder="Value"
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-white mb-2">
                      Total Amount
                    </Label>
                    <Input
                      type="text"
                      value={totalAmount.toFixed(2)}
                      readOnly
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>

                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-white mb-2">
                      Bonus (%)
                    </Label>
                    <Input
                      type="number"
                      value={bonusPercent}
                      onChange={(e) => {
                        setBonusPercent(e.target.value);
                        setFormData((f) => ({ ...f, bonus_percent: e.target.value }));
                      }}
                      placeholder="Enter bonus %"
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>

                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-white mb-2">
                      Method
                    </Label>
                    <select
                      value={formData.method}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, method: e.target.value }))
                      }
                      className="bg-slate-600 border-slate-500 text-white p-2 rounded"
                    >
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="credit">Credit</option>
                    </select>
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
                </div>
              </div>

              {/* Cheque details if method is cheque */}
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

              {bonusSales.length > 0 && (
                <div className="bg-slate-700 text-white p-4 rounded-md shadow mb-4">
                  <h3 className="text-xl font-semibold mb-4">Bonus Items</h3>

                  {/* Header Row */}
                  <div className="grid grid-cols-2 gap-4 font-medium border-b border-slate-600 pb-2">
                    <span>Product</span>
                    <span>Quantity</span>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-slate-600">
                    {bonusSales.map((b, idx) => {
                      const name =
                        products.find((p) => p.id.toString() === b.product)
                          ?.name || "Unknown";
                      return (
                        <div key={idx} className="grid grid-cols-2 gap-4 py-2">
                          <span className="truncate">{name}</span>
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

              <Button
                type="submit"
                disabled={subLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Submit Transaction
              </Button>
            </form>

            {/* New Product Dialog */}
            <NewProductDialog
              open={showNewProductDialog}
              setOpen={setShowNewProductDialog}
              newProductData={newProductData}
              handleNewProductChange={(e) =>
                setNewProductData((d) => ({
                  ...d,
                  [e.target.name]: e.target.value,
                }))
              }
              handleNewProductBrandChange={(val) => {
                if (val === "new") setShowNewBrandDialog(true);
                else
                  setNewProductData((d) => ({
                    ...d,
                    brand: val,
                  }));
              }}
              handleAddProduct={addNewProduct}
              brands={brands}
            />

            {/* New Debtor Dialog */}
            <Dialog
              open={showNewDebtorDialog}
              onOpenChange={setShowNewDebtorDialog}
            >
              <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
                <DialogHeader>
                  <DialogTitle>Add New Debtor</DialogTitle>
                  <DialogDescription>
                    Fill in the debtor's details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="debtor_name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="debtor_name"
                      value={newDebtorData.name}
                      onChange={(e) =>
                        setNewDebtorData((d) => ({
                          ...d,
                          name: e.target.value,
                        }))
                      }
                      className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="debtor_phone" className="text-right">
                      Phone Number
                    </Label>
                    <Input
                      id="debtor_phone"
                      value={newDebtorData.phone_number}
                      onChange={(e) =>
                        setNewDebtorData((d) => ({
                          ...d,
                          phone_number: e.target.value,
                        }))
                      }
                      className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="debtor_due" className="text-right">
                      Due
                    </Label>
                    <Input
                      id="debtor_due"
                      type="number"
                      value={newDebtorData.due}
                      onChange={(e) =>
                        setNewDebtorData((d) => ({
                          ...d,
                          due: e.target.value,
                        }))
                      }
                      className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={addNewDebtor}
                  >
                    Add Debtor
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* New Brand Dialog */}
            <Dialog
              open={showNewBrandDialog}
              onOpenChange={setShowNewBrandDialog}
            >
              <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
                <DialogHeader>
                  <DialogTitle>Add New Brand</DialogTitle>
                  <DialogDescription>
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
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="col-span-3 bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter brand name"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={addNewBrand}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Add Brand
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
