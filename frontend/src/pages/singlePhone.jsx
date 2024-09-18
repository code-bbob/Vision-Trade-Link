'use client';

import React, { useState, useEffect } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { ArrowRight } from 'lucide-react'
import useAxios from '../utils/useAxios'
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import { useParams } from 'react-router-dom';

export default function SinglePhone() {
const api = useAxios()
const [data, setData] = useState([])
const [phone, setPhone] = useState()
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)


const navigate = useNavigate()
const id = useParams()

async function fetchData() {
    setLoading(true)
    try {
    const response = await api.get(`inventory/phone/${id.id}/`)
    setData(response.data.list)
    setPhone(response.data.phone)
    } catch (err) {
    setError('Failed to fetch data')
    } finally {
    setLoading(false)
    }
}

useEffect(() => {
    fetchData()
}, [])

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
<div className="max-w-6xl p-6 mx-auto">
            <Card className="mb-6 w-96 bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg">
            <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-xl font-medium text-white flex justify-between items-center">
                <span>{phone}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
            {data?.length > 0 ? (
        data?.map((da) => (
<h1 className="text-center text-white mb-2 font-bold "><ArrowRight className=''/>{da}</h1>
        ))
    ) : (
    <div className="text-center text-white">No items found.</div>
    )}


            </CardContent>
            </Card>
        </div>
        </div>
       
)
}