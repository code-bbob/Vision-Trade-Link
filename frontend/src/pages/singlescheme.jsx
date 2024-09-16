'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { ArrowRight, ArrowLeft } from 'lucide-react';
import useAxios from '../utils/useAxios';
import Sidebar from '../components/sidebar';
import { useNavigate, useParams } from 'react-router-dom';

export default function SingleScheme() {
    const api = useAxios();
    const [data, setData] = useState([]);
    const [phone, setPhone] = useState();
    const [receivable, setReceivable] = useState();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExpired, setIsExpired] = useState();
    const navigate = useNavigate();
    const id = useParams();

    async function fetchData() {
        setLoading(true);
        try {
            const response = await api.get(`transaction/singlescheme/${id.id}/`);
            setData(response.data.list);
            setPhone(response.data.phone);
            setReceivable(response.data.receivables);
            setIsExpired(response.data.status==='expired'?true:false);  // Status is 'expired' or 'active'
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }

    // Function to toggle status and send PATCH request
    async function handleStatusChange() {
        const newStatus = isExpired ? 'active' : 'expired';
        try {
            const response = await api.patch(`transaction/scheme/${id.id}/`, { status: newStatus });
            setIsExpired(newStatus === 'expired');  // Update status locally after successful patch
        } catch (error) {
            console.error('Failed to update status');
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            <Sidebar />
            <div className='flex justify-between'>
            <div></div>
            <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="w-full sm:w-auto px-5 text-slate-900 border-white hover:bg-gray-500 mx-9 ml-80 mt-3 hover:text-slate-900 items-right"
                >
                <ArrowLeft className="mr-2 h-4 w-3" />
                Back to Brand Schemes
              </Button>
                  </div>

            
            <div className="max-w-6xl mx-96 p-6">
                <Card className="mb-6 w-96 bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg">
                    <CardHeader className="border-b border-slate-700">
                        <CardTitle className="text-xl font-medium text-white flex justify-between items-center">
                            <span>{phone} Scheme</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {data?.length > 0 ? (
                            data.map((da) => (
                                <h1 className="text-center text-white mb-2 font-bold">
                                    <ArrowRight className="" />{da}
                                </h1>
                            ))
                        ) : (
                            <div className="text-center text-white">No items found.</div>
                        )}
                    </CardContent>
                    <CardFooter className="justify-between">
                        <div className="pt-3 text-right text-green-300">
                            Receivable: RS. {receivable}
                        </div>
                        <Button
                            className={`${
                                isExpired ?  'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600' 
                            } text-white`}
                            onClick={handleStatusChange}
                        >
                            {isExpired ? 'Mark as Active': 'Mark as Expired'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
