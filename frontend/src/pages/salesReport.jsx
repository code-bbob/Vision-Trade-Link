"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Printer, 
  Download, 
  ChevronDown, 
  Search, 
  Calendar, 
  ArrowLeft, 
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  RefreshCw
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import useAxios from "@/utils/useAxios"
import { useNavigate } from "react-router-dom"
import { useParams } from "react-router-dom"
import jsPDF from "jspdf"
import "jspdf-autotable"

const SalesReport = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchPhone, setSearchPhone] = useState("")
  const [includeReturns, setIncludeReturns] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const api = useAxios()
  const navigate = useNavigate()
  const {branchId} = useParams()

  useEffect(() => {
    fetchSalesData()
  }, [includeReturns])

  const fetchSalesData = async (params = {}) => {
    setLoading(true)
    try {
      const queryParams = {
        ...params,
        include_returns: includeReturns
      }
      const queryString = new URLSearchParams(queryParams).toString()
      const response = await api.get(`transaction/sales-report/branch/${branchId}/?${queryString}`)
      const salesData = {
        sales: response.data.slice(0, -1),
        ...response.data[response.data.length - 1],
      }
      setData(salesData)
    } catch (err) {
      setError("Failed to fetch sales data")
      console.error("Error fetching sales data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    const params = {}
    if (searchTerm) params.search = searchTerm
    if (searchPhone) params.phone = searchPhone
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    fetchSalesData(params)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSearchPhone("")
    setStartDate("")
    setEndDate("")
    fetchSalesData()
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadCSV = () => {
    if (!data || !data.sales.length) {
      console.warn("No data available for CSV export")
      return
    }
  
    let csvContent = "Type,Date,Customer,Phone,Brand,Product,IMEI,Quantity,Unit Price,Total Price,Profit,Method,Bill No\n"
  
    data.sales.forEach((item) => {
      const row = `${item.type || 'sale'},${item.date},${item.customer_name},${item.phone},${item.brand},${item.product},${item.imei_number},${item.quantity},${item.unit_price},${item.total_price},${item.profit},${item.method},${item.bill_no}`
      csvContent += row + "\n"
    })
  
    // Add summary
    csvContent += `\nSummary:\n`
    csvContent += `Total Sales: ,,,,,,,,,${data.total_sales}\n`
    csvContent += `Total Returns: ,,,,,,,,,${data.total_returns || 0}\n`
    csvContent += `Net Sales: ,,,,,,,,,${data.net_sales}\n`
    csvContent += `Total Profit: ,,,,,,,,,${data.total_profit}\n`
    csvContent += `Cash Sales: ,,,,,,,,,${data.cash_sales}\n`
    csvContent += `Total Items: ,,,,,,,,,${data.count}\n`
  
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Sales_Report_${format(new Date(), "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadPDF = () => {
    if (!data || !data.sales.length) {
      console.warn("No data available for PDF export")
      return
    }
  
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text("Sales Report", 14, 20)
    doc.setFontSize(12)
    doc.text(`Generated on: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`, 14, 30)
    doc.text(`Include Returns: ${includeReturns ? 'Yes' : 'No'}`, 14, 38)
  
    // Table Headers
    const headers = [["Type", "Date", "Customer", "Phone", "Brand", "Product", "Qty", "Price", "Total", "Profit"]]
  
    // Table Data
    const tableData = data.sales.map((item) => [
      item.type || 'Sale',
      item.date,
      item.customer_name,
      item.phone,
      item.brand,
      item.product,
      item.quantity,
      `$${item.unit_price}`,
      `$${item.total_price}`,
      `$${item.profit}`
    ])
  
    doc.autoTable({
      head: headers,
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    })
  
    // Summary
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(14)
    doc.text("Summary", 14, finalY)
    doc.setFontSize(10)
    doc.text(`Total Sales: $${data.total_sales}`, 14, finalY + 10)
    doc.text(`Total Returns: $${data.total_returns || 0}`, 14, finalY + 18)
    doc.text(`Net Sales: $${data.net_sales}`, 14, finalY + 26)
    doc.text(`Total Profit: $${data.total_profit}`, 14, finalY + 34)
    doc.text(`Total Items: ${data.count}`, 14, finalY + 42)
  
    doc.save(`Sales_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`)
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading sales data...</p>
        </div>
      </div>
    )
  
  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchSalesData()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  
  if (!data) return null

  const summaryCards = [
    {
      title: "Total Sales",
      value: data.total_sales,
      icon: DollarSign,
      color: "bg-green-500",
      change: "+12%"
    },
    {
      title: "Total Items",
      value: data.count,
      icon: ShoppingCart,
      color: "bg-blue-500",
      change: "+8%"
    },
    {
      title: "Total Profit",
      value: data.total_profit,
      icon: TrendingUp,
      color: "bg-purple-500",
      change: "+15%"
    },
    {
      title: "Returns",
      value: data.total_returns || 0,
      icon: TrendingDown,
      color: "bg-red-500",
      change: "-5%"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:px-8 print:bg-white print:p-0">
      {/* Header */}
      <div className="mb-6 print:hidden">
        <Button
          onClick={() => navigate("/mobile/")}
          variant="ghost"
          className="mb-4 hover:bg-blue-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Report</h1>
            <p className="text-gray-600 mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <div className="flex items-center space-x-2">
              <Switch
                id="include-returns"
                checked={includeReturns}
                onCheckedChange={setIncludeReturns}
              />
              <Label htmlFor="include-returns" className="text-sm font-medium">
                Include Returns
              </Label>
            </div>
            
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:hidden">
        {summaryCards.map((card, index) => (
          <Card key={index} className="relative overflow-hidden border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.title.includes("Sales") || card.title.includes("Profit") || card.title.includes("Returns") 
                      ? `NPR ${card.value?.toLocaleString() || 0}` 
                      : card.value?.toLocaleString() || 0}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-full`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6 print:hidden shadow-lg border-none">
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search-brand">Search Brand</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="search-brand"
                      type="text"
                      placeholder="Enter brand name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-phone">Search Phone</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="search-phone"
                      type="text"
                      placeholder="Enter phone number..."
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Search className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
                <Button type="button" onClick={clearFilters} variant="outline">
                  Clear All
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="bg-white hover:bg-gray-50">
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white hover:bg-gray-50">
              <Download className="mr-2 h-4 w-4" />
              Export
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleDownloadPDF}>
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadCSV}>
              Export as CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sales Table */}
      <Card className="shadow-lg border-none print:shadow-none">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white print:bg-white print:text-black">
          <CardTitle className="text-xl">
            Sales Transactions ({data.sales.length} {includeReturns ? 'transactions' : 'sales'})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 print:bg-white">
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Brand</TableHead>
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">IMEI</TableHead>
                  <TableHead className="font-semibold text-right">Qty</TableHead>
                  <TableHead className="font-semibold text-right">Unit Price</TableHead>
                  <TableHead className="font-semibold text-right">Total</TableHead>
                  <TableHead className="font-semibold text-right">Profit</TableHead>
                  <TableHead className="font-semibold">Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sales.map((item, index) => (
                  <TableRow key={index} className="hover:bg-gray-50 print:hover:bg-transparent">
                    <TableCell>
                      <Badge 
                        variant={item.type === 'return' ? 'destructive' : 'default'}
                        className={item.type === 'return' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                      >
                        {item.type === 'return' ? 'Return' : 'Sale'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.date}</TableCell>
                    <TableCell>{item.customer_name}</TableCell>
                    <TableCell>{item.phone}</TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={item.product}>
                      {item.product}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.imei_number}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      NPR {item.unit_price?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      NPR {item.total_price?.toLocaleString()}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      NPR {item.profit?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.method}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="mt-6 shadow-lg border-none print:shadow-none">
        <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white print:bg-white print:text-black">
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal Sales:</span>
                <span>NPR {data?.subtotal_sales?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Discount:</span>
                <span>NPR {data?.total_discount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Sales:</span>
                <span>NPR {data?.total_sales?.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Total Returns:</span>
                <span className="text-red-600">NPR {data?.total_returns?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Net Sales:</span>
                <span className="font-bold">NPR {data?.net_sales?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Cash Sales:</span>
                <span>NPR {data?.cash_sales?.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Total Profit:</span>
                <span className={`font-bold ${data?.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  NPR {data?.total_profit?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Transactions:</span>
                <span>{data.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Sales Count:</span>
                <span>{data.sales_count || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-gray-500 print:text-gray-600">
        <p>This report was generated automatically and includes {includeReturns ? 'both sales and returns' : 'sales only'}.</p>
      </div>
    </div>
  )
}

export default SalesReport

