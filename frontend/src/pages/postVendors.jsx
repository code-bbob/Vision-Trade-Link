import React, { useState, useEffect } from 'react';
import useAxios from '../utils/useAxios';
import { Button } from "../components/ui/button"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"

function VendorForm() {
  const api = useAxios()
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    due: 0,
  });
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get('inventory/brand/');
        setBrands(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching brands:', error);
        setError('Failed to fetch brands');
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleBrandChange = (value) => {
    if (value === 'new') {
      setShowNewBrandDialog(true);
    } else {
      setFormData((prevState) => ({
        ...prevState,
        brand: value,
      }));
    }
  };

  const handleNewBrandChange = (e) => {
    setNewBrandName(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('transaction/vendor/', formData);
      console.log('Response:', response.data);
      // Optionally clear the form or show a success message
    } catch (error) {
      console.error('Error posting data:', error);
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('inventory/brand/', { name: newBrandName });
      console.log('New Brand Added:', response.data);
      setBrands((prevBrands) => [...prevBrands, response.data]);
      setFormData((prevState) => ({
        ...prevState,
        brand: response.data.id.toString(),
      }));
      setNewBrandName('');
      setShowNewBrandDialog(false);
    } catch (error) {
      console.error('Error adding brand:', error);
    }
  };

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
          <Select onValueChange={handleBrandChange} value={formData.brand}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a brand" />
            </SelectTrigger>
            <SelectContent>
              {!loading && brands.length > 0 ? (
                <>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">Add a new brand</SelectItem>
                </>
              ) : loading ? (
                <SelectItem value="loading">Loading...</SelectItem>
              ) : (
                <SelectItem value="no-brands">No brands available</SelectItem>
              )}
            </SelectContent>
          </Select>
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
  );
}

export default VendorForm;