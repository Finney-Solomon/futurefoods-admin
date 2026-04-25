import React, { useState, useEffect } from 'react';
import { Search, Eye, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { apiService } from '../../services/api';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { RightDrawerModal } from '../layout/RightDrawerModal';
import { StatusSelect } from '../StatusSelect';
import { formatINR } from '../../CommonFunctions';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    imageUrl?: string;
  } | null;
  quantity: number;
  pricePaise: number;
}

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  items: OrderItem[];
  amountPaise: number;
  status: 'created' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'succeeded' | 'failed' | 'processing';
  paymentDetails?: {
    last4?: string;
    brand?: string;
    expMonth?: number;
    expYear?: number;
    errorMessage?: string;
  };
  stripePaymentIntentId?: string;
  address: {
    line1: string;
    city: string;
    state: string;
    pin: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiService.getOrders();
      setOrders(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderInState = (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((order) => (order._id === updatedOrder._id ? updatedOrder : order)),
    );
    setSelectedOrder(updatedOrder);
  };

  const handleUserCancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      const updatedOrder = await apiService.cancelOrder(selectedOrder._id);
      updateOrderInState(updatedOrder);
      toast.success('Order cancelled successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminCancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      const updatedOrder = await apiService.adminCancelOrder(selectedOrder._id);
      updateOrderInState(updatedOrder);
      toast.success('Order cancelled successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkOrderShipped = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      const updatedOrder = await apiService.markOrderShipped(selectedOrder._id, {
        shippingId: selectedOrder._id.slice(-8),
        carrier: 'Manual',
        service: 'Standard',
        trackingUrl: '',
        estimatedDeliveryAt: new Date().toISOString(),
        note: 'Marked as shipped from admin panel',
      });
      updateOrderInState(updatedOrder);
      toast.success('Order marked as shipped');
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark order shipped');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkOrderDelivered = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      const updatedOrder = await apiService.markOrderDelivered(selectedOrder._id);
      updateOrderInState(updatedOrder);
      toast.success('Order marked as delivered');
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark order delivered');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaymentCompleted = async () => {
    if (!selectedOrder || !selectedOrder.stripePaymentIntentId) return;

    try {
      setActionLoading(true);
      const updatedOrder = await apiService.confirmOrderPayment(
        selectedOrder._id,
        selectedOrder.stripePaymentIntentId,
      );
      updateOrderInState(updatedOrder);
      toast.success('Payment marked as completed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark payment completed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-gray-100 text-gray-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created': return Package;
      case 'paid': return Package;
      case 'shipped': return Truck;
      case 'delivered': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Package;
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      (order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'created', label: 'Created' },
    { value: 'paid', label: 'Paid' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600">Manage customer orders</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full sm:w-48">
              {/* <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
              /> */}
              <StatusSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
              />

            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* <div className="max-h-[590px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order._id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.user.name}
                        </div>
                        <div className="text-sm text-gray-500">{order.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{(order.amountPaise / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div> */}
          <div className="relative">
            {/* Scrollable container */}
            <div className="max-h-[568px] overflow-y-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const StatusIcon = getStatusIcon(order.status);
                    return (
                      <tr key={order._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order._id.slice(-8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.user?.name || 'Guest User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.user?.email || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.items.length} item
                          {order.items.length !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatINR(order.amountPaise / 100) || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {order.paymentStatus || 'pending'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.paymentDetails?.brand
                              ? `${order.paymentDetails.brand.toUpperCase()} • ****${order.paymentDetails.last4 || '0000'}`
                              : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredOrders.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              {searchTerm || statusFilter ? 'No orders found matching your criteria' : 'No orders found'}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      <RightDrawerModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Order #${selectedOrder?._id.slice(-8)}`}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Order status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div className="space-x-2">
                {isAdmin && selectedOrder.status === 'paid' && (
                  <Button
                    onClick={handleMarkOrderShipped}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Mark Shipped'}
                  </Button>
                )}
                {isAdmin && selectedOrder.status === 'shipped' && (
                  <Button
                    onClick={handleMarkOrderDelivered}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Mark Delivered'}
                  </Button>
                )}
                {selectedOrder.stripePaymentIntentId && selectedOrder.status !== 'paid' && selectedOrder.status !== 'cancelled' && selectedOrder.paymentStatus !== 'succeeded' && (
                  <Button
                    onClick={handleMarkPaymentCompleted}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Mark Payment Completed'}
                  </Button>
                )}
                {(isAdmin || selectedOrder.status === 'created') && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <Button
                    variant="danger"
                    onClick={isAdmin ? handleAdminCancelOrder : handleUserCancelOrder}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Cancel Order'}
                  </Button>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div><span className="font-medium">Name:</span> {selectedOrder.user?.name || 'Guest User'}</div>
                <div><span className="font-medium">Email:</span> {selectedOrder.user?.email || 'N/A'}</div>
                <div><span className="font-medium">Phone:</span> {selectedOrder.address.phone}</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div><span className="font-medium">Payment Status:</span> {selectedOrder.paymentStatus || 'pending'}</div>
                <div><span className="font-medium">Method:</span> {selectedOrder.paymentDetails?.brand ? `${selectedOrder.paymentDetails.brand.toUpperCase()} • ****${selectedOrder.paymentDetails.last4 || '0000'}` : 'N/A'}</div>
                {selectedOrder.stripePaymentIntentId && (
                  <div><span className="font-medium">Stripe Payment ID:</span> {selectedOrder.stripePaymentIntentId}</div>
                )}
                {selectedOrder.paymentDetails?.errorMessage && (
                  <div className="text-sm text-red-600">Error: {selectedOrder.paymentDetails.errorMessage}</div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Shipping Address</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div>{selectedOrder.address.line1}</div>
                <div>{selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pin}</div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Order Items</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    {item.product?.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.product?.name || 'Product Unavailable'}</div>
                      <div className="text-sm text-gray-500">
                        Quantity: {item.quantity} × {formatINR(item.pricePaise / 100)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatINR((item.quantity * item.pricePaise) / 100)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount:</span>
                <span>{formatINR(selectedOrder.amountPaise / 100)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </RightDrawerModal>
    </div>
  );
};