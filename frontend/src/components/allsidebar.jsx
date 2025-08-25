'use client'

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Smartphone,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Container,
  Zap,
  Shield,
  LogOut,
  BookUser,
  Menu,
  X
} from "lucide-react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import BranchSelector from "./branchSelector"
import { useBranchNavigate } from "../hooks/useBranchNavigate"
import { useBranchId } from "../hooks/useBranch"

export default function Sidebar() {
  const navigate = useNavigate()
  const branchNavigate = useBranchNavigate()
  const branchId = useBranchId()
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
    { title: 'SalesReturn', icon: TrendingDown, path: '/sales-returns' },
    // { title: 'SalesReport', icon: TrendingUp, path: '/sales-report' }, // opens in new tab
    // { title: 'Staffs', icon: TrendingUp, path: '/staff' },
    // { title: 'StaffTransaction', icon: TrendingUp, path: '/staff-transactions' },
    { title: 'Vendors', icon: BookUser, path: '/vendors' },
    { title: 'VendorTransactions', icon: BookUser, path: '/vendor-transactions' },
    { title: 'Debtors', icon: BookUser, path: '/debtors' },
    { title: 'DebtorTransactions', icon: BookUser, path: '/debtor-transactions' },
  ]

  // Memoize menu links outside JSX for robust hook order
  const menuLinks = React.useMemo(() =>
    menuItems.map((item) => {
      const pathParts = item.path.split('/');
      const basePath = pathParts[1];
      const remainingPath = pathParts.slice(2).join('/');
      let fullPath = item.path;
      if (branchId && basePath) {
        if (remainingPath) {
          fullPath = `/${basePath}/${remainingPath}/branch/${branchId}`;
        } else {
          fullPath = `/${basePath}/branch/${branchId}`;
        }
      }
      return (
        <a
          key={item.path}
          href={fullPath}
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700 flex items-center px-4 py-2 rounded-md transition-colors duration-200"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey && e.button === 0) {
              e.preventDefault();
              branchNavigate(item.path);
              setIsOpen(false);
            }
          }}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.title}
        </a>
      );
    }), [branchId, branchNavigate, setIsOpen]
  );

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
            <div className="pl-6 pt-16 lg:pt-6">
              <div 
                className="text-2xl font-bold mb-6 text-white cursor-pointer" 
                onClick={() => {
                  navigate('/')
                  setIsOpen(false)
                }}
              >
                Inventory System
              </div>
              {/* Branch Selector */}
              <div className="mb-6">
                <BranchSelector />
              </div>
              <nav className="space-y-2">
                {menuLinks}
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
