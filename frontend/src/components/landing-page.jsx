'use client';
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"
import { Smartphone, ShoppingCart, TrendingUp, Zap, Shield } from 'lucide-react'
import useAxios from '../utils/useAxios'
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const api = useAxios()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [isMonthly, setIsMonthly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('transaction/stats/')
        setStats(response.data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching stats:', err)
        setError('Failed to load statistics')
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">Loading...</div>
  if (error) return <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-red-500">{error}</div>
  if (!stats) return null

  const currentStats = isMonthly ? stats.monthly : stats.alltime

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Sidebar */}
      <motion.div 
        className="w-64 bg-slate-800 shadow-xl"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-white">Inventory System</h2>
          <nav className="space-y-2">
            <Link to="/inventory">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
                <Smartphone className="mr-2 h-4 w-4" />
                Inventory
              </Button>
            </Link>
            <Link to="/purchases">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Purchases
              </Button>
            </Link>
            <Link to="/sales">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
                <TrendingUp className="mr-2 h-4 w-4" />
                Sales
              </Button>
            </Link>
            <Link to="/schemes">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
                <Zap className="mr-2 h-4 w-4" />
                Schemes
              </Button>
            </Link>
            <Link to="/price-protection">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
                <Shield className="mr-2 h-4 w-4" />
                Price Protection
              </Button>
            </Link>
          </nav>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: -1000 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <motion.h1 
            className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text whitespace-nowrap"
            animate={{ x: ["0%", "100%", "0%"] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          >
            Welcome, {stats.enterprise}!
          </motion.h1>
        </motion.div>
        

        <motion.div 
          className="flex justify-end mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center space-x-2">
            <Switch
              id="stats-mode"
              checked={isMonthly}
              onCheckedChange={setIsMonthly}
            />
            <Label htmlFor="stats-mode" className="text-white">
              {isMonthly ? 'Monthly Stats' : 'All-time Stats'}
            </Label>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Purchases"
            value={currentStats.purchases}
            subValue={isMonthly ? currentStats.ptamt : currentStats.allptamt}
            icon={<ShoppingCart className="h-6 w-6 text-blue-400" />}
            onClick={() => navigate('/purchases')}
          />
          <StatCard
            title="Total Sales"
            value={currentStats.sales}
            subValue={isMonthly ? currentStats.stamt : currentStats.allstamt}
            icon={<TrendingUp className="h-6 w-6 text-green-400" />}
            onClick={() => navigate('/sales')}
          />
          <StatCard
            title="Profit"
            value={currentStats.profit}
            icon={<Zap className="h-6 w-6 text-yellow-400" />}
            onClick={() => navigate('/profit')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Current Stock"
            value={stats.stock}
            icon={<Smartphone className="h-6 w-6 text-purple-400" />}
            onClick={() => navigate('/inventory')}
          />
          <StatCard
            title="Brands"
            value={stats.brands}
            icon={<Shield className="h-6 w-6 text-indigo-400" />}
            onClick={() => navigate('/brands')}
          />
        </div>
      </div>
    </div>
  )
}


function StatCard({ title, value, subValue, icon, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            {title}
          </CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{value}</div>
          {subValue !== undefined && (
            <div className="text-sm text-slate-400 mt-1">
              Rs. {subValue.toFixed(2)}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}