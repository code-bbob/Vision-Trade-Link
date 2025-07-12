"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowLeft,
} from "lucide-react";
import useAxios from "@/utils/useAxios";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/allsidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useParams } from "react-router-dom";

export default function AllSalesReturns() {
  const api = useAxios();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const { branchId } = useParams();
  const [metadata, setMetadata] = useState({
    next: null,
    previous: null,
    count: 0,
  });

  const navigate = useNavigate();

  async function fetchPaginatedData(url) {
    setLoading(true);
    try {
      const response = await api.get(url);
      setReturns(response.data.results);
      setMetadata({
        next: response.data.next,
        previous: response.data.previous,
        count: response.data.count,
      });
      
      // Calculate current page from URL or use default
      const currentPageFromUrl = url.includes('page=') 
        ? parseInt(url.split('page=')[1].split('&')[0]) 
        : 1
      
      setCurrentPage(currentPageFromUrl);
      setTotalPages(Math.ceil(response.data.count / 10)); // Assuming 10 items per page
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }

  const fetchInitData = async () => {
    try {
      const response = await api.get(
        "alltransaction/sales-return/branch/" + branchId + "/"
      );
      setReturns(response.data.results);
      setMetadata({
        next: response.data.next,
        previous: response.data.previous,
        count: response.data.count,
      });
      setCurrentPage(1); // Initial page is always 1
      setTotalPages(Math.ceil(response.data.count / 10)); // Assuming 10 items per page
    } catch (err) {
      setError("Failed to fetch initial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitData();
  }, []); // Added api to dependencies

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.get(
        `alltransaction/sales-return/branch/${branchId}/?search=${localSearchTerm}`
      );
      setReturns(response.data.results);
      setMetadata({
        next: response.data.next,
        previous: response.data.previous,
        count: response.data.length,
      });
      setTotalPages(response.data.total_pages); // Assuming 10 items per page
      setCurrentPage(response.data.page);
    } catch (err) {
      setError("Failed to search sales returns");
    } finally {
      setLoading(false);
    }
  };

  const handleDateSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.get(
        `alltransaction/sales-return/branch/${branchId}/?start_date=${startDate}&end_date=${endDate}`
      );
      setReturns(response.data.results);
      setMetadata({
        next: response.data.next,
        previous: response.data.previous,
        count: response.data.count,
      });
      setTotalPages(response.data.total_pages); // Assuming 10 items per page
      setCurrentPage(response.data.page);
    } catch (err) {
      setError("Failed to filter sales returns by date");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`alltransaction/sales-return/${id}/`);
      fetchInitData();
    } catch (err) {
      setError("Failed to delete sales return");
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
  console.log(returns[0])

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
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 lg:mb-0">
            Sales Returns
          </h1>
          <Button
            onClick={() => navigate("/")}
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
                placeholder="Search Sales returns..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="pl-10 w-full lg:w-64 bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </form>

          <form
            onSubmit={handleDateSearch}
            className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4"
          >
            <div className="flex items-center space-x-2">
              <Label
                htmlFor="startDate"
                className="text-white whitespace-nowrap"
              >
                Start:
              </Label>
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="endDate" className="text-white whitespace-nowrap">
                End:
              </Label>
              <Input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full lg:w-auto bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Search by Date
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          {returns.length > 0 ? (
            returns.map((returnItem) => (
              <Card
                key={returnItem.id}
                className="bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-lg lg:text-xl font-medium text-white flex flex-col lg:flex-row justify-between items-start lg:items-center">
                    <div>
                      <p>{returnItem.sales_transaction.name}</p>
                      <p className="text-sm text-gray-400">
                        Bill No: {returnItem.sales_transaction.bill_no}
                      </p>
                    </div>
                    <span className="mt-2 lg:mt-0 text-sm lg:text-base">
                      Return Date:{" "}
                      {format(new Date(returnItem.date), "dd MMM yyyy")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4">
                    <p
                      className="text-blue-500 hover:text-blue-800"
                      onClick={() => {
                        navigate(
                          `/sales/branch/${branchId}/editform/${returnItem.sales_transaction.id}`
                        );
                      }}
                    >
                      Original Transaction: {returnItem.sales_transaction.id}
                    </p>
                    <div className="flex justify-between items-center text-sm mt-1 text-slate-300">
                      <p className="text-white">
                        Original Sales Date:{" "}
                        {format(
                          new Date(returnItem.sales_transaction.date),
                          "dd MMM yyyy"
                        )}
                      </p>
                      <p className="text-white">
                        Payment Method: {returnItem.sales_transaction.method}
                      </p>
                    </div>
                  </div>
                  {returnItem.returned_sales.length > 0 ? (
                    returnItem.returned_sales.map((sale, index) => (
                      <div
                        key={index}
                        className="mb-4 last:mb-0 p-3 lg:p-4 bg-slate-800 rounded-lg hover:bg-slate-750 transition-colors duration-300"
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-2">
                          <span className="text-white font-medium mb-2 lg:mb-0">
                            {sale.product_name}
                          </span>
                          <span className="text-purple-400 text-sm">
                            Quantity: {sale.quantity}
                          </span>
                        </div>
                        {/* <div className="flex justify-between items-center text-sm text-slate-300">
                          <span>
                            Unit Price: RS. {sale.unit_price.toLocaleString()}
                          </span>
                        </div> */}
                      </div>
                    ))
                  ) : (
                    <p className="text-white text-center">
                      No specific sales returned for this transaction.
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Dialog>
                      <DialogTrigger asChild>
                          <Button className="bg-red-600 m-2">Delete</Button>
                      </DialogTrigger>
                      <DialogContent>
                        Are you absolutely sure you wanna delete this return?
                    This action is permanent and cannot be undone.
                        <Button
                          className="bg-red-600 m-2"
                          onClick={() => {
                            handleDelete(returnItem.id);
                          }}
                        >
                          Delete
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center text-white">
              No sales returns found.
            </div>
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
    </div>
  );
}
