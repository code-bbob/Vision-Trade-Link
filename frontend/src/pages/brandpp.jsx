'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Switch } from "../components/ui/switch"
import { Calendar, ChevronLeft, ChevronRight, Search, Plus, ArrowLeft } from 'lucide-react'
import useAxios from '../utils/useAxios'
import { format } from 'date-fns'
import Sidebar from '../components/sidebar'

export default function BrandPPPage() {
  const api = useAxios()
const navigate = useNavigate();
const id = useParams();
  const [pps, setPps] = useState([])
  const [filteredPps, setFilteredPps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showExpired, setShowExpired] = useState(false)

  useEffect(() => {
    const fetchPps = async () => {
      if (!id.id) return
      setLoading(true)
      try {
        const response = await api.get(`transaction/pp/brand/${id.id}/`)
        setPps(response.data)
        const filtered = response.data.filter(scheme => !showExpired ? scheme.status === 'active' : scheme.status === 'expired')
        setFilteredPps(filtered)
        // setFilteredSchemes(response.data)
      } catch (err) {
        console.error('Error fetching price-protections:', err)
        setError('Failed to load price-protections')
      } finally {
        setLoading(false)
      }
    }

    fetchPps()
  }, [id.id])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!id.id) return
    setLoading(true)
    try {
      const response = await api.get(`transaction/pp/brand/${id.id}/?search=${searchTerm}`)
      setFilteredPps(response.data)
    } catch (err) {
      console.error('Error searching price-protections:', err)
      setError('Failed to search price-protections')
    } finally {
      setLoading(false)
    }
  }

  const handleDateSearch = async (e) => {
    e.preventDefault()
    if (!id.id) return
    setLoading(true)
    try {
      const response = await api.get(`transaction/pp/brand/${id.id}/?start_date=${startDate}&end_date=${endDate}`)
      setFilteredPps(response.data)
    } catch (err) {
      console.error('Error filtering schemes by date:', err)
      setError('Failed to filter schemes by date')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleExpired = () => {
    setShowExpired(!showExpired)
    const filtered = pps.filter(pp => showExpired ? pp.status === 'active' : pp.status === 'expired')
    setFilteredPps(filtered)
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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar />
      <div className="max-w-6xl ml-64 p-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between pb-8"
        >
          <h1 className="text-4xl font-bold mb-8 text-white">Brand Price Protections</h1>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full sm:w-auto px-5 text-slate-900 border-white hover:bg-gray-500 mx-9 hover:text-slate-900"
          >
            <ArrowLeft className="mr-2 h-4 w-3" />
            Back to Price Protection
          </Button>
        </motion.div>

        <div className="flex justify-between pb-5 space-x-2">
            <div></div>
            <div>
            <Label htmlFor="show-expired" className="text-white px-2">
              {showExpired ? 'Show Active' : 'Show Expired'}
            </Label>
            <Switch
              id="show-expired"
              checked={showExpired}
              onCheckedChange={handleToggleExpired}
            />
            </div>
          </div>

        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <form onSubmit={handleSearch} className="w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search price-protections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-64 bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </form>

          <form onSubmit={handleDateSearch} className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="startDate" className="text-white">Start Date:</Label>
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="endDate" className="text-white">End Date:</Label>
              <Input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Search by Date
            </Button>
          </form>

          
        </div>
        

        {filteredPps.length > 0 ? (
          filteredPps.map((pp) => (
            <Card key={pp.id} onClick={()=> navigate(`/price-protection/${pp.id}`)} className="mb-6 bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-xl font-medium text-white flex justify-between items-center">
                  <span>{pp.phone_name}</span>
                  <span>{format(new Date(pp.from_date), 'dd MMM yyyy')} - {format(new Date(pp.to_date), 'dd MMM yyyy')}</span>
                  <span className={`text-sm px-2 py-1 rounded ${pp.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {pp.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="mb-4 text-white">
                
                </div>
                {/* <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Subschemes</h3>
                  {scheme.subscheme.map((sub, index) => (
                    <div key={index} className="mb-2 last:mb-0 p-2 bg-slate-700 text-center justify-center  rounded">
                      <p className="text-white">Range: {sub.lowerbound} - {sub.upperbound}</p>
                      <p className="text-purple-400">Cashback: RS. {sub.cashback}</p>
                    </div>
                  ))}
                </div> */}
              </CardContent>
              <CardFooter className='text-white pb-3 flex justify-between px-3'>
              <span className='text-blue-400'>Sold: {pp.sold}</span>
              <span className='text-green-400'>Receivable: RS. {pp.receivable}</span>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="text-center text-white">No price protections found.</div>
        )}
      </div>
      <Button
        className="fixed bottom-8 right-8 rounded-full w-16 h-16 shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
        onClick={() => navigate('/price-protection/new')}
      >
        <Plus className="w-8 h-8" />
      </Button>
    </div>
  )
}