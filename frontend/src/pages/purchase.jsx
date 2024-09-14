'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from ".ui/button"
import { Input } from ".ui/input"
import { Label } from ".ui/label"
import { Calendar, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import useAxios from '../utils/useAxios'
import { format } from 'date-fns'

export default function PurchaseTransactions() {
  const api = useAxios()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [localSearchTerm, setLocalSearchTerm] = useState('')

  const fetchTransactions = async (page, search, start, end) => {
    try {
      setLoading(true)
      let url = `transaction/purchasetransaction/?page=${page}`
      if (search) url += `&search=${search}`
      if (start) url += `&start_date=${start}`
      if (end) url += `&end_date=${end}`
      
      const response = await api.get(url)
      setTransactions(response.data.results)
      setTotalPages(Math.ceil(response.data.count / 10)) // Assuming 10 items per page
      setLoading(false)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError('Failed to load transactions')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions(currentPage, searchTerm, startDate, endDate)
  }, [currentPage, searchTerm, startDate, endDate])

  const handleSearch = () => {
    e.preventDefault()
    setSearchTerm(localSearchTerm)
    setCurrentPage(1)
  }

  const handleDateSearch = () => {
    e.preventDefault()
    fetchTransactions(1, searchTerm, startDate, endDate)
    setCurrentPage(1)
  }

  const filteredTransactions = transactions.filter(transaction =>
    transaction.vendor_name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
    transaction.purchase.some(p => p.phone_name.toLowerCase().includes(localSearchTerm.toLowerCase()))
  )

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      Loading...
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-red-500">
      {error}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-8 text-white">Purchase Transactions</h1>
        </motion.div>

        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <form onSubmit={handleSearch} className="w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search transactions..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
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

        {filteredTransactions.map((transaction) => (
          <Card key={`${transaction.date}-${transaction.vendor}`} className="mb-6 bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-xl font-medium text-white flex justify-between items-center">
                <span>{transaction.vendor_name}</span>
                <span>{format(new Date(transaction.date), 'dd MMM yyyy')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {transaction.purchase.map((item, index) => (
                <div key={index} className="mb-4 last:mb-0 p-4 bg-slate-800 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium">{item.phone_name}</span>
                    <span className="text-purple-400">IMEI: {item.imei_number}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-300">
                    <span>Unit Price: RS. {item.unit_price.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div className="mt-4 text-right text-white font-bold">
                Total Amount: RS. {transaction.total_amount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-center mt-6 space-x-4">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <span className="text-white self-center">Page {currentPage} of {totalPages}</span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}