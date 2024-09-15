"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  Smartphone,
  ShoppingCart,
  TrendingUp,
  Zap,
  Shield,
  LogOut,
} from "lucide-react";
import useAxios from "../utils/useAxios";
import { Link, useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useDispatch } from "react-redux";
import { login, logout } from "../redux/accessSlice";
// import { useNavigate } from "react-router-dom";


export default function Sidebar(){

    const navigate = useNavigate()
    return(

<motion.div
        className="w-64 bg-slate-800 shadow-xl h-screen fixed"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6">
          <div className="text-2xl font-bold mb-6 text-white" onClick={()=>navigate('/')}>
            Inventory System
          </div>
          <nav className="space-y-2">
            <Link to="/inventory">
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Inventory
              </Button>
            </Link>
            <Link to="/purchases">
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Purchases
              </Button>
            </Link>
            <Link to="/sales">
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Sales
              </Button>
            </Link>
            <Link to="/schemes">
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <Zap className="mr-2 h-4 w-4" />
                Schemes
              </Button>
            </Link>
            <Link to="/price-protection">
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <Shield className="mr-2 h-4 w-4" />
                Price Protection
              </Button>
            </Link>
          </nav>
        </div>
      </motion.div>
    )
}