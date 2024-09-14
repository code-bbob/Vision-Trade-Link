'use client'

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "../components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

// Assuming you have a custom hook for axios
import useAxios from '../utils/useAxios'
import { CommandList } from 'cmdk'

export default function VendorForm() {
  const api = useAxios()
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    due: 0,
  })
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get('inventory/brand/')
        setBrands(response.data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching brands:', error)
        setError('Failed to fetch brands')
        setLoading(false)
      }
    }

    fetchBrands()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  const handleBrandChange = (value) => {
    if (value === 'new') {
      setShowNewBrandDialog(true)
    } else {
      setFormData((prevState) => ({
        ...prevState,
        brand: value,
      }))
    }
  }

  const handleNewBrandChange = (e) => {
    setNewBrandName(e.target.value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('transaction/vendor/', formData)
      console.log('Response:', response.data)
      // Optionally clear the form or show a success message
    } catch (error) {
      console.error('Error posting data:', error)
    }
  }

  const handleAddBrand = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('inventory/brand/', { name: newBrandName })
      console.log('New Brand Added:', response.data)
      setBrands((prevBrands) => [...prevBrands, response.data])
      setFormData((prevState) => ({
        ...prevState,
        brand: response.data.id.toString(),
      }))
      setNewBrandName('')
      setShowNewBrandDialog(false)
    } catch (error) {
      console.error('Error adding brand:', error)
    }
  }

  return (
    <div className="max-w-lg mx-auto bg-gray-100 p-8 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">Add Vendor</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col">
          <Label htmlFor="name" className="text-lg font-medium text-gray-800 mb-2">
            Name
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter vendor name"
            required
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor="brand" className="text-lg font-medium text-gray-800 mb-2">
            Brand
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {formData.brand
                  ? brands.find((brand) => brand.id.toString() === formData.brand)?.name
                  : "Select brand..."}
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
                    onSelect={() => {
                      handleBrandChange(brand.id.toString())
                      setOpen(false)
                    }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          formData.brand === brand.id.toString() ? "opacity-100" : "opacity-0"
                        )}
                        />
                      {brand.name}
                    </CommandItem>
                  ))}
                  <CommandItem onSelect={() => handleBrandChange('new')}>
                    Add a new brand
                  </CommandItem>
                </CommandGroup>
                  </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col">
          <Label htmlFor="due" className="text-lg font-medium text-gray-800 mb-2">
            Due
          </Label>
          <Input
            type="number"
            id="due"
            name="due"
            value={formData.due}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter due amount"
            required
          />
        </div>

        <div>
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </div>
      </form>

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
              <Label htmlFor="newBrand" className="text-right">
                Brand Name
              </Label>
              <Input
                id="newBrand"
                value={newBrandName}
                onChange={handleNewBrandChange}
                className="col-span-3"
                placeholder="Enter new brand name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleAddBrand}>Add Brand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}