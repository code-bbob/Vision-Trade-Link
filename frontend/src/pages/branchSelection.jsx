"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Building, LogOut } from 'lucide-react';
import { Input } from "@/components/ui/input";
import useAxios from '@/utils/useAxios';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setBranch, logout } from '@/redux/accessSlice';

export default function BranchSelection() {
  const api = useAxios();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('enterprise/branch/')
        setBranches(response.data)
        setFilteredBranches(response.data)
        setLoading(false)
        
        // If only one branch, auto-select it
        if (response.data?.length === 1) {
          handleBranchSelect(response.data[0]);
        }
      } catch (err) {
        console.error('Error fetching branches:', err)
        setError('Failed to load branches')
        setLoading(false)
      }
    };

    fetchBranches();
  }, []);

  useEffect(() => {
    if (branches.length > 0) {
      const results = branches.filter((branch) => 
        branch.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBranches(results);
    }
  }, [searchTerm, branches]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleBranchSelect = (branch) => {
    // Store the complete branch object in redux and localStorage
    dispatch(setBranch(branch));
    // Navigate to the main dashboard
    navigate('/');
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading branches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-red-500">
        <div className="text-center">
          <p className="mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center">
              Welcome! Select Your Branch
            </h1>
            <p className="text-slate-300 text-center mt-2">
              Choose a branch to get started with your inventory management
            </p>
          </motion.div>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-white border-white hover:bg-red-600 hover:border-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search branches..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 w-full bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.length > 0 ? (
            filteredBranches.map((branch, index) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="cursor-pointer"
                onClick={() => handleBranchSelect(branch)}
              >
                <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg overflow-hidden h-full hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center mb-4">
                      <Building className="h-8 w-8 text-purple-400 mr-3" />
                      <h2 className="text-xl font-bold text-white">{branch.name}</h2>
                    </div>
                    <div className="text-slate-300 text-sm mb-4 flex-grow">
                      <p>Branch ID: {branch.id}</p>
                      <p>Enterprise: {branch.enterprise_name}</p>
                    </div>
                    <div className="mt-auto">
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBranchSelect(branch);
                        }}
                      >
                        Select This Branch
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center text-white mt-8">
              <p className="text-lg">No branches found matching your search.</p>
              <p className="text-slate-400 mt-2">Try adjusting your search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
