'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Calendar, ChevronLeft, ChevronRight, Search, Plus } from 'lucide-react'
import useAxios from '../utils/useAxios'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom';

export default function PurchaseTransactions() {
const api = useAxios()
const [transactions, setTransactions] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
const [currentPage, setCurrentPage] = useState(1)
const [totalPages, setTotalPages] = useState(1)
const [startDate, setStartDate] = useState('')
const [endDate, setEndDate] = useState('')
const [localSearchTerm, setLocalSearchTerm] = useState('')
const [metadata, setMetadata] = useState({
    next: null,
    previous: null,
    count: 0
})

const navigate = useNavigate()

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
    setTotalPages(Math.ceil(response.data.count / 10)) // Assuming 10 items per page
    } catch (err) {
    setError('Failed to fetch data')
    } finally {
    setLoading(false)
    }
}

const fetchInitData = async () => {
    try {
    const response = await api.get("transaction/purchasetransaction/")
    setTransactions(response.data.results)
    setMetadata({
        next: response.data.next,
        previous: response.data.previous,
        count: response.data.count
    })
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
    const response = await api.get(`transaction/purchasetransaction/?search=${localSearchTerm}`)
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
    const response = await api.get(`transaction/purchasetransaction/?start_date=${startDate}&end_date=${endDate}`)
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

useEffect(() => {
    console.log('Transactions updated:', transactions)
}, [transactions])

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

        {transactions.length > 0 ? (
        transactions.map((transaction) => (
            <Card key={`${transaction.id}-${transaction.date}`} className="mb-6 bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg">
            <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-xl font-medium text-white flex justify-between items-center">
                <span>{transaction.vendor_name}</span>
                <span>{format(new Date(transaction.date), 'dd MMM yyyy')}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                {transaction.purchase.map((item, index) => (
                <div key={`${transaction.id}-${index}`} className="mb-4 last:mb-0 p-4 bg-slate-800 rounded-lg">
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
        ))
        ) : (
        <div className="text-center text-white">No transactions found.</div>
        )}

        <div className="flex justify-center mt-6 space-x-4">
        <Button
            onClick={() => fetchPaginatedData(metadata.previous)}
            disabled={!metadata.previous}
            className="bg-slate-700 hover:bg-slate-600 text-white"
        >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
        </Button>
        <span className="text-white self-center">Page {currentPage} of {totalPages}</span>
        <Button
            onClick={() => fetchPaginatedData(metadata.next)}
            disabled={!metadata.next}
            className="bg-slate-700 hover:bg-slate-600 text-white"
        >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
        </div>
    </div>
    <Button
              className="fixed bottom-8 right-8 rounded-full w-16 h-16 shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => navigate('/purchases/form/')}
            >
              <Plus className="w-8 h-8" />
            </Button>
    </div>
)
}