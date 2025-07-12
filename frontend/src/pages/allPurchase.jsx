'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, ChevronLeft, ChevronRight, Search, Plus, ArrowLeft } from 'lucide-react'
import useAxios from '@/utils/useAxios'
import { format } from 'date-fns'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '@/components/allsidebar'
import { getBranchId } from '@/hooks/useBranchNavigate'
import { useBranchNavigate } from '@/hooks/useBranchNavigate'

export default function AllPurchaseTransactions() {
  const api = useAxios()
  const navigate = useNavigate()
  const branchNavigate = useBranchNavigate()
  const { branchId: urlBranchId } = useParams()
  const branchId = getBranchId(urlBranchId)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState()
  const [totalPages, setTotalPages] = useState()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const [metadata, setMetadata] = useState({
    next: null,
    previous: null,
    count: 0
  })

  async function fetchPaginatedData(url) {
    setLoading(true)
    try {
      const response = await api.get(url)
      setTransactions(response.data.results)
      setMetadata({
        next: response.data.next,
        previous: response.data.previous,
        count: response.data.count
      })
      
      // Calculate current page from URL or use default
      const currentPageFromUrl = url.includes('page=') 
        ? parseInt(url.split('page=')[1].split('&')[0]) 
        : 1
      
      setCurrentPage(currentPageFromUrl)
      setTotalPages(Math.ceil(response.data.count / 10)) // Assuming 10 items per page
    } catch (err) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchInitData = async () => {
    try {
      const response = await api.get("alltransaction/purchasetransaction/branch/" + branchId + "/") 
      setTransactions(response.data.results)
      console.log(response.data.results)
      setMetadata({
        next: response.data.next,
        previous: response.data.previous,
        count: response.data.count
      })
      setCurrentPage(1) // Initial page is always 1
      setTotalPages(Math.ceil(response.data.count / 10)) // Assuming 10 items per page
    } catch (err) {
      setError('Failed to fetch initial data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitData()
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.get(`alltransaction/purchasetransaction/branch/${branchId}/?search=${localSearchTerm}`)
      setTransactions(response.data.results)
      setMetadata({
        next: response.data.next,
        previous: response.data.previous,
        count: response.data.count
      })
      setTotalPages(Math.ceil(response.data.count / 10)) // Assuming 10 items per page
      setCurrentPage(1)
    } catch (err) {
      setError('Failed to search transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleDateSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.get(`alltransaction/purchasetransaction/branch/${branchId}/?start_date=${startDate}&end_date=${endDate}`)
      setTransactions(response.data.results)
      setMetadata({
        next: response.data.next,
        previous: response.data.previous,
        count: response.data.count
      })
      setTotalPages(Math.ceil(response.data.count / 10)) // Assuming 10 items per page
      setCurrentPage(1)
    } catch (err) {
      setError('Failed to filter transactions by date')
    } finally {
      setLoading(false)
    }
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
      <Sidebar className="hidden lg:block w-64 flex-shrink-0" />
      <div className="flex-grow p-4 px-8 lg:p-6 lg:ml-64">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 lg:mb-0">Purchase Transactions</h1>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full lg:w-auto px-5 text-black border-white hover:bg-gray-700 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-3" />
            Back to Dashboard
          </Button>
        </motion.div>

        <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:flex-wrap lg:items-center lg:gap-4">
          <form onSubmit={handleSearch} className="w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search transactions..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="pl-10 w-full lg:w-64 bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </form>

          <form onSubmit={handleDateSearch} className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="startDate" className="text-white whitespace-nowrap">Start:</Label>
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="endDate" className="text-white whitespace-nowrap">End:</Label>
              <Input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <Button type="submit" className="w-full lg:w-auto bg-purple-600 hover:bg-purple-700 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Search by Date
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <Card key={`${transaction.id}-${transaction.date}`} onClick={() => branchNavigate(`/purchases/editform/${transaction.id}`)} className="bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-lg lg:text-xl font-medium text-white flex flex-col lg:flex-row justify-between items-start lg:items-center">
                    <div>
                      <p>{transaction.vendor_name}</p>
                      <p className='text-sm text-gray-400'>Bill No: {transaction.bill_no}</p>
                    </div>
                    <span className="mt-2 lg:mt-0 text-sm lg:text-base">{format(new Date(transaction.date), 'dd MMM yyyy')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {transaction?.purchase.map((item, index) => (
                    <div key={`${transaction.id}-${index}`} className="mb-4 last:mb-0 p-3 lg:p-4 bg-slate-800 rounded-lg hover:bg-slate-750 transition-colors duration-300">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-2">
                        <span className="text-white font-medium mb-2 lg:mb-0">{item.product_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-slate-300">
                      <span className="text-purple-400 text-sm">Quantity: {item.quantity}</span>

                        <span className='text-blue-400'>Unit Price: RS. {item?.unit_price?.toLocaleString()}</span>
                        <span className='font-bold text-green-400 text-l'>Total Price: RS. {item.total_price.toLocaleString()}</span>

                      </div>
                    </div>
                  ))}
                  <div className="mt-4 text-right text-white font-bold">
                    Total Amount: RS. {transaction?.total_amount?.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center text-white">No transactions found.</div>
          )}
        </div>

        <div className="flex justify-center mt-6 space-x-4">
          <Button
            onClick={() => fetchPaginatedData(metadata.previous)}
            disabled={!metadata.previous}
            className="bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <div className="flex items-center space-x-2 text-white">
            <span>Page {currentPage} of {totalPages}</span>
            <span className="text-slate-400">({metadata.count} total items)</span>
          </div>
          <Button
            onClick={() => fetchPaginatedData(metadata.next)}
            disabled={!metadata.next}
            className="bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
      <Button
        className="fixed bottom-8 right-8 rounded-full w-14 h-14 lg:w-16 lg:h-16 shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
        onClick={() => branchNavigate(`/purchases/form`)}
      >
        <Plus className="w-6 h-6 lg:w-8 lg:h-8" />
      </Button>
    </div>
  )
}