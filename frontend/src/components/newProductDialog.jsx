"use client";

import React from "react";
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
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, PlusCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NewProductDialog = ({
  open,
  setOpen,
  newProductData,
  handleNewProductChange,
  handleNewProductBrandChange,
  handleAddProduct,
  brands,
  openBrand,
  setOpenBrand,
  branches,
  userBranch,
  selectedBranch
}) => {
  console.log("Brands:", brands);
  console.log("new product dialog:", newProductData);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription className="text-slate-300">
            Enter the details of the new product you want to add.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Product Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newProductName" className="text-right text-white">
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
          {/* Cost Price */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newProductCostPrice" className="text-right text-white">
              Cost Price
            </Label>
            <Input
              id="newProductCostPrice"
              name="cost_price"
              value={newProductData.cost_price}
              onChange={handleNewProductChange}
              className="col-span-3 bg-slate-700 border-slate-600 text-white"
              placeholder="Enter cost price"
            />
          </div>
          {/* Selling Price */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newProductSellingPrice" className="text-right text-white">
              Selling Price
            </Label>
            <Input
              id="newProductSellingPrice"
              name="selling_price"
              value={newProductData.selling_price}
              onChange={handleNewProductChange}
              className="col-span-3 bg-slate-700 border-slate-600 text-white"
              placeholder="Enter selling price"
            />
          </div>
          {/* Brand Select */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newProductBrand" className="text-right text-white">
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
                          (brand) => brand.id.toString() === newProductData.brand
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
                        {brands
      .map((brand) => (
                          <CommandItem
                            key={brand.id}
                            onSelect={() =>
                              handleNewProductBrandChange(brand.id.toString())
                            }
                            className="text-white hover:bg-slate-600"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                newProductData.brand === brand.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {brand.name}
                          </CommandItem>
                        ))}
                        <CommandItem
                          onSelect={() => handleNewProductBrandChange("new")}
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
          {/* Branch Select */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newProductBranch" className="text-right text-white">
              Branch
            </Label>
            <div className="col-span-3">
              <Select
                onValueChange={(value) =>
                  handleNewProductChange({ target: { name: "branch", value } })
                }
                value={newProductData.branch}
              >
                <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {userBranch && Object.keys(userBranch).length > 0 ? (
                    <SelectItem value={userBranch.id.toString()} className="text-white">
                      {userBranch.name}
                    </SelectItem>
                  ) : (
                    
                      <SelectItem value={branches?.id?.toString()} className="text-white">
                        {branches?.name}
                      </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleAddProduct}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Add Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewProductDialog;
