// librarian/borrow/page.tsx
'use client';

import React, { useEffect, useState } from 'react'; // Added React import
import Layout from '../../../components/Layout';
import api, { setAuthToken } from '../../../lib/api';
import { useTranslation } from '../../../lib/i18n';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiBookOpen,
  FiCheckCircle,
  FiRotateCcw,
  FiSearch,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiCalendar,
  FiUser,
  FiBook,
  FiClock,
  FiCornerUpLeft,
  FiAlertCircle,
  FiFilter,
  FiRefreshCw,
  FiTrash2
} from 'react-icons/fi';

// Modal Component
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      key="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        key="modal-content"
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative"
      >
        <button
          key="modal-close-button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <FiX className="w-5 h-5" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

// Confirm Delete Modal
function ConfirmDeleteModal({ 
  borrow, 
  onClose, 
  onConfirm 
}: { 
  borrow: any; 
  onClose: () => void; 
  onConfirm: () => void 
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="delete-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        key="delete-modal-content"
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative"
      >
        <button
          key="delete-modal-close-button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <FiX className="w-5 h-5" />
        </button>
        
        <div key="delete-modal-icon" className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <FiTrash2 className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <h3 key="delete-modal-title" className="text-xl font-bold text-gray-800 mb-2 text-center">
          {t('confirmDelete') || 'Confirm Delete'}
        </h3>
        
        <p key="delete-modal-message" className="text-gray-600 mb-6 text-center">
          {t('deleteBorrowWarning') || 'Are you sure you want to delete this borrow record?'}
        </p>
        
        <div key="delete-borrow-details" className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500 text-xs">{t('userIdLabel') || 'User ID'}</p>
              <p className="font-medium">{borrow.userId}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">{t('usernameLabel') || 'Username'}</p>
              <p className="font-medium">{borrow.username}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">{t('book') || 'Book'}</p>
              <p className="font-medium truncate">{borrow.bookTitle}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">{t('status') || 'Status'}</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                borrow.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                borrow.status === 'borrowed' ? 'bg-green-100 text-green-800' :
                borrow.status === 'returned' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {borrow.status}
              </span>
            </div>
          </div>
        </div>
        
        <div key="delete-modal-actions" className="flex gap-3">
          <button
            key="delete-cancel-button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            key="delete-confirm-button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                {t('deleting') || 'Deleting...'}
              </>
            ) : (
              <>
                <FiTrash2 className="w-4 h-4" />
                {t('delete') || 'Delete'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Toast Component
function Toast({ toast }: { toast: { message: string; type: 'success' | 'error' } }) {
  return (
    <motion.div
      key={`toast-${Date.now()}`}
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white flex items-center gap-2 text-sm shadow-lg ${
        toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      {toast.type === 'success' ? (
        <FiCheckCircle className="w-4 h-4" />
      ) : (
        <FiAlertCircle className="w-4 h-4" />
      )}
      {toast.message}
    </motion.div>
  );
}

// Librarian Borrow Form (Direct Borrow - No Approval Needed)
function LibrarianBorrowForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    username: '',
    bookId: '',
    bookName: '',
    dueDate: '',
  });

  useEffect(() => {
    // Auto-set due date to 7 days from now
    const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const formattedDate = due.toISOString().slice(0, 16);
    setForm(prev => ({ ...prev, dueDate: formattedDate }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/borrows/librarian-borrow', {
        ...form,
        dueDate: new Date(form.dueDate).toISOString(),
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || t('borrowFailed') || 'Borrow failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form key="librarian-borrow-form" onSubmit={submit} className="space-y-4">
      {/* Compact Grid Layout */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">
            {t('userIdLabel') || 'User ID'} 
          </label>
          <input
            key="user-id-input"
            name="userId"
            placeholder={t('userIdLabel') || "User ID"}
            required
            value={form.userId}
            onChange={handleChange}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">
            {t('usernameLabel') || 'Username'}
          </label>
          <input
            key="username-input"
            name="username"
            placeholder={t('usernameLabel') || "Username"}
            required
            value={form.username}
            onChange={handleChange}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">
            {t('bookIdLabel') || 'Book ID'}
          </label>
          <input
            key="book-id-input"
            name="bookId"
            placeholder={t('bookIdLabel') || "Book ID"}
            required
            value={form.bookId}
            onChange={handleChange}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">
            {t('bookNameLabel') || 'Book Name'}
          </label>
          <input
            key="book-name-input"
            name="bookName"
            placeholder={t('bookNameLabel') || "Book Name"}
            required
            value={form.bookName}
            onChange={handleChange}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="col-span-2 space-y-1">
          <label className="block text-xs font-medium text-gray-600">
            {t('dueDateLabel') || 'Due Date'}
          </label>
          <input
            key="due-date-input"
            type="datetime-local"
            name="dueDate"
            required
            value={form.dueDate}
            onChange={handleChange}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          key="cancel-button"
          type="button"
          onClick={() => window.location.reload()}
          className="flex-1 bg-gray-200 text-gray-700 text-sm py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          {t('cancelRequest') || "Cancel"}
        </button>
        <button
          key="submit-button"
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              {t('processing') || "Processing..."}
            </>
          ) : (
            t('borrowBook') || 'Borrow Book'
          )}
        </button>
      </div>

      {/* Compact Info Note */}
      <div key="info-note" className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
        <div className="flex items-start gap-2">
          <FiInfo className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-blue-800 font-medium">{t('directBorrowNote') || "Librarian Note:"}</p>
            <p className="text-xs text-blue-700 mt-0.5">
              {t('directBorrowDesc') || "Direct borrowing for trusted users."}
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}

// Return Form Component
function ReturnForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ userId: '', bookId: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await api.post('/borrows/return', form);
      alert(`${t('returnedSuccess') || 'Returned successfully!'}\n${t('fine')}: ETB ${res.data.fine}`);
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || t('returnFailed') || 'Return failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form key="return-form" onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('userIdLabel') || 'User ID'}
        </label>
        <input
          key="return-user-id-input"
          name="userId"
          placeholder={t('userIdLabel') || "Enter user ID"}
          required
          value={form.userId}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('bookIdLabel') || 'Book ID'}
        </label>
        <input
          key="return-book-id-input"
          name="bookId"
          placeholder={t('bookIdLabel') || "Enter book ID"}
          required
          value={form.bookId}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          key="return-submit-button"
          type="submit"
          disabled={loading}
          className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          {loading ? t('processing') || 'Processing...' : t('returnBook') || 'Return Book'}
        </button>
      </div>
    </form>
  );
}

// Approval Form Component
function ApprovalForm({ borrow, onSuccess }: { borrow: any; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [reason, setReason] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/borrows/approve', {
        borrowId: borrow._id,
        action,
        reason: action === 'reject' ? reason : undefined,
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || t('actionFailed') || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form key="approval-form" onSubmit={submit} className="space-y-4">
      <div key="borrow-info" className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">{borrow.bookTitle}</p>
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          <p key="username-info" className="text-gray-600">
            <span className="font-medium">{t('usernameLabel')}:</span> {borrow.username}
          </p>
          <p key="userid-info" className="text-gray-600">
            <span className="font-medium">{t('userIdLabel')}:</span> {borrow.userId}
          </p>
          <p key="requested-info" className="text-gray-600">
            <span className="font-medium">{t('requested')}:</span>{' '}
            {new Date(borrow.requestedAt).toLocaleString()}
          </p>
          <p key="due-info" className="text-gray-600">
            <span className="font-medium">{t('due')}:</span>{' '}
            {new Date(borrow.dueDate).toLocaleString()}
          </p>
        </div>
      </div>

      <div key="action-selection">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t('action') || 'Action'}
        </label>
        <div className="flex gap-4">
          <label key="approve-label" className="flex items-center">
            <input
              key="approve-radio"
              type="radio"
              value="approve"
              checked={action === 'approve'}
              onChange={(e) => setAction(e.target.value as 'approve')}
              className="mr-2"
            />
            <span className="text-green-600 font-medium">{t('approve') || 'Approve'}</span>
          </label>
          <label key="reject-label" className="flex items-center">
            <input
              key="reject-radio"
              type="radio"
              value="reject"
              checked={action === 'reject'}
              onChange={(e) => setAction(e.target.value as 'reject')}
              className="mr-2"
            />
            <span className="text-red-600 font-medium">{t('reject') || 'Reject'}</span>
          </label>
        </div>
      </div>

      {action === 'reject' && (
        <div key="reason-input">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('rejectionReason') || 'Rejection Reason'}
          </label>
          <textarea
            key="reason-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={3}
            placeholder="Optional reason for rejection"
          />
        </div>
      )}

      <div key="action-buttons" className="flex gap-2 pt-2">
        <button
          key="submit-action-button"
          type="submit"
          disabled={loading}
          className={`flex-1 py-2 rounded-lg text-white transition-colors disabled:opacity-50 ${
            action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {loading
            ? t('processing') || 'Processing...'
            : action === 'approve'
            ? t('approveRequest') || 'Approve Request'
            : t('rejectRequest') || 'Reject Request'}
        </button>
      </div>
    </form>
  );
}

// Borrow Detail Card Component
function BorrowDetailCard({ borrow }: { borrow: any }) {
  const { t } = useTranslation();
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'borrowed':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return t('pending') || 'Pending';
      case 'borrowed':
        return t('borrowed') || 'Borrowed';
      case 'returned':
        return t('returned') || 'Returned';
      case 'rejected':
        return t('rejected') || 'Rejected';
      default:
        return status;
    }
  };

  return (
    <motion.div
      key={`detail-card-${borrow._id}`}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-gray-50 border-l-4 border-indigo-500 rounded-r-lg p-4 my-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-3">
            <div key="user-id-detail" className="flex items-start gap-2">
              <FiUser className="w-4 h-4 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">{t('userIdLabel') || 'User ID'}</p>
                <p className="font-mono font-medium text-sm">{borrow.userId}</p>
              </div>
            </div>
            
            <div key="username-detail" className="flex items-start gap-2">
              <FiUser className="w-4 h-4 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">{t('usernameLabel') || 'Username'}</p>
                <p className="font-medium text-sm">{borrow.username}</p>
              </div>
            </div>
            
            <div key="book-id-detail" className="flex items-start gap-2">
              <FiBook className="w-4 h-4 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">{t('bookIdLabel') || 'Book ID'}</p>
                <p className="font-mono font-medium text-sm">{borrow.bookId}</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <div key="requested-date-detail" className="flex items-start gap-2">
              <FiCalendar className="w-4 h-4 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">{t('requested') || 'Requested'}</p>
                <p className="font-medium text-sm">{formatDate(borrow.requestedAt)}</p>
              </div>
            </div>
            
            <div key="due-date-detail" className="flex items-start gap-2">
              <FiClock className="w-4 h-4 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">{t('due') || 'Due Date'}</p>
                <p className="font-medium text-sm">{formatDate(borrow.dueDate)}</p>
              </div>
            </div>
            
            {borrow.returnedAt && (
              <div key="returned-date-detail" className="flex items-start gap-2">
                <FiCornerUpLeft className="w-4 h-4 mt-1 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">{t('returned') || 'Returned'}</p>
                  <p className="font-medium text-sm">{formatDate(borrow.returnedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div key="status-detail">
            <p className="text-xs text-gray-500">{t('status') || 'Status'}</p>
            <span
              key={`status-badge-${borrow._id}`}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                borrow.status
              )}`}
            >
              {getStatusText(borrow.status)}
            </span>
          </div>
          
          <div key="fine-detail">
            <p className="text-xs text-gray-500">{t('fine') || 'Fine'}</p>
            <div className="flex items-center gap-1">
              <p className="font-bold text-red-600 text-sm">ETB {borrow.fine}</p>
            </div>
          </div>
          
          <div key="book-title-detail">
            <p className="text-xs text-gray-500">{t('book') || 'Book Title'}</p>
            <p className="font-medium text-sm truncate">{borrow.bookTitle}</p>
          </div>
        </div>

        {/* Additional Info */}
        {(borrow.rejectionReason || borrow.approvedBy) && (
          <div key="additional-info" className="mt-4 pt-4 border-t border-gray-200">
            {borrow.rejectionReason && (
              <div key="rejection-reason" className="mb-2">
                <p className="text-xs font-medium text-red-800 mb-1">
                  {t('rejectionReason') || 'Rejection Reason'}
                </p>
                <p className="text-sm text-red-700">{borrow.rejectionReason}</p>
              </div>
            )}
            {borrow.approvedBy && (
              <div key="approved-by">
                <p className="text-xs font-medium text-gray-800 mb-1">
                  {t('processedBy') || 'Processed By'}
                </p>
                <p className="text-sm text-gray-700">Librarian ID: {borrow.approvedBy}</p>
                <p className="text-xs text-gray-600">
                  {formatDate(borrow.approvedAt)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Main Librarian Borrow Page
export default function LibrarianBorrow() {
  const { t } = useTranslation();
  const [borrows, setBorrows] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const limit = 10;

  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [borrowToDelete, setBorrowToDelete] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setAuthToken(token);
    fetchBorrows();
  }, []);

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit, search };
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/borrows', { params });
      setBorrows(res.data.borrows);
      setTotal(res.data.total);
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || 'Failed to load borrow records',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrows();
  }, [page, search, statusFilter]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const closeAllModals = () => {
    setShowBorrowModal(false);
    setShowReturnModal(false);
    setShowApprovalModal(false);
    setShowDeleteModal(false);
    setSelectedRequest(null);
    setBorrowToDelete(null);
  };

  const handleApproval = (borrow: any) => {
    setSelectedRequest(borrow);
    setShowApprovalModal(true);
  };

  const handleDelete = (borrow: any) => {
    setBorrowToDelete(borrow);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!borrowToDelete) return;
    
    try {
      // Call the delete endpoint
      await api.delete(`/borrows/${borrowToDelete._id}`);
      
      // Update local state
      setBorrows(prev => prev.filter(b => b._id !== borrowToDelete._id));
      showToast('Borrow record deleted successfully!', 'success');
      
      // Update total count
      setTotal(prev => Math.max(0, prev - 1));
      
      // Close modal and reset
      setShowDeleteModal(false);
      setBorrowToDelete(null);
      
      // If we deleted the last item on a page, go to previous page
      if (borrows.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete borrow record', 'error');
    }
  };

  const toggleRowDetail = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleBorrowSuccess = () => {
    closeAllModals();
    fetchBorrows();
    showToast('Book borrowed successfully!', 'success');
  };

  const handleReturnSuccess = () => {
    closeAllModals();
    fetchBorrows();
    showToast('Book returned successfully!', 'success');
  };

  const handleApprovalSuccess = () => {
    closeAllModals();
    fetchBorrows();
    showToast('Request processed successfully!', 'success');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'borrowed':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return t('pending') || 'Pending';
      case 'borrowed':
        return t('borrowed') || 'Borrowed';
      case 'returned':
        return t('returned') || 'Returned';
      case 'rejected':
        return t('rejected') || 'Rejected';
      default:
        return status;
      }
  };

  return (
    <Layout role="librarian">
      <motion.div
        key="main-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6 space-y-6 min-h-screen bg-gray-50"
      >
        {/* Header Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                {t('borrowManagement') || 'Borrow Management'}
              </h1>
              <p className="text-gray-600">
                {t('manageBorrowingAndReturns') || 'Manage book borrowing and returns'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.button
                key="borrow-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBorrowModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <FiBookOpen className="w-4 h-4" />
                <span className="font-medium">{t('borrow') || 'Borrow'}</span>
              </motion.button>
              
              <motion.button
                key="return-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowReturnModal(true)}
                className="flex items-center gap-2 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                <FiRotateCcw className="w-4 h-4" />
                <span className="font-medium">{t('return') || 'Return'}</span>
              </motion.button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <FiSearch className="text-gray-500" />
              <input
                key="search-input"
                type="text"
                placeholder={t('searchBorrowPlaceholder') || "Search by user, book, or ID..."}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-500" />
              <select
                key="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t('allStatus') || "All Status"}</option>
                <option value="pending">{t('pending') || "Pending"}</option>
                <option value="borrowed">{t('borrowed') || "Borrowed"}</option>
                <option value="returned">{t('returned') || "Returned"}</option>
                <option value="rejected">{t('rejected') || "Rejected"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: t('totalRecords') || 'Total Records', value: total, color: 'bg-blue-500' },
            {
              label: t('pending') || 'Pending',
              value: borrows.filter((b) => b.status === 'pending').length,
              color: 'bg-yellow-500',
            },
            {
              label: t('borrowed') || 'Borrowed',
              value: borrows.filter((b) => b.status === 'borrowed').length,
              color: 'bg-green-500',
            },
          ].map((stat, index) => (
            <motion.div
              key={`stat-card-${stat.label}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <FiInfo className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Borrowed Books Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div key="loading-indicator" className="flex items-center justify-center py-12">
              <FiRefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr>
                      <th key="user-id-header" className="text-left px-6 py-3 text-xs font-medium text-white uppercase tracking-wider bg-blue-600">
                        {t('userIdLabel') || 'User ID'}
                      </th>
                      <th key="username-header" className="text-left px-6 py-3 text-xs font-medium text-white uppercase tracking-wider bg-blue-600">
                        {t('usernameLabel') || 'Username'}
                      </th>
                      <th key="book-header" className="text-left px-6 py-3 text-xs font-medium text-white uppercase tracking-wider bg-blue-600">
                        {t('book') || 'Book'}
                      </th>
                      <th key="status-header" className="text-left px-6 py-3 text-xs font-medium text-white uppercase tracking-wider bg-blue-600">
                        {t('status') || 'Status'}
                      </th>
                      <th key="fine-header" className="text-left px-6 py-3 text-xs font-medium text-white uppercase tracking-wider bg-blue-600">
                        {t('fine') || 'Fine'}
                      </th>
                      <th key="actions-header" className="text-left px-6 py-3 text-xs font-medium text-white uppercase tracking-wider bg-blue-600">
                        {t('actions') || 'Actions'}
                      </th>
                      <th key="details-header" className="text-left px-6 py-3 text-xs font-medium text-white uppercase tracking-wider bg-blue-600">
                        {t('details') || 'Details'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrows.length === 0 ? (
                      <tr key="no-data-row">
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FiBookOpen className="w-12 h-12 text-gray-300" />
                            <p>{t('noBorrowRecords') || "No borrow records found"}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      borrows.map((b) => (
                        <React.Fragment key={`borrow-row-${b._id}`}>
                          <tr
                            key={`borrow-main-${b._id}`}
                            onClick={() => toggleRowDetail(b._id)}
                            className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4">
                              <code className="font-mono text-sm">{b.userId}</code>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium">{b.username}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold truncate max-w-xs">
                                {b.bookTitle}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                key={`status-badge-row-${b._id}`}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  b.status
                                )}`}
                              >
                                {getStatusText(b.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-red-600 text-sm">
                                  ETB {b.fine}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                {b.status === 'pending' && (
                                  <motion.button
                                    key={`review-button-${b._id}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleApproval(b)}
                                    className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded text-xs hover:bg-indigo-700 transition-colors"
                                  >
                                    <FiCheckCircle className="w-3 h-3" />
                                    {t('review') || 'Review'}
                                  </motion.button>
                                )}
                                <motion.button
                                  key={`delete-button-${b._id}`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(b);
                                  }}
                                  className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded text-xs hover:bg-red-700 transition-colors"
                                  title={t('deleteRecord') || 'Delete record'}
                                >
                                  <FiTrash2 className="w-3 h-3" />
                                </motion.button>
                              </div>
                            </td>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                key={`detail-toggle-${b._id}`}
                                onClick={() => toggleRowDetail(b._id)}
                                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
                                aria-label={
                                  expandedRow === b._id ? 'Hide details' : 'Show details'
                                }
                              >
                                {expandedRow === b._id ? (
                                  <FiChevronUp className="w-5 h-5 text-indigo-600" />
                                ) : (
                                  <FiInfo className="w-5 h-5 text-gray-500 hover:text-indigo-600" />
                                )}
                              </button>
                            </td>
                          </tr>
                          {expandedRow === b._id && (
                            <tr key={`detail-row-${b._id}`}>
                              <td colSpan={7} className="p-0">
                                <BorrowDetailCard key={`detail-card-component-${b._id}`} borrow={b} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > limit && (
                <div key="pagination" className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      {t('showing')} <span className="font-medium">{(page - 1) * limit + 1}</span> {t('of')}{' '}
                      <span className="font-medium">
                        {Math.min(page * limit, total)}
                      </span>{' '}
                      {t('of')} <span className="font-medium">{total}</span> {t('results') || 'records'}
                    </div>
                    <div className="flex gap-2">
                      <button
                        key="prev-page-button"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        {t('prev')}
                      </button>
                      <span key="current-page" className="px-3 py-1 bg-indigo-600 text-white rounded-lg">
                        {page}
                      </span>
                      <button
                        key="next-page-button"
                        onClick={() => setPage(page + 1)}
                        disabled={page * limit >= total}
                        className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        {t('next')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modals */}
        <AnimatePresence>
          {showBorrowModal && (
            <Modal key="borrow-modal" onClose={closeAllModals}>
              <h2 className="text-xl font-bold text-gray-800 mb-4"> {t('librarianBorrow') || "Librarian Borrow"}</h2>
              <LibrarianBorrowForm onSuccess={handleBorrowSuccess} />
            </Modal>
          )}

          {showReturnModal && (
            <Modal key="return-modal" onClose={closeAllModals}>
              <h2 className="text-xl font-bold text-gray-800 mb-4">{t('returnBook') || "Return Book"}</h2>
              <p className="text-gray-600 mb-4">{t('manageBorrowingAndReturns')}</p>
              <ReturnForm onSuccess={handleReturnSuccess} />
            </Modal>
          )}

          {showApprovalModal && selectedRequest && (
            <Modal key="approval-modal" onClose={closeAllModals}>
              <h2 className="text-xl font-bold text-gray-800 mb-4">{t('reviewRequest') || "Review Request"}</h2>
              <p className="text-gray-600 mb-4">
                {t('approveRequest')} / {t('rejectRequest')}
              </p>
              <ApprovalForm borrow={selectedRequest} onSuccess={handleApprovalSuccess} />
            </Modal>
          )}

          {showDeleteModal && borrowToDelete && (
            <ConfirmDeleteModal
              key="delete-modal"
              borrow={borrowToDelete}
              onClose={closeAllModals}
              onConfirm={confirmDelete}
            />
          )}

          {toast && <Toast key={`toast-${toast.message}`} toast={toast} />}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}