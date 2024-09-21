'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Smartphone, Search, ArrowLeft } from 'lucide-react'
import useAxios from '../utils/useAxios'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import Sidebar from '../components/sidebar';

export default function BrandPhones() {
  const api = useAxios()
  const { id } = useParams()
  const [phones, setPhones] = useState([])
  const [filteredPhones, setFilteredPhones] = useState([])
  const [brandName, setBrandName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchBrandPhones = async () => {
      try {
        const response = await api.get(`inventory/brand/?id=${id}`)
        setPhones(response.data)
        setFilteredPhones(response.data)
        setBrandName(response.data[0].brand_name)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching brand phones:', err)
        setError('Failed to load brand phones')
        setLoading(false)
      }
    }

    fetchBrandPhones()
  }, [id])

  useEffect(() => {
    const results = phones.filter(phone =>
      phone.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredPhones(results)
  }, [searchTerm, phones])

  const handleSearch = (event) => {
    setSearchTerm(event.target.value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-10 lg:ml-64">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col space-y-4 mb-8"
        >
          <h1 className="text-2xl lg:text-4xl text-center font-bold text-white">{brandName} Phones</h1>
          <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search phones..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 w-full bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <Button
              onClick={() => navigate('/inventory')}
              variant="outline"
              className="w-full sm:w-auto px-5 text-black border-white hover:bg-gray-700 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-3" />
              Back to Inventory
            </Button>
          </div>
        </motion.div>

        <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg">
          <CardContent className="p-0">
            <div className="grid grid-cols-12 gap-2 p-4 text-sm font-medium text-slate-300 border-b border-slate-700">
              <div className="col-span-6 lg:col-span-6">Particulars</div>
              <div className="col-span-3 lg:col-span-3 text-center">Quantity</div>
              <div className="col-span-3 lg:col-span-3 text-right">Unit Price</div>
            </div>
            {filteredPhones?.map((phone) => (
              <motion.div
                key={phone.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                onClick={() => navigate(`/phone/${phone.id}`)}
                className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-slate-800 transition-colors duration-200 cursor-pointer"
              >
                <div className="col-span-6 lg:col-span-6 flex items-center">
                  <Smartphone className="h-4 w-4 lg:h-5 lg:w-5 text-purple-400 mr-2 flex-shrink-0" />
                  <span className="text-white text-sm lg:text-base truncate">{phone.name}</span>
                </div>
                <div className={`col-span-3 lg:col-span-3 text-center ${phone.quantity < 3 ? 'text-red-500' : 'text-green-500'} text-sm lg:text-base`}>
                  {phone.quantity}
                </div>
                <div className="col-span-3 lg:col-span-3 text-right text-white text-sm lg:text-base">
                  {phone.unit_price ? `RS. ${phone.unit_price.toLocaleString()}` : 'N/A'}
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
            No phones found matching your search.
          </motion.div>
        )}
      </div>
    </div>
  )
}