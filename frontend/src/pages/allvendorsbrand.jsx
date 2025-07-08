'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, BookUser } from 'lucide-react';
import useAxios from '../utils/useAxios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import Sidebar from '../components/allsidebar';

// Import Dialog and Label components for the new vendor dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus } from 'lucide-react';

export default function AllVendorBrand() {
  const api = useAxios();
  const { branchId,id } = useParams();
  const [phones, setPhones] = useState([]);
  const [filteredPhones, setFilteredPhones] = useState([]);
  const [brandName, setBrandName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // State for New Vendor Dialog
  const [showNewVendorDialog, setShowNewVendorDialog] = useState(false);
  const [newVendorData, setNewVendorData] = useState({ name: '', due: 0, brand: id, branch: branchId });

  useEffect(() => {
    // When id changes, update newVendorData to have the correct brand id.
    setNewVendorData((prev) => ({ ...prev, brand: id }));
  }, [id]);

  useEffect(() => {
    const fetchBrandPhones = async () => {
      try {
        const response = await api.get(`alltransaction/vendorbrand/${id}/`);
        setPhones(response.data);
        setFilteredPhones(response.data);
        setBrandName(response?.data[0]?.brand_name || '');
        setLoading(false);
      } catch (err) {
        console.error('Error fetching brand phones:', err);
        setError('Failed to load ');
        setLoading(false);
      }
    };

    fetchBrandPhones();
  }, []);

  useEffect(() => {
    const results = phones.filter(phone =>
      phone.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPhones(results);
  }, [searchTerm, phones]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle changes in the vendor dialog input fields
  const handleNewVendorChange = (e) => {
    const { name, value } = e.target;
    setNewVendorData((prev) => ({ ...prev, [name]: value }));
  };

  // When adding a new vendor, post the data to the API.
  const handleAddVendor = async (e) => {
    e.preventDefault();
    try {
      // Post the new vendor data. The brand is set automatically.
      const response = await api.post("alltransaction/vendor/", newVendorData);
      // Add the new vendor to the list
      setPhones((prev) => [...prev, response.data]);
      setFilteredPhones((prev) => [...prev, response.data]);
      // Reset and close the dialog
      setNewVendorData({ name: '', due: 0, brand: id, branch: branchId });
      setShowNewVendorDialog(false);
    } catch (err) {
      console.error("Error adding vendor:", err);
      setError("Failed to add new vendor");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-red-500">
        {error}
      </div>
    );
  }
  filteredPhones.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col md:flex-row">
      <Sidebar className="w-full lg:w-64 md:min-h-screen" />
      <div className="w-full lg:ml-64 p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0"
        >
          <h1 className="text-2xl md:text-4xl font-bold text-white">{brandName} Vendors</h1>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 w-full bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <Button
              onClick={() => navigate('/vendors')}
              variant="outline"
              className="w-full sm:w-auto px-5 text-slate-900 border-white hover:bg-gray-500 hover:text-slate-900"
            >
              <ArrowLeft className="mr-2 h-4 w-3" />
              Back to Brands
            </Button>
          </div>
        </motion.div>

        <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg">
          <CardContent className="p-0">
            <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-slate-300 border-b border-slate-700">
              <div className="col-span-6 md:col-span-9">Vendors</div>
              <div className="col-span-6 md:col-span-3 text-right">Due Amount</div>
            </div>
            {filteredPhones?.map((phone) => (
              <motion.div
                key={phone.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800 transition-colors duration-200"
              >
                <div className="col-span-6 md:col-span-9 flex items-center">
                  <BookUser className="h-5 w-5 text-purple-400 mr-2 flex-shrink-0" />
                  <span className="text-white truncate">{phone.name}</span>
                </div>
                
                <div className="col-span-6 md:col-span-3 text-right text-white">
                  {phone.due ? `RS. ${phone.due.toLocaleString()}` : 'N/A'}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {filteredPhones.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center text-white mt-8"
          >
            No products found matching your search.
          </motion.div>
        )}
      </div>
      {/* Floating button now opens the New Vendor Dialog */}
      <Button
        onClick={() => setShowNewVendorDialog(true)}
        className="fixed bottom-8 right-8 rounded-full w-14 h-14 lg:w-16 lg:h-16 shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
      >
        <Plus className="w-6 h-6 lg:w-8 lg:h-8" />
      </Button>

      {/* New Vendor Dialog */}
      <Dialog open={showNewVendorDialog} onOpenChange={setShowNewVendorDialog}>
        <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
            <DialogDescription className="text-slate-300">
              Enter details for the new vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vendorName" className="text-right text-white">Name</Label>
              <Input
                id="vendorName"
                name="name"
                value={newVendorData.name}
                onChange={handleNewVendorChange}
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
                placeholder="Enter vendor name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vendorDue" className="text-right text-white">Due</Label>
              <Input
                id="vendorDue"
                name="due"
                type="number"
                value={newVendorData.due}
                onChange={handleNewVendorChange}
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
                placeholder="Enter due amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleAddVendor}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Add Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
