// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProductTable from './components/table';
import InputForm from './components/inputForm';
import OrderTable from './components/orderTable';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="p-4 bg-blue-600 text-white">
          <nav>
            <ul className="flex space-x-4">
              <li>
                <a href="/" className="hover:underline">Product Table</a>
              </li>
              <li>
                <a href="/input-form" className="hover:underline">Input Form</a>
              </li>
              <li>
                <a href="/ordertable" className="hover:underline">order table</a>
              </li>
            </ul>
          </nav>
        </header>

        <main className="p-4">
          <Routes>
            <Route path="/" element={<ProductTable />} />
            <Route path="/input-form" element={<InputForm />} />
            <Route path="/ordertable" element={<OrderTable/>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
