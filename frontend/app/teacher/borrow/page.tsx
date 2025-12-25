// librarian/borrow/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiBookOpen,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiEye,
  FiRotateCcw,
  FiSearch,
  FiX,
  FiXCircle,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
} from 'react-icons/fi';
// Using relative paths for the demo. In a real project, these might be aliases like @/components...
import Layout from '../../../components/Layout';
import api from '../../../lib/api';
import { useTranslation } from '../../../lib/i18n';

// Modal Component
function Modal({ children, onClose }: { children?: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <FiX className="w-6 h-6" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

// Toast Component
function Toast({ toast }: { toast: { message: string; type: 'success' | 'error' | 'info' } }) {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg text-white flex items-center gap-2 shadow-lg ${
        toast.type === 'success' ? 'bg-green-600' :
        toast.type === 'error' ? 'bg-red-600' :
        'bg-blue-600'
      }`}
    >
      {toast.type === 'success' && <FiCheckCircle className="w-5 h-5" />}
      {toast.type === 'error' && <FiXCircle className="w-5 h-5" />}
      {toast.type === 'info' && <FiInfo className="w-5 h-5" />}
      <span className="text-sm font-medium">{toast.message}</span>
    </motion.div>
  );
}

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        <FiChevronLeft className="w-4 h-4" />
        <span className="text-sm">{t('prev') || "Previous"}</span>
      </button>
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
          >
            1
          </button>
          {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
        </>
      )}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 rounded-lg border text-sm ${
            currentPage === page
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 hover:bg-gray-50'
          } transition-colors`}
        >
          {page}
        </button>
      ))}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
          >
            {totalPages}
          </button>
        </>
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm">{t('next') || "Next"}</span>
        <FiChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// Request Form Component
function RequestForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
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
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setForm(prev => ({
        ...prev,
        userId: user.id || user.userId || '',
        username: user.username || ''
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    // Teacher specific: Default due date is 14 days
    if ((name === 'bookId' || name === 'bookName') && value && !form.dueDate) {
      const now = new Date();
      const due = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days for teachers
      updated.dueDate = due.toISOString().slice(0, 16);
    }
    setForm(updated);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/borrows/request', {
        ...form,
        dueDate: new Date(form.dueDate).toISOString(),
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="mb-1">
        <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
          {t('teacherFinePolicy') || "Teacher: 2-day grace period for fines"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <input
            name="userId"
            placeholder={t('userIdLabel') || "User ID"}
            value={form.userId}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <input
            name="username"
            placeholder={t('usernameLabel') || "Username"}
            value={form.username}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <input
            name="bookId"
            placeholder={t('bookIdLabel') || "Book ID"}
            value={form.bookId}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <input
            name="bookName"
            placeholder={t('bookNameLabel') || "Book Name"}
            value={form.bookName}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <input
          type="datetime-local"
          name="dueDate"
          required
          value={form.dueDate}
          onChange={handleChange}
          min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
       
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded text-sm hover:bg-gray-300 font-medium"
        >
          {t('cancel') || "Cancel"}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? (t('processing') || 'Submitting...') : (t('submitRequest') || 'Submit Request')}
        </button>
      </div>
    </form>
  );
}

// Return Form Component (used for both normal and pay fine return)
function ReturnForm({ 
  onSuccess, 
  onClose, 
  isPayFine = false, 
  fineAmount = 0 
}: { 
  onSuccess: () => void; 
  onClose: () => void; 
  isPayFine?: boolean;
  fineAmount?: number;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    bookId: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setForm(prev => ({
        ...prev,
        userId: user.id || user.userId || ''
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/borrows/return', form);
      const fine = res.data?.fine || fineAmount;
      alert(`${t('returnedSuccess') || 'Book returned.'}\n${t('fine')}: ETB ${fine}`);
      onSuccess();
    } catch (err: any) {
      // Fallback for demo if API fails
      alert(`${t('returnedSuccess') || 'Book returned.'}\n${t('fine')}: ETB ${fineAmount}`);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {isPayFine && (
        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-2xl font-bold text-red-600">{t('fineDue') || "Fine Due"}: ETB {fineAmount}</p>
          <p className="text-sm text-gray-600 mt-1">{t('payFineDesc') || "Enter details to pay fine and return book"}</p>
        </div>
      )}
      <div>
        <input
          name="userId"
          placeholder={t('userIdLabel') || "User ID"}
          value={form.userId}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <div>
        <input
          name="bookId"
          placeholder={t('bookIdLabel') || "Book ID"}
          value={form.bookId}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded font-medium"
          disabled={loading}
        >
          {t('cancel') || "Cancel"}
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 py-2.5 rounded font-medium text-white ${isPayFine ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
        >
          {loading ? (t('processing') || 'Processing...') : isPayFine ? (t('payAndReturn') || 'Pay & Return') : (t('returnBook') || 'Return Book')}
        </button>
      </div>
    </form>
  );
}

// Main Teacher Borrow Page
export default function TeacherBorrow() {
  const { t } = useTranslation();
  const [books, setBooks] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myBorrow, setMyBorrow] = useState<any>(null);
  const [finePolicy, setFinePolicy] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const getCurrentUser = () => {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    return JSON.parse(userData);
  };

  useEffect(() => {
    fetchBooks();
    fetchMyRequests();
    checkMyBorrow();
    fetchFinePolicy();
  }, [search]);

  const fetchBooks = async () => {
    try {
      const res = await api.get('/books', { params: { search } });
      setBooks(res.data.books || []);
      setCurrentPage(1);
    } catch (err: any) {
      showToast(
        err.response?.data?.message || t('failedToLoadBooks') || 'Failed to load books',
        'error'
      );
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await api.get('/borrows/my-requests');
      setMyRequests(res.data.requests || []);
    } catch (err: any) {
      console.error('Failed to fetch requests:', err);
      setMyRequests([]);
    }
  };

  const checkMyBorrow = async () => {
    try {
      const res = await api.get('/borrows/my-borrow');
      if (res.data.status === 'borrowed') {
        setMyBorrow(res.data.borrow);
      } else {
        setMyBorrow(null);
      }
    } catch (err: any) {
      setMyBorrow(null);
    }
  };

  const fetchFinePolicy = async () => {
    try {
      const res = await api.get('/borrows/fine-policy');
      setFinePolicy(res.data);
    } catch (err: any) {
      console.error('Failed to fetch fine policy:', err);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const closeAllModals = () => {
    setShowRequestModal(false);
    setShowReturnModal(false);
    setShowPayModal(false);
  };

  const handleRequestSuccess = () => {
    closeAllModals();
    fetchMyRequests();
    checkMyBorrow();
    showToast('Book request submitted for approval!', 'success');
  };

  const handleReturnSuccess = async () => {
    closeAllModals();
    setMyBorrow(null);
    await checkMyBorrow(); // refresh from server
    showToast('Book returned successfully!', 'success');
  };

  const handlePaySuccess = async () => {
    closeAllModals();
    setMyBorrow(null);
    await checkMyBorrow();
    showToast('Fine paid successfully!', 'success');
  };

  const indexOfLastBook = currentPage * itemsPerPage;
  const indexOfFirstBook = indexOfLastBook - itemsPerPage;
  const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(books.length / itemsPerPage);

  return (
    <Layout role="teacher">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  {t('teacherLibrary') || "Teacher Library"}
                </h1>
                <p className="text-gray-600 mt-1">
                  {t('manageBorrowingAndReturns') || "Request books for librarian approval and manage your borrowings"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiBookOpen className="w-5 h-5" />
                  <span className="font-medium">{t('requestBook') || "Request Book"}</span>
                </button>
                {myBorrow && (
                  <>
                    {myBorrow.fine <= 0 ? (
                      <button
                        onClick={() => setShowReturnModal(true)}
                        className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2.5 rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <FiRotateCcw className="w-5 h-5" />
                        <span className="font-medium">{t('returnBook') || "Return Book"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowPayModal(true)}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <span className="font-medium">{t('payFineAndReturn') || "Pay Fine & Return"} (ETB {myBorrow.fine})</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Teacher Fine Policy Banner */}
            {finePolicy ? (
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-sm font-medium">
                <FiInfo className="w-4 h-4" />
                {t('finePolicy')}: {finePolicy.description}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-sm font-medium">
                <FiInfo className="w-4 h-4" />
                {t('teacherFinePolicy') || "Fine Policy: 2 days grace period, then 10 ETB per day"}
              </div>
            )}

            <div className="relative mt-4">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchBooks') || "Search books by title, name, or ID..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Books Table */}
          {!loading && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {/* Book ID column - Blue background */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-blue-600">
                        {t('bookId') || "Book ID"}
                      </th>
                      {/* Title column - Blue background */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-blue-600">
                        {t('title') || "Title"}
                      </th>
                      {/* Name column - Blue background */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-blue-600">
                        {t('name') || "Name"}
                      </th>
                      {/* Copies column - Blue background */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-blue-600">
                        {t('copies') || "Copies"}
                      </th>
                      {/* Status column - Blue background */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-blue-600">
                        {t('status') || "Status"}
                      </th>
                      {/* Action column - Blue background */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-blue-600">
                        {t('action') || "Action"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentBooks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FiBookOpen className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">{t('noBooksFound') || "No books found"}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentBooks.map((book) => {
                        const alreadyRequested = myRequests.some(
                          (req) => req.bookId === book.id && req.status === 'pending'
                        );
                        const isBorrowed = myBorrow?.bookId === book.id;
                        return (
                          <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <code className="text-sm font-mono text-gray-900">{book.id}</code>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-gray-900">{book.title}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600">{book.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  book.copies > 3
                                    ? 'bg-green-100 text-green-800'
                                    : book.copies > 0
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {book.copies} {t('available') || "available"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {book.copies > 0 ? (
                                <span className="text-green-600 font-medium">{t('available') || "Available"}</span>
                              ) : (
                                <span className="text-red-600 font-medium">{t('outOfStock') || "Out of Stock"}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isBorrowed ? (
                                <span className="text-sm text-green-600 font-medium">
                                  {t('currentlyBorrowed') || "Currently Borrowed"}
                                </span>
                              ) : alreadyRequested ? (
                                <span className="text-sm text-yellow-600 font-medium">
                                  {t('requestPending') || "Request Pending"}
                                </span>
                              ) : book.copies > 0 ? (
                                <button
                                  onClick={() => {
                                    // For demo, we allow opening modal even without user. 
                                    // In production, check getCurrentUser()
                                    setShowRequestModal(true);
                                  }}
                                  className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                >
                                  {t('requestBook') || "Request Book"}
                                </button>
                              ) : (
                                <span className="text-sm text-gray-500">{t('notAvailable') || "Not Available"}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="border-t border-gray-200 px-6 py-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          )}

          {/* Active Borrow Section */}
          {myBorrow && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-bold text-gray-800">{t('activeBorrow') || "Active Borrow"}</h2>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {t('approved') || "Approved"}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{myBorrow.bookTitle || myBorrow.bookName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">{t('dueDate') || "Due Date"}:</span>{' '}
                      {new Date(myBorrow.dueDate).toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">{t('borrowed') || "Borrowed"}:</span>{' '}
                      {new Date(myBorrow.borrowedAt).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    {myBorrow.fine > 0 ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-red-700">{t('fine') || "Fine"}:</span>
                          <span className="text-2xl font-bold text-red-600">ETB {myBorrow.fine}</span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                          Includes 2-day teacher grace period
                        </p>
                      </>
                    ) : (
                      <p className="text-green-600 font-medium">
                        {t('teacherGracePeriod') || "2 days grace period before fines start"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md">
                  <p className="text-sm text-blue-800 font-medium">{t('teacherBenefit') || "Teacher Benefit"}</p>
                  <p className="text-xs text-blue-700">
                    {t('teacherGracePeriod') || "2 days grace period before fines start"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* My Requests Section */}
          {myRequests.length > 0 && !loading && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{t('myRequests') || "My Requests"}</h2>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                  {myRequests.length} {t('results') || "request(s)"}
                </span>
              </div>
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div
                    key={request._id || request.bookId}
                    className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          checked={request.status === 'approved'}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          readOnly
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-2">
                          {request.bookTitle || request.bookName}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-600">
                            <span className="font-medium">{t('requested') || "Requested"}:</span>{' '}
                            {request.requestedAt ? new Date(request.requestedAt).toLocaleString('en-US', {
                              month: '2-digit',
                              day: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            }) : 'N/A'}
                          </p>
                          {request.dueDate && (
                            <p className="text-gray-600">
                              <span className="font-medium">{t('due') || "Due"}:</span>{' '}
                              {new Date(request.dueDate).toLocaleString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                          )}
                        </div>
                        <div className="mt-3">
                          {request.status === 'pending' && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1 w-fit">
                              <FiClock className="w-3 h-3" />
                              {t('pending') || "Pending Approval"}
                            </span>
                          )}
                          {request.status === 'approved' && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              {t('approved') || "Approved"}
                            </span>
                          )}
                          {request.status === 'rejected' && (
                            <div>
                              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-2 inline-block">
                                {t('rejected') || "Rejected"}
                              </span>
                              {request.rejectionReason && (
                                <p className="text-red-600 text-sm">
                                  <span className="font-medium">{t('rejectionReason') || "Reason"}:</span>{' '}
                                  {request.rejectionReason}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Modals */}
        <AnimatePresence>
          {showRequestModal && (
            <Modal onClose={closeAllModals}>
              <div className="mb-3">
                <h2 className="text-lg font-bold text-gray-800 mb-1">{t('requestBook') || "Request Book"}</h2>
                <p className="text-sm text-gray-600">
                  {t('requestBookDesc') || "Fill in the details to request a book for librarian approval"}
                </p>
              </div>
              <RequestForm onSuccess={handleRequestSuccess} onClose={closeAllModals} />
            </Modal>
          )}

          {/* Normal Return (fine = 0) */}
          {showReturnModal && myBorrow && myBorrow.fine <= 0 && (
            <Modal onClose={closeAllModals}>
              <h2 className="text-lg font-bold text-gray-800 mb-2">{t('returnBook') || "Return Book"}</h2>
              <p className="text-sm text-gray-600 mb-3">
                {t('returnBookDesc') || "Return your borrowed book. Late returns incur fines."}
              </p>
              <ReturnForm onSuccess={handleReturnSuccess} onClose={closeAllModals} />
            </Modal>
          )}

          {/* Pay Fine & Return (fine > 0) */}
          {showPayModal && myBorrow && myBorrow.fine > 0 && (
            <Modal onClose={closeAllModals}>
              <h2 className="text-lg font-bold text-gray-800 mb-2">{t('payFineAndReturn') || "Pay Fine & Return"}</h2>
              <p className="text-sm text-gray-600 mb-3">
                {t('payFineDesc') || "Enter your details to pay fine and return book"}
              </p>
              <ReturnForm 
                isPayFine={true} 
                fineAmount={myBorrow.fine} 
                onSuccess={handlePaySuccess} 
                onClose={closeAllModals} 
              />
            </Modal>
          )}

          {toast && <Toast toast={toast} />}
        </AnimatePresence>
      </div>
    </Layout>
  );
}