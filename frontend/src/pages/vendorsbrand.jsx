'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Search, ArrowLeft, BookUser } from 'lucide-react'
import useAxios from '../utils/useAxios'
import { useParams } from 'react-router-dom'
import { Button } from "../components/ui/button"
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/sidebar';



export default function VendorBrand() {
  const api = useAxios()
  const id  = useParams()
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
        const response = await api.get(`transaction/vendorbrand/${id.id}/`)
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

  console.log(phones)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex">
        <Sidebar />
      <div className="max-w-4xl ml-72 mt-10 ">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='flex '
        >
          <h1 className="text-4xl font-bold mb-8 mx-5 text-white">{brandName} Vendors</h1>
          <div className="relative w-60 mb-6 mx-5 ">
            <Search className="absolute left-3 top-5 transform  -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 w-full bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <Button
                onClick={() => navigate('/inventory')}
                variant="outline"
                className="w-full sm:w-auto px-5 text-slate-900 border-white hover:bg-gray-500 mx-9 hover:text-slate-900"
              >
                <ArrowLeft className="mr-2 h-4 w-3" />
                Back to Inventory
              </Button>
        </motion.div>

        

        <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg">
          {/* <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-xl font-medium text-white">Phone List</CardTitle>
          </CardHeader> */}
          <CardContent className="p-0">
            <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-slate-300 border-b border-slate-700">
              <div className="col-span-6">Vendors</div>
              <div className="col-span-3 text-right">Due Amount</div>
            </div>
            {filteredPhones?.map((phone) => (
              <motion.div
                key={phone.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                onClick={()=>navigate(`/phone/${phone.id}`)}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800 transition-colors duration-200"
              >
                <div className="col-span-6 flex items-center">
                  <BookUser className="h-5 w-5 text-purple-400 mr-2" />
                  <span className="text-white">{phone.name}</span>
                </div>
                
                <div className="col-span-3 text-right text-white">
                  {phone.due ? `RS. ${phone?.due.toLocaleString()}` : 'N/A'}
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