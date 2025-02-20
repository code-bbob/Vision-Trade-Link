'use client'

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Smartphone,
  ShoppingCart,
  TrendingUp,
  Container,
  Zap,
  Shield,
  LogOut,
  BookUser,
  Menu,
  X
} from "lucide-react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { icon } from "@fortawesome/fontawesome-svg-core"

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
    { title: 'Inventory', icon: Container, path: '/inventory' },
    { title: 'Purchases', icon: ShoppingCart, path: '/purchases' },
    { title: 'PurchaseReturn', icon: ShoppingCart, path: '/purchase-returns' },
    { title: 'Sales', icon: TrendingUp, path: '/sales' },
    { title: 'SalesReport', icon: TrendingUp, path: '/sales-report' },
    { title: 'Vendors', icon: BookUser, path: '/vendors' },
    { title: 'VendorTransactions', icon: BookUser, path: '/vendor-transactions' },
    { title: 'Phone Only', icon: Smartphone, path: '/mobile' },
    
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
            className="sidebar fixed top-0 left-0 z-40 w-64 h-full bg-slate-800 shadow-xl overflow-y-auto"
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="p-6 pt-16 lg:pt-6"> {/* Added padding-top for mobile */}
              <div 
                className="text-2xl font-bold mb-6 text-white cursor-pointer" 
                onClick={() => {
                  navigate('/')
                  setIsOpen(false)
                }}
              >
                Inventory System
              </div>
              <nav className="space-y-2">
                {menuItems.map((item) => (
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
                ))}
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