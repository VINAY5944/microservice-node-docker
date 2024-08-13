import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

const OrderTable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:3002/orders'); // Replace with your API endpoint
        setOrders(response.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3002/orders/${id}`);
      setOrders(orders.filter(order => order.id !== id));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedOrder(null);
  };

  const handleUpdateOrder = async (values) => {
    try {
      await axios.put(`http://localhost:3002/orders/${values.id}`, values);
      setOrders(orders.map(order => (order.id === values.id ? values : order)));
      handleModalClose();
    } catch (error) {
      setError(error.message);
    }
  };

  const validationSchema = Yup.object({
    productId: Yup.number().required('Product ID is required').positive('Product ID must be positive'),
    quantity: Yup.number().required('Quantity is required').positive('Quantity must be positive'),
    status: Yup.string().required('Status is required')
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <table className="min-w-full bg-white border border-gray-300 rounded-md shadow-md">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Product ID</th>
            <th className="p-2 text-left">Quantity</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{order.id}</td>
              <td className="p-2">{order.productId}</td>
              <td className="p-2">{order.quantity}</td>
              <td className="p-2">{order.status}</td>
              <td className="p-2 flex gap-2">
                <button
                  onClick={() => handleView(order)}
                  className="text-blue-600 hover:underline"
                  title="View"
                >
                  <FaEye />
                </button>
                <button
                  onClick={() => handleEdit(order)}
                  className="text-blue-600 hover:underline"
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(order.id)}
                  className="text-red-600 hover:underline"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Order Details</h2>
            <div className="mb-4">
              <p><strong>ID:</strong> {selectedOrder.id}</p>
              <p><strong>Product ID:</strong> {selectedOrder.productId}</p>
              <p><strong>Quantity:</strong> {selectedOrder.quantity}</p>
              <p><strong>Status:</strong> {selectedOrder.status}</p>
            </div>
            <button
              type="button"
              onClick={handleModalClose}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Edit Order</h2>
            <Formik
              initialValues={selectedOrder}
              validationSchema={validationSchema}
              onSubmit={handleUpdateOrder}
            >
              {() => (
                <Form>
                  <div className="mb-4">
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

                  <div className="mb-4">
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <Field
                      type="number"
                      id="quantity"
                      name="quantity"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <ErrorMessage name="quantity" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <Field
                      type="text"
                      id="status"
                      name="status"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <ErrorMessage name="status" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleModalClose}
                      className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTable;
