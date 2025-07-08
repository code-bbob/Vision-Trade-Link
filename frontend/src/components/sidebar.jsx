'use client'

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Smartphone,
  ShoppingCart,
  TrendingUp,
  Zap,
  Shield,
  LogOut,
  BookUser,
  Menu,
  X
} from "lucide-react"
import { Link, useNavigate, useLocation } from "react-router-dom"

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => setIsOpen(!isOpen)

  useEffect(() => {
    setIsOpen(false)
  }, [location])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.sidebar')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' },
  }

  const menuItems = [
    { title: 'Inventory', icon: Smartphone, path: '/mobile/inventory' },
    { title: 'Purchases', icon: ShoppingCart, path: '/mobile/purchases' },
    { title: 'PurchaseReturns', icon: ShoppingCart, path: '/mobile/purchase-returns' },
    { title: 'Sales', icon: TrendingUp, path: '/mobile/sales' },
    { title: 'SalesReturns', icon: TrendingUp, path: '/mobile/sales-returns' },
    { title: 'SalesReport', icon: TrendingUp, path: '/mobile/sales-report' }, // Open in new tab
    { title: 'Schemes', icon: Zap, path: '/mobile/schemes' },
    { title: 'Price Protection', icon: Shield, path: '/mobile/price-protection' },
    { title: 'Vendors', icon: BookUser, path: '/mobile/vendors' },
    { title: 'VendorTransactions', icon: BookUser, path: '/mobile/vendor-transactions' },
    { title: 'Debtors', icon: BookUser, path: '/debtors' },
    { title: 'DebtorTransactions', icon: BookUser, path: '/debtor-transactions' },
    { title: 'EMI', icon: BookUser, path: '/mobile/emi' },
    { title: 'EMI Transactions', icon: BookUser, path: '/mobile/emi-transactions' },
    { title: 'AllInventory', icon: BookUser, path: '/' },
  ]

  return (
    <>
      <Button
        variant="ghost"
        className="fixed top-4 left-4 z-50 lg:hidden text-white"
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      <AnimatePresence>
        {(isOpen || window.innerWidth >= 1024) && (
          <motion.div
            className="sidebar fixed top-0 left-0 z-40 w-64 h-full bg-slate-800 shadow-xl overflow-y-hidden"
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="p-6 pt-16 lg:pt-6">
              <div 
                className="text-2xl font-bold mb-6 text-white cursor-pointer" 
                onClick={() => {
                  navigate('/mobile/')
                  setIsOpen(false)
                }}
              >
                Phone Inventory
              </div>
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const isSalesReport = item.title === 'SalesReport'
                  if (isSalesReport) {
                    return (
                      <a
                        key={item.path}
                        href={item.path}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.title}
                        </Button>
                      </a>
                    )
                  }

                  return (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.title}
                      </Button>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
