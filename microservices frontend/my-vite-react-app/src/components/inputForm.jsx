// src/InputForm.js
import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const InputForm = () => {
  // Define validation schema with Yup
  const validationSchema = Yup.object({
    productId: Yup.number()
      .required('Product ID is required')
      .positive('Product ID must be positive')
      .integer('Product ID must be an integer'),
    quantity: Yup.number() // Updated validation for quantity
      .required('Quantity is required')
      .min(1, 'Quantity must be at least 1')
      .integer('Quantity must be an integer')
  });

  // Define the initial values
  const initialValues = {
    productId: '',
    quantity: '' // Updated initial value
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      const response = await axios.post('http://localhost:3002/orders', values);
      console.log('API Response:', response.data);
      // Handle successful response here
    } catch (error) {
      console.error('API Error:', error);
      // Handle error response here
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Order Input Form</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {() => (
          <Form className="space-y-4">
            <div>
              <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
                Product ID
              </label>
              <Field
                type="number"
                id="productId"
                name="productId"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <ErrorMessage name="productId" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <Field
                type="number"
                id="quantity"
                name="quantity" // Updated name
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <ErrorMessage name="quantity" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default InputForm;
