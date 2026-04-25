import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Search, Star, User, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { apiService } from '../../services/api';
import { useToast } from '../ui/Toast';
import { RightDrawerModal } from '../layout/RightDrawerModal';
import { Review } from '../../types/api';

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const data = await apiService.getReviewsAdmin();
      setReviews(data.items || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (review: Review) => {
    try {
      setActionLoading(true);
      await apiService.updateReviewVisibility(review._id, !review.isVisible);
      setReviews(prev =>
        prev.map(r => r._id === review._id ? { ...r, isVisible: !r.isVisible } : r)
      );
      toast.success(`Review ${!review.isVisible ? 'made visible' : 'hidden'} successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update review visibility');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await apiService.deleteReview(id);
      setReviews(prev => prev.filter(r => r._id !== id));
      toast.success('Review deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete review');
    }
  };

  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setIsViewModalOpen(true);
  };

  const filteredReviews = reviews.filter(review =>
    review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (review.title && review.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-600">Manage customer reviews and visibility</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reviewer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReviews.map((review) => (
                <tr key={review._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {review.reviewerName}
                        </div>
                        {review.user && (
                          <div className="text-sm text-gray-500">
                            {review.user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                      <span className="ml-2 text-sm text-gray-500">
                        ({review.rating}/5)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {review.title && (
                        <div className="font-medium mb-1">{review.title}</div>
                      )}
                      <div className="text-gray-600">{review.comment}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      review.isVisible
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {review.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewReview(review)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVisibility(review)}
                      disabled={actionLoading}
                    >
                      {review.isVisible ? (
                        <EyeOff className="w-4 h-4 text-orange-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(review._id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReviews.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              {searchTerm ? 'No reviews found matching your search' : 'No reviews found'}
            </div>
          )}
        </div>
      </div>

      {/* View Review Modal */}
      <RightDrawerModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Review Details"
      >
        {selectedReview && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedReview.title || 'Review'}
              </h3>
              <div className="flex items-center mb-4">
                {renderStars(selectedReview.rating)}
                <span className="ml-2 text-sm text-gray-500">
                  {selectedReview.rating}/5
                </span>
              </div>
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-900">
                  {selectedReview.reviewerName}
                </span>
                {selectedReview.user && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({selectedReview.user.email})
                  </span>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start">
                  <MessageSquare className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  <p className="text-sm text-gray-700">{selectedReview.comment}</p>
                </div>
              </div>
              {selectedReview.imageUrl && (
                <div className="mt-4">
                  <img
                    src={selectedReview.imageUrl}
                    alt="Review image"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}
              <div className="mt-4 text-sm text-gray-500">
                <p>Created: {new Date(selectedReview.createdAt).toLocaleString()}</p>
                <p>Status: {selectedReview.isVisible ? 'Visible' : 'Hidden'}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => handleToggleVisibility(selectedReview)}
                disabled={actionLoading}
                variant={selectedReview.isVisible ? "outline" : "default"}
              >
                {selectedReview.isVisible ? 'Hide Review' : 'Show Review'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDelete(selectedReview._id);
                  setIsViewModalOpen(false);
                }}
              >
                Delete Review
              </Button>
            </div>
          </div>
        )}
      </RightDrawerModal>
    </div>
  );
};