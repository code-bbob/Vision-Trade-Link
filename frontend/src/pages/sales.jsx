import React, { useEffect, useState } from 'react';
import useAxios from '../utils/useAxios';

const GetSales = () => {
  const [sales, setSales] = useState([]);
  const api = useAxios(); // Hook is used properly

  const fetchData = async () => {
    try {
      const response = await api.get('transaction/salestransaction/');
      console.log(response.data)
      setSales(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Will run on component mount

  return (
    <div>
      <h1>Hi</h1>
      <ul>
        {sales.map((sale, index) => (
          <li key={index}>{sale.date}</li>
        ))}
      </ul>
    </div>
  );
};

export default GetSales;
