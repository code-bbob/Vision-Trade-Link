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
import Sidebar from "./sidebar";

export default function LandingPage() {
  const api = useAxios();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isMonthly, setIsMonthly] = useState(true);
  const [showAmount, setShowAmount] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const handleLogout = () => {
    // Remove tokens from local storage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    dispatch(logout());

    history.push("/login");
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("transaction/stats/");
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to load statistics");
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-red-500">
        {error}
      </div>
    );
  if (!stats) return null;

  const currentStats = isMonthly ? stats.monthly : stats.alltime;

  const getChartData = () => {
    if (showAmount) {
      return [
        
        {
          name: "Purchases",
          monthly: currentStats.ptamt,
          allTime: stats.alltime.allptamt,
        },
        {
          name: "Sales",
          monthly: currentStats.stamt,
          allTime: stats.alltime.allstamt,
        },
      ];
    } else {
      return [
        
        {
          name: "Purchases",
          monthly: currentStats.purchases,
          allTime: stats.alltime.purchases,
        },
        {
          name: "Sales",
          monthly: currentStats.sales,
          allTime: stats.alltime.sales,
        },
      ];
    }
  };

  const chartData = getChartData();

  const COLORS = ["#8b5cf6", "#3b82f6"];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar/>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-10 overflow-y-auto">
        <div className="relative mb-8">
          <motion.div
            initial={{ opacity: 0, x: -1000 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <motion.h1
              className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text whitespace-nowrap inline-block"
              animate={{ x: ["50%", "0%", "50%"] }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            >
              Welcome, {stats.enterprise}!
            </motion.h1>
          </motion.div>
          <Button
            onClick={handleLogout}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 hover:bg-red-600 text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <motion.div
          className="flex justify-end mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center space-x-2">
            <Switch
              id="stats-mode"
              checked={!isMonthly}
              onCheckedChange={(checked) => setIsMonthly(!checked)}
            />
            <Label htmlFor="stats-mode" className="text-white">
              {isMonthly ? "Monthly Stats" : "All-time Stats"}
            </Label>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Purchases"
            value={currentStats.purchases}
            subValue={isMonthly ? currentStats.ptamt : currentStats.allptamt}
            icon={<ShoppingCart className="h-6 w-6 text-blue-400" />}
            onClick={() => navigate("/purchases")}
          />
          <StatCard
            title="Total Sales"
            value={currentStats.sales}
            subValue={isMonthly ? currentStats.stamt : currentStats.allstamt}
            icon={<TrendingUp className="h-6 w-6 text-green-400" />}
            onClick={() => navigate("/sales")}
          />
          <StatCard
            title="Profit"
            value={currentStats.profit}
            icon={<Zap className="h-6 w-6 text-yellow-400" />}
            onClick={() => navigate("/profit")}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            title="Current Stock"
            value={stats.stock}
            icon={<Smartphone className="h-6 w-6 text-purple-400" />}
            onClick={() => navigate("/inventory")}
          />
          <StatCard
            title="Brands"
            value={stats.brands}
            icon={<Shield className="h-6 w-6 text-indigo-400" />}
            onClick={() => navigate("/brands")}
          />
        </div>

        <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-white">
              Financial Overview
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Switch
                id="amount-mode"
                checked={showAmount}
                onCheckedChange={setShowAmount}
              />
              <Label htmlFor="amount-mode" className="text-white">
                {showAmount ? "Show Amount" : "Show Count"}
              </Label>
            </div>
          </CardHeader>
          <CardContent>
            {/* <div className="flex justify-around mb-4">
              <span
                className="text-lg font-semibold"
                style={{ color: COLORS[0] }}
              >
                Sales:
                <br />
                {showAmount ? `Rs ` : ""}
                {chartData[0].allTime}
              </span>

              <span
                className="text-lg font-semibold"
                style={{ color: COLORS[1] }}
              >
                Purchases:
                <br />
                {showAmount ? `Rs ` : ""}
                {chartData[1].allTime}
              </span>
              </div> */}
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                {chartData.map((entry, index) => (
                  <Pie
                    key={entry.name}
                    data={[
                      { name: "Monthly", value: entry.monthly },
                      {
                        name: "All Time",
                        value: entry.allTime - entry.monthly,
                      },
                    ]}
                    cx={`${25 + index * 50}%`}
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={COLORS[index]} />
                    <Cell fill={COLORS[index]} opacity={0.5} />
                  </Pie>
                ))}
                <Tooltip />
                <Legend
                  payload={[
                    {
                      value: "Purchase (Monthly)",
                      type: "circle",
                      color: COLORS[0],
                    },
                    {
                      value: "Purchase (All Time)",
                      type: "circle",
                      color: COLORS[0],
                      opacity: 0.5,
                    },
                    {
                      value: "Sales (Monthly)",
                      type: "circle",
                      color: COLORS[1],
                    },
                    {
                      value: "Sales (All Time)",
                      type: "circle",
                      color: COLORS[1],
                      opacity: 0.5,
                    },
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
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
      <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg hover:shadow-xl transition-shadow duration-300 group relative overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-0 transition-opacity duration-300"></div>
        <div className="absolute inset-0 bg-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors duration-300">
            {title}
          </CardTitle>
          {icon}
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300">
            {value}
          </div>
          {subValue !== undefined && (
            <div className="text-sm text-slate-400 mt-1 group-hover:text-purple-200 transition-colors duration-300">
              Rs. {subValue.toFixed(2)}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
