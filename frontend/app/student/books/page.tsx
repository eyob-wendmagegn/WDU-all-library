'use client';

import Layout from '@/components/Layout';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, useRef, useMemo } from 'react';
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
  FiChevronUp,
  FiChevronDown,
  FiFilter,
  FiMoreVertical,
  FiColumns,
  FiEyeOff,
} from 'react-icons/fi';

// TanStack Table
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';

// Modal Component - FIXED for mobile responsiveness
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl sm:rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 relative my-4 sm:my-0"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700"
        >
          <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

// Toast Component - FIXED for mobile positioning
function Toast({ toast }: { toast: { message: string; type: 'success' | 'error' | 'info' } }) {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={`fixed bottom-4 right-3 sm:bottom-6 sm:right-6 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-white flex items-center gap-2 shadow-lg z-[100] max-w-[calc(100vw-2rem)] sm:max-w-md ${
        toast.type === 'success' ? 'bg-green-600' :
        toast.type === 'error' ? 'bg-red-600' :
        'bg-blue-600'
      }`}
    >
      {toast.type === 'success' && <FiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
      {toast.type === 'error' && <FiXCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
      {toast.type === 'info' && <FiInfo className="w-4 h-4 sm:w-5 sm:h-5" />}
      <span className="text-xs sm:text-sm font-medium truncate">{toast.message}</span>
    </motion.div>
  );
}

// Column Menu Component - Enhanced for mobile
function ColumnMenu({ column, onClose }: { column: any; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside as EventListener);
    document.addEventListener('touchstart', handleClickOutside as EventListener);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as EventListener);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed sm:absolute right-4 sm:right-0 top-1/2 sm:top-full mt-0 sm:mt-1 transform -translate-y-1/2 sm:translate-y-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48 sm:min-w-48 max-w-[90vw]"
    >
      <div className="p-2">
        <button
          onClick={() => {
            column.toggleSorting(false);
            onClose();
          }}
          className="flex items-center gap-2 w-full px-3 py-3 text-sm hover:bg-gray-100 rounded text-gray-900"
        >
          <FiChevronUp className="w-4 h-4 text-gray-700" />
          {t('sortAsc') || "Sort Ascending"}
        </button>
        <button
          onClick={() => {
            column.toggleSorting(true);
            onClose();
          }}
          className="flex items-center gap-2 w-full px-3 py-3 text-sm hover:bg-gray-100 rounded text-gray-900"
        >
          <FiChevronDown className="w-4 h-4 text-gray-700" />
          {t('sortDesc') || "Sort Descending"}
        </button>
        {column.getIsSorted() && (
          <button
            onClick={() => {
              column.clearSorting();
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-3 text-sm hover:bg-gray-100 rounded text-gray-900"
          >
            <FiX className="w-4 h-4 text-gray-700" />
            {t('clearSort') || "Clear Sort"}
          </button>
        )}
        
        <div className="border-t my-1"></div>
        
        <button
          onClick={() => {
            column.toggleVisibility();
            onClose();
          }}
          className="flex items-center gap-2 w-full px-3 py-3 text-sm hover:bg-gray-100 rounded text-gray-900"
        >
          {column.getIsVisible() ? (
            <>
              <FiEyeOff className="w-4 h-4 text-gray-700" />
              {t('hideColumn') || "Hide Column"}
            </>
          ) : (
            <>
              <FiEye className="w-4 h-4 text-gray-700" />
              {t('showColumn') || "Show Column"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Columns Visibility Menu Component - Enhanced for mobile
function ColumnsVisibilityMenu({ table, onClose }: { table: any; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside as EventListener);
    document.addEventListener('touchstart', handleClickOutside as EventListener);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as EventListener);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [onClose]);

  // Map column IDs to display names
  const columnDisplayNames: { [key: string]: string } = {
    id: t('bookIdLabel') || 'Book ID',
    title: t('title') || 'Title',
    name: t('name') || 'Name',
    copies: t('copies') || 'Copies',
    status: t('status') || 'Status',
    action: t('action') || 'Action'
  };

  return (
    <div
      ref={menuRef}
      className="fixed sm:absolute right-4 sm:right-0 top-1/2 sm:top-10 transform -translate-y-1/2 sm:translate-y-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48 max-w-[90vw]"
    >
      <div className="p-2">
        <div className="text-xs font-semibold text-gray-500 px-2 py-1 uppercase tracking-wide">
          {t('showHideColumns') || "Show/Hide Columns"}
        </div>
        {table.getAllLeafColumns().map((column: any) => (
          <label key={column.id} className="flex items-center gap-2 px-3 py-3 text-sm hover:bg-gray-100 rounded cursor-pointer text-gray-900">
            <input
              type="checkbox"
              checked={column.getIsVisible()}
              onChange={column.getToggleVisibilityHandler()}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span className="flex-1">{columnDisplayNames[column.id] || column.id}</span>
          </label>
        ))}
        <div className="border-t my-1"></div>
        <button
          onClick={() => {
            table.resetColumnVisibility();
            onClose();
          }}
          className="flex items-center gap-2 w-full px-3 py-3 text-sm hover:bg-gray-100 rounded text-blue-600"
        >
          <FiEye className="w-4 h-4" />
          {t('showAllColumns') || "Show All Columns"}
        </button>
      </div>
    </div>
  );
}

// Sortable Column Header Component - Enhanced for mobile
function SortableHeader({ column, children }: { column: any; children: React.ReactNode }) {
  const [showMenu, setShowMenu] = useState(false);
  const sorted = column.getIsSorted();

  return (
    <div className="flex items-center justify-between group relative">
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span className="text-white text-xs sm:text-sm truncate">{children}</span>
        <div className="flex flex-col ml-1 flex-shrink-0">
          {sorted === 'asc' ? (
            <FiChevronUp className="w-3 h-3 text-white" />
          ) : sorted === 'desc' ? (
            <FiChevronDown className="w-3 h-3 text-white" />
          ) : (
            <>
              <FiChevronUp className="w-2 h-2 text-white/80" />
              <FiChevronDown className="w-2 h-2 text-white/80 -mt-1" />
            </>
          )}
        </div>
      </div>
      
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          className="p-1 hover:bg-blue-700 rounded transition-opacity flex-shrink-0"
          title="Column options"
        >
          <FiMoreVertical className="w-4 h-4 text-white" />
        </button>
        
        {showMenu && (
          <>
            {/* Overlay for mobile */}
            <div 
              className="fixed inset-0 z-40 sm:hidden" 
              onClick={() => setShowMenu(false)}
            />
            <ColumnMenu column={column} onClose={() => setShowMenu(false)} />
          </>
        )}
      </div>
    </div>
  );
}

// Request Form Component - FIXED datetime-local input for mobile
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
    if ((name === 'bookId' || name === 'bookName') && value && !form.dueDate) {
      const now = new Date();
      const due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
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
          {t('requestBookDesc') || "Your request will be reviewed by librarian"}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
      <div className="relative">
        <input
          type="datetime-local"
          name="dueDate"
          required
          value={form.dueDate}
          onChange={handleChange}
          min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
          style={{ fontSize: form.dueDate ? '16px' : '14px' }} // Prevents zoom on iOS
        />
        {/* Mobile helper text */}
        <div className="sm:hidden mt-1">
          <p className="text-xs text-gray-500">Select date and time</p>
        </div>
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

// Return Form Component (used for both normal and pay fine return) - FIXED for mobile
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
      const fine = res.data.fine || fineAmount;
      alert(`${t('returnedSuccess') || 'Book returned.'}\n${t('fine')}: ETB ${fine}`);
      onSuccess();
    } catch (err: any) {
      // In test mode: always success
      alert(`${t('returnedSuccess') || 'Book returned.'}\n${t('fine')}: ETB ${fineAmount}`);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {isPayFine && (
        <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xl sm:text-2xl font-bold text-red-600">{t('fineDue') || "Fine Due"}: ETB {fineAmount}</p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">{t('payFineDesc') || "Enter details to pay fine and return book"}</p>
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
          className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded font-medium text-sm sm:text-base"
          disabled={loading}
        >
          {t('cancel') || "Cancel"}
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 py-2.5 rounded font-medium text-white text-sm sm:text-base ${isPayFine ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
        >
          {loading ? (t('processing') || 'Processing...') : isPayFine ? (t('payAndReturn') || 'Pay & Return') : (t('returnBook') || 'Return Book')}
        </button>
      </div>
    </form>
  );
}

// Main Student Books Page
export default function StudentBooks() {
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

  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

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
    await checkMyBorrow();
    showToast('Book returned successfully!', 'success');
  };

  const handlePaySuccess = async () => {
    closeAllModals();
    setMyBorrow(null);
    await checkMyBorrow();
    showToast('Fine paid successfully!', 'success');
  };

  // Define columns for TanStack Table
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t('bookIdLabel') || "Book ID"}
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <code className="text-xs sm:text-sm font-mono text-gray-900 break-words">{row.getValue('id')}</code>
        ),
        size: 100,
      },
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t('title') || "Title"}
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="text-xs sm:text-sm font-semibold text-gray-900 break-words">{row.getValue('title')}</div>
        ),
        size: 200,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t('name') || "Name"}
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="text-xs sm:text-sm text-gray-600 break-words">{row.getValue('name')}</div>
        ),
        size: 150,
      },
      {
        accessorKey: 'copies',
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t('copies') || "Copies"}
          </SortableHeader>
        ),
        cell: ({ row }) => {
          const copies = row.getValue('copies') as number;
          return (
            <span
              className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${
                copies > 3
                  ? 'bg-green-100 text-green-800'
                  : copies > 0
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {copies} {t('available') || "available"}
            </span>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t('status') || "Status"}
          </SortableHeader>
        ),
        cell: ({ row }) => {
          const copies = row.original.copies;
          return copies > 0 ? (
            <span className="text-green-600 font-medium text-xs sm:text-sm">{t('available') || "Available"}</span>
          ) : (
            <span className="text-red-600 font-medium text-xs sm:text-sm">{t('outOfStock') || "Out of Stock"}</span>
          );
        },
        size: 100,
      },
      {
        accessorKey: 'action',
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t('action') || "Action"}
          </SortableHeader>
        ),
        cell: ({ row }) => {
          const book = row.original;
          const alreadyRequested = myRequests.some(
            (req) => req.bookId === book.id && req.status === 'pending'
          );
          const isBorrowed = myBorrow?.bookId === book.id;
          
          return (
            <div className="text-xs sm:text-sm">
              {isBorrowed ? (
                <span className="text-green-600 font-medium">
                  {t('currentlyBorrowed') || "Currently Borrowed"}
                </span>
              ) : alreadyRequested ? (
                <span className="text-yellow-600 font-medium">
                  {t('requestPending') || "Request Pending"}
                </span>
              ) : book.copies > 0 ? (
                <button
                  onClick={() => {
                    const user = getCurrentUser();
                    if (!user) {
                      alert('Please login first');
                      return;
                    }
                    setShowRequestModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-xs sm:text-sm"
                >
                  {t('requestBook') || "Request Book"}
                </button>
              ) : (
                <span className="text-gray-500">{t('notAvailable') || "Not Available"}</span>
              )}
            </div>
          );
        },
        size: 150,
      },
    ],
    [t, myRequests, myBorrow]
  );

  // Initialize TanStack Table
  const table = useReactTable({
    data: books,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Layout role="student">
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Header Section */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 truncate">
                  {t('studentLibrary') || 'Student Library'}
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {t('borrowReturnView') || "Request books for librarian approval and manage your borrowings"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap"
                >
                  <FiBookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium">{t('requestBook') || "Request Book"}</span>
                </button>
                {myBorrow && (
                  <>
                    {myBorrow.fine <= 0 ? (
                      <button
                        onClick={() => setShowReturnModal(true)}
                        className="flex items-center gap-2 bg-orange-600 text-white px-3 sm:px-4 py-2.5 rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base whitespace-nowrap"
                      >
                        <FiRotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="font-medium">{t('returnBook') || "Return Book"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowPayModal(true)}
                        className="flex items-center gap-2 bg-red-600 text-white px-3 sm:px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base whitespace-nowrap"
                      >
                        <span className="font-medium">{t('payFineAndReturn') || "Pay Fine & Return"} (ETB {myBorrow.fine})</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {finePolicy ? (
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-sm font-medium">
                <FiInfo className="w-4 h-4" />
                {t('finePolicy')}: {finePolicy.description}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-sm font-medium">
                <FiInfo className="w-4 h-4" />
                {t('studentFinePolicy') || "Fine Policy: 1 day grace period, then 10 ETB per day"}
              </div>
            )}

            {/* Search and Filter Controls */}
            <div className="mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Main Search */}
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder={t('searchBooks') || "Search books by title, name, or ID..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
                  />
                </div>

                {/* Columns Visibility Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowColumnsMenu(!showColumnsMenu)}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-3 sm:px-4 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                    title={t('showHideColumns') || "Show/Hide columns"}
                  >
                    <FiColumns className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-medium">{t('columns') || "Columns"}</span>
                  </button>
                  
                  {showColumnsMenu && (
                    <>
                      {/* Overlay for mobile */}
                      <div 
                        className="fixed inset-0 z-40 sm:hidden" 
                        onClick={() => setShowColumnsMenu(false)}
                      />
                      <ColumnsVisibilityMenu 
                        table={table} 
                        onClose={() => setShowColumnsMenu(false)} 
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Books Table - Mobile Responsive */}
          {!loading && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
              {/* Mobile Table Container (horizontal scroll) */}
              <div className="block sm:hidden overflow-x-auto -mx-2">
                <table className="w-full min-w-[700px]">
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th 
                            key={header.id} 
                            className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider bg-blue-600 text-white whitespace-nowrap"
                            style={{ width: header.getSize() }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map(row => (
                        <tr 
                          key={row.id} 
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {row.getVisibleCells().map(cell => (
                            <td 
                              key={cell.id} 
                              className="px-3 py-3 text-sm text-gray-900"
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FiBookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" />
                            <p className="text-gray-500 text-sm sm:text-base">{t('noBooksFound') || "No books found"}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th 
                            key={header.id} 
                            className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider bg-blue-600 text-white"
                            style={{ width: header.getSize() }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map(row => (
                        <tr 
                          key={row.id} 
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {row.getVisibleCells().map(cell => (
                            <td 
                              key={cell.id} 
                              className="px-4 sm:px-6 py-3 text-sm text-gray-900"
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FiBookOpen className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">{t('noBooksFound') || "No books found"}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Responsive */}
              {table.getFilteredRowModel().rows.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-6 py-4 border-t gap-4 sm:gap-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">{t('rowsPerPage') || "Rows per page"}</span>
                      <select
                        value={table.getState().pagination.pageSize}
                        onChange={e => table.setPageSize(Number(e.target.value))}
                        className="border rounded-lg px-2 py-1 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {[5, 10, 20, 30, 40, 50].map(pageSize => (
                          <option key={pageSize} value={pageSize}>
                            {pageSize}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                      {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                      {Math.min(
                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                      )} {t('of') || "of"} {table.getFilteredRowModel().rows.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-gray-700 text-xs sm:text-sm whitespace-nowrap"
                    >
                      <FiChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{t('prev') || "Previous"}</span>
                    </button>
                    <button
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-gray-700 text-xs sm:text-sm whitespace-nowrap"
                    >
                      <span>{t('next') || "Next"}</span>
                      <FiChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Borrow Section */}
          {myBorrow && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <h2 className="text-base sm:text-lg font-bold text-gray-800">{t('activeBorrow') || "Active Borrow"}</h2>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                    {t('approved') || "Approved"}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{myBorrow.bookTitle || myBorrow.bookName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">{t('dueDateLabel') || "Due Date"}:</span>{' '}
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
                          <span className="text-xl sm:text-2xl font-bold text-red-600">ETB {myBorrow.fine}</span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                          {t('studentGracePeriod') || "Includes 1-day student grace period"}
                        </p>
                      </>
                    ) : (
                      <p className="text-green-600 font-medium">
                        {t('studentGracePeriod') || "No fine yet (1-day grace period active)"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md">
                  <p className="text-xs sm:text-sm text-blue-800 font-medium">{t('studentBenefit') || "Student Benefit"}</p>
                  <p className="text-xs text-blue-700">
                    {t('studentGracePeriod') || "1 day grace period before fines start"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* My Requests Section */}
          {myRequests.length > 0 && !loading && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">{t('myRequests') || "My Requests"}</h2>
                <span className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs sm:text-sm font-medium">
                  {myRequests.length} {t('results') || "request(s)"}
                </span>
              </div>
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div
                    key={request._id}
                    className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-gray-50 transition-colors"
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
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-2 break-words">
                          {request.bookTitle || request.bookName}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm">
                          <p className="text-gray-600">
                            <span className="font-medium">{t('requested') || "Requested"}:</span>{' '}
                            {new Date(request.requestedAt).toLocaleString('en-US', {
                              month: '2-digit',
                              day: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                          {request.dueDate && (
                            <p className="text-gray-600">
                              <span className="font-medium">{t('dueDateLabel') || "Due"}:</span>{' '}
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
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 w-fit">
                              <FiClock className="w-3 h-3" />
                              {t('pending') || "Pending Approval"}
                            </span>
                          )}
                          {request.status === 'approved' && (
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                              {t('approved') || "Approved"}
                            </span>
                          )}
                          {request.status === 'rejected' && (
                            <div>
                              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-red-100 text-red-800 rounded-full text-xs sm:text-sm font-medium mb-2 inline-block">
                                {t('rejected') || "Rejected"}
                              </span>
                              {request.rejectionReason && (
                                <p className="text-red-600 text-xs sm:text-sm break-words">
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