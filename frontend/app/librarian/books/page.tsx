// librarian/books/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import api, { setAuthToken } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { 
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiX, FiCheckCircle, 
  FiChevronUp, FiChevronDown, FiColumns, FiFilter,
  FiInfo, FiCalendar, FiUser, FiClock, FiBook,
  FiMoreVertical, FiAlertTriangle
} from 'react-icons/fi';

interface Book {
  id: string;
  name: string;
  title: string;
  category: string;
  publisher: string;
  isbn: string;
  copies: number;
  addedBy?: string;
  addedByUsername?: string;
  updatedBy?: string;
  updatedByUsername?: string;
  createdAt?: string;
  updatedAt?: string;
}

const emptyBook: Book = { id: '', name: '', title: '', category: '', publisher: '', isbn: '', copies: 0 };

// Column Menu Component
function ColumnMenu({ 
  columnKey, 
  columnLabel, 
  isVisible, 
  onToggleColumn, 
  onSortAsc, 
  onSortDesc,
  sortDirection 
}: { 
  columnKey: string; 
  columnLabel: string;
  isVisible: boolean;
  onToggleColumn: (key: string) => void;
  onSortAsc: (key: string) => void;
  onSortDesc: (key: string) => void;
  sortDirection: 'asc' | 'desc' | null;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-white/20 rounded transition-colors"
        title={`${columnLabel} options`}
      >
        <FiMoreVertical className="w-4 h-4 text-white" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden"
            >
              <div className="py-1">
                {/* Sort Ascending */}
                <button
                  onClick={() => {
                    onSortAsc(columnKey);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <div className="flex items-center gap-2">
                    <FiChevronUp className={`w-4 h-4 ${sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={sortDirection === 'asc' ? 'text-blue-600 font-medium' : ''}>
                      {t('sortAscending') || 'Sort A → Z'}
                    </span>
                  </div>
                  {sortDirection === 'asc' && (
                    <span className="ml-auto text-xs text-blue-600 font-medium">✓</span>
                  )}
                </button>

                {/* Sort Descending */}
                <button
                  onClick={() => {
                    onSortDesc(columnKey);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <div className="flex items-center gap-2">
                    <FiChevronDown className={`w-4 h-4 ${sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={sortDirection === 'desc' ? 'text-blue-600 font-medium' : ''}>
                      {t('sortDescending') || 'Sort Z → A'}
                    </span>
                  </div>
                  {sortDirection === 'desc' && (
                    <span className="ml-auto text-xs text-blue-600 font-medium">✓</span>
                  )}
                </button>

                <div className="border-t border-gray-100 my-1"></div>

                {/* Hide/Show Column */}
                <button
                  onClick={() => {
                    onToggleColumn(columnKey);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                >
                  <span>{isVisible ? t('hideColumn') || 'Hide Column' : t('showColumn') || 'Show Column'}</span>
                  <span className={`text-xs px-2 py-1 rounded ${isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {isVisible ? t('visible') || 'Visible' : t('hidden') || 'Hidden'}
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Reusable Components ---

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-4 sm:p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <FiX className="w-5 h-5" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  bookName 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  bookName: string;
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 sm:p-6 relative mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full mb-4">
                <FiAlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
              </div>

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                {t('deleteConfirmTitle') || 'Delete Book'}
              </h3>

              {/* Description */}
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                {t('deleteConfirm') || 'Are you sure you want to delete this book?'}
              </p>

              {/* Book Name Warning */}
              {bookName && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-6">
                  <p className="text-sm font-medium text-red-800 break-words">
                    "{bookName}"
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {t('deleteWarning') || 'This action cannot be undone.'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 sm:py-3 border border-gray-300 text-gray-700 text-sm sm:text-base font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-2.5 sm:py-3 bg-red-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('delete') || 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DetailModal({ book, onClose }: { book: Book; onClose: () => void }) {
  const { t } = useTranslation();
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <FiBook className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">{book.title}</h2>
                <p className="text-xs text-gray-500 truncate">ID: {book.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Basic Info Grid - More Compact */}
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">{t('name')}</p>
                <p className="text-sm text-gray-900 break-words">{book.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">{t('category')}</p>
                <p className="text-sm text-gray-900 break-words">{book.category}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">Publisher</p>
                <p className="text-sm text-gray-900 break-words">{book.publisher || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">ISBN</p>
                <p className="text-sm text-gray-900 break-words">{book.isbn || '-'}</p>
              </div>
            </div>
            
            {/* Copies - Full width */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">{t('copies')}</p>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  book.copies > 5 ? 'bg-green-50 text-green-700' : 
                  book.copies > 0 ? 'bg-orange-50 text-orange-700' : 
                  'bg-red-50 text-red-700'
                }`}>
                  {book.copies} available
                </span>
              </div>
            </div>
          </div>

          {/* Metadata Section - More Compact */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FiInfo className="w-4 h-4 flex-shrink-0" />
              <span>Book Metadata</span>
            </h3>
            
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <FiCalendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500">Added On</p>
                  <p className="text-sm text-gray-900 break-words">{formatDate(book.createdAt)}</p>
                </div>
              </div>
              
              {book.addedBy && (
                <div className="flex items-start gap-3">
                  <FiUser className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500">Added By</p>
                    <div className="text-sm text-gray-900">
                      {book.addedByUsername ? (
                        <div className="flex flex-col">
                          <span className="break-words">{book.addedByUsername}</span>
                          <span className="text-xs text-gray-500 break-words">ID: {book.addedBy}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-900 break-words">ID: {book.addedBy}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {book.updatedAt && (
                <>
                  <div className="flex items-start gap-3">
                    <FiClock className="w-4 h-4 text-gray-400 mt=0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500">Last Updated</p>
                      <p className="text-sm text-gray-900 break-words">{formatDate(book.updatedAt)}</p>
                    </div>
                  </div>
                  
                  {book.updatedBy && (
                    <div className="flex items-start gap-3">
                      <FiUser className="w-4 h-4 text-gray-400 mt=0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500">Updated By</p>
                        <div className="text-sm text-gray-900">
                          {book.updatedByUsername ? (
                            <div className="flex flex-col">
                              <span className="break-words">{book.updatedByUsername}</span>
                              <span className="text-xs text-gray-500 break-words">ID: {book.updatedBy}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-900 break-words">ID: {book.updatedBy}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Toast({ toast }: { toast: { message: string; type: 'success' | 'error' } }) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 px-4 py-3 rounded-lg text-white flex items-center gap-3 text-sm shadow-xl z-50 max-w-xs sm:max-w-sm ${
        toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium truncate">{toast.message}</span>
    </motion.div>
  );
}

function BookForm({
  form,
  setForm,
  onSubmit,
  updating,
  isEdit,
}: {
  form: Book | null;
  setForm: React.Dispatch<React.SetStateAction<Book | null>>;
  onSubmit: () => void;
  updating: boolean;
  isEdit: boolean;
}) {
  const { t } = useTranslation();

  if (!form) return <p className="text-center text-gray-500 py-4">{t('loading')}...</p>;

  const fields: (keyof Book)[] = isEdit
    ? ['name', 'title', 'category', 'publisher', 'isbn']
    : ['id', 'name', 'title', 'category', 'publisher', 'isbn'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const key = name as keyof Book;
    
    setForm(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [key]: key === 'copies' ? +value || 0 : value,
      };
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {isEdit && (
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('id')}</label>
            <input readOnly value={form.id} className="w-full border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-3 py-2 text-sm" />
          </div>
        )}
        {fields.map((f) => (
          <div key={`${f}-${isEdit ? 'edit' : 'add'}`} className={f === 'title' ? 'sm:col-span-2' : ''}>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">{t(f)}</label>
            <input
              required={f !== 'publisher' && f !== 'isbn'}
              name={f}
              value={form[f] || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder={`Enter ${t(f)}`}
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">{t('copies')}</label>
          <input
            required
            type="number"
            name="copies"
            value={form.copies}
            onChange={handleChange}
            min="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>
      
      <div className="pt-4 flex justify-end gap-3">
        <button
          type="submit"
          disabled={updating}
          className="bg-indigo-600 text-white px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70 flex items-center gap-2"
        >
          {updating ? (
             <>
               <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
               {t('saving')}...
             </>
          ) : (
            isEdit ? t('updateBook') : t('addBook')
          )}
        </button>
      </div>
    </form>
  );
}

// --- Main Page Component ---

export default function LibrarianBooks() {
  const { t } = useTranslation();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Modal & Form State
  const [showAdd, setShowAdd] = useState(false);
  const [showEditId, setShowEditId] = useState(false);
  const [inputId, setInputId] = useState('');
  const [editForm, setEditForm] = useState<Book | null>(null);
  const [updating, setUpdating] = useState(false);
  const [addForm, setAddForm] = useState<Book>(emptyBook);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Detail Modal State
  const [showDetail, setShowDetail] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<{ id: string; name: string } | null>(null);

  // Table State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    id: true,
    name: true,
    title: true,
    category: true,
    publisher: false,
    isbn: false,
    copies: true,
    action: true
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Define Columns Configuration
  const columnConfig = useMemo(() => [
    { key: 'id', label: t('id') },
    { key: 'name', label: t('name') },
    { key: 'title', label: t('title') },
    { key: 'category', label: t('category') },
    { key: 'publisher', label: t('publisher') || 'Publisher' },
    { key: 'isbn', label: t('isbn') || 'ISBN' },
    { key: 'copies', label: t('copies') },
  ], [t]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setAuthToken(token);
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/books', { params: { page, limit, search } });
      setBooks(res.data.books);
      setTotal(res.data.total);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || t('failedToLoadBooks'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [page, search]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Actions ---

  const handleAdd = async () => {
    try {
      await api.post('/books', addForm);
      setShowAdd(false);
      setAddForm(emptyBook);
      showToast(t('bookAdded'), 'success');
      fetchBooks();
    } catch (err: any) {
      showToast(err.response?.data?.message || t('addFailed'), 'error');
    }
  };

  const checkBookId = async () => {
    if (!inputId.trim()) return showToast(t('enterBookId'), 'error');
    try {
      const res = await api.get(`/books/id/${inputId}`);
      setEditForm(res.data.book);
      setShowEditId(false);
      showToast(t('bookLoaded'), 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || t('notFound'), 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editForm) return;
    setUpdating(true);
    
    const updateData = {
      name: editForm.name,
      title: editForm.title,
      category: editForm.category,
      publisher: editForm.publisher,
      isbn: editForm.isbn,
      copies: editForm.copies
    };
    
    try {
      await api.put(`/books/${editForm.id}`, updateData);
      setEditForm(null);
      showToast(t('updated'), 'success');
      fetchBooks();
    } catch (err: any) {
      showToast(err.response?.data?.message || t('updateFailed'), 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setBookToDelete({ id, name });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;
    
    try {
      await api.delete(`/books/${bookToDelete.id}`);
      showToast(t('deleted'), 'success');
      fetchBooks();
    } catch (err: any) {
      showToast(err.response?.data?.message || t('deleteFailed'), 'error');
    } finally {
      setShowDeleteConfirm(false);
      setBookToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setBookToDelete(null);
  };

  const handleShowDetail = async (book: Book) => {
    try {
      // Fetch detailed book info
      const res = await api.get(`/books/id/${book.id}`);
      setSelectedBook(res.data.book);
      setShowDetail(true);
    } catch (err: any) {
      showToast(err.response?.data?.message || t('failedToLoadDetails'), 'error');
    }
  };

  const setAddFormSafe = (value: React.SetStateAction<Book | null>) => {
    if (value === null) setAddForm(emptyBook);
    else if (typeof value === 'function') setAddForm(prev => { const res = value(prev); return res === null ? emptyBook : res; });
    else setAddForm(value);
  };

  const closeAll = () => {
    setShowAdd(false);
    setShowEditId(false);
    setEditForm(null);
    setShowDetail(false);
    setSelectedBook(null);
  };

  // --- Table Logic ---

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
  };

  const sortedBooks = useMemo(() => {
    if (!sortConfig) return books;
    return [...books].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Book];
      const bValue = b[sortConfig.key as keyof Book];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [books, sortConfig]);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper function to check if a header column should have blue background
  const shouldHaveBlueBg = (columnKey: string) => {
    // These columns should have blue background in the header row
    const blueBgColumns = ['id', 'name', 'title', 'category', 'copies'];
    return blueBgColumns.includes(columnKey);
  };

  // Render cell helper to ensure dynamic column matching
  const renderCell = (book: Book, key: string) => {
    const value = book[key as keyof Book];
    
    switch(key) {
      case 'id': return <span className="font-mono text-gray-600 text-xs sm:text-sm break-all">{value as string}</span>;
      case 'name': return <span className="font-medium text-gray-900 text-xs sm:text-sm break-words">{value as string}</span>;
      case 'title': return <span className="text-gray-600 text-xs sm:text-sm break-words">{value as string}</span>;
      case 'category': return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 truncate max-w-[120px] sm:max-w-none">{value as string}</span>;
      case 'publisher': return <span className="text-gray-600 text-xs sm:text-sm break-words">{value as string || '-'}</span>;
      case 'isbn': return <span className="font-mono text-gray-500 text-xs sm:text-sm break-all">{value as string || '-'}</span>;
      case 'copies': {
        const copies = value as number;
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
            copies > 5 ? 'bg-green-50 text-green-700' : copies > 0 ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'
          }`}>
            {copies} {t('copies')}
          </span>
        );
      }
      default: return null;
    }
  };

  return (
    <Layout role="librarian">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        
        {/* Header Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">{t('bookCatalog')}</h1>
              <p className="text-gray-500 mt-1 text-xs sm:text-sm truncate">{t('manageBooksOnly')}</p>
            </div>

            {/* Top Right Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => setShowEditId(true)}
                className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm whitespace-nowrap"
              >
                <FiEdit2 className="w-4 h-4 flex-shrink-0" /> <span className="hidden sm:inline">{t('edit')}</span><span className="inline sm:hidden">Edit</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all whitespace-nowrap"
              >
                <FiPlus className="w-4 h-4 flex-shrink-0" /> <span className="hidden sm:inline">{t('add')}</span><span className="inline sm:hidden">Add</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-64 lg:w-96 group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder={t('searchPlaceholder') || "Search..."}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          {/* Column Toggle Dropdown */}
          <div className="relative self-start sm:self-auto">
            <button 
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap"
            >
              <FiColumns className="w-4 h-4 flex-shrink-0" />
              <span>{t('view') || 'View'}</span>
              <FiChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${showColumnMenu ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showColumnMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowColumnMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden py-2"
                  >
                    <div className="px-4 py-2 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                      {t('toggleColumns') || "Toggle Columns"}
                    </div>
                    {columnConfig.map((col, index) => (
                      <label key={`${col.key}-${index}`} className="flex items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-xs sm:text-sm text-gray-700 select-none">
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.key]}
                          onChange={() => toggleColumn(col.key)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-3 flex-shrink-0"
                        />
                        <span className="truncate">{col.label}</span>
                      </label>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Advanced Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] sm:min-w-0">
              <thead className="border-b border-gray-200">
                <tr>
                  {columnConfig.map((col) => visibleColumns[col.key] && (
                    <th 
                      key={`${col.key}-header`}
                      className={`px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider select-none ${
                        shouldHaveBlueBg(col.key) 
                          ? 'bg-blue-600' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {/* Sort Icon */}
                          <span className={`${
                            shouldHaveBlueBg(col.key) 
                              ? 'text-blue-200' 
                              : 'text-gray-300'
                          }`}>
                            {sortConfig && sortConfig.key === col.key ? (
                              sortConfig.direction === 'asc' ? <FiChevronUp className="w-3.5 h-3.5 flex-shrink-0" /> : <FiChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                            ) : (
                              <FiFilter className="w-3.5 h-3.5 flex-shrink-0" />
                            )}
                          </span>
                          <span className="truncate">{col.label}</span>
                        </div>
                        
                        {/* Three-dot menu icon */}
                        <ColumnMenu
                          columnKey={col.key}
                          columnLabel={col.label}
                          isVisible={visibleColumns[col.key]}
                          onToggleColumn={toggleColumn}
                          onSortAsc={(key) => handleSort(key, 'asc')}
                          onSortDesc={(key) => handleSort(key, 'desc')}
                          sortDirection={sortConfig?.key === col.key ? sortConfig.direction : null}
                        />
                      </div>
                    </th>
                  ))}
                  {visibleColumns.action && (
                    <th key="action-header" className="px-3 sm:px-4 lg:px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-28 bg-blue-600">
                      <span className="truncate">{t('action')}</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr key="loading-row">
                    <td colSpan={10} className="text-center py-12 text-gray-500 px-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-xs sm:text-sm">{t('loading')}...</span>
                      </div>
                    </td>
                  </tr>
                ) : sortedBooks.length === 0 ? (
                  <tr key="no-books-row">
                    <td colSpan={10} className="text-center py-12 text-gray-500 px-4">
                      <div className="flex flex-col items-center gap-2">
                        <FiBook className="w-8 h-8 text-gray-300" />
                        <span className="text-xs sm:text-sm">{t('noBooks')}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedBooks.map((book, index) => (
                    <motion.tr 
                      key={`${book.id}-${index}`}
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      {/* Dynamic Cell Rendering to match Headers */}
                      {columnConfig.map(col => visibleColumns[col.key] && (
                        <td 
                          key={`${book.id}-${col.key}`} 
                          className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap"
                        >
                          {renderCell(book, col.key)}
                        </td>
                      ))}

                      {visibleColumns.action && (
                        <td key={`${book.id}-actions`} className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => handleShowDetail(book)} 
                              className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title={t('viewDetails') || "View Details"}
                            >
                              <FiInfo className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(book.id, book.name)} 
                              className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title={t('delete')}
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer / Pagination */}
          <div className="px-3 sm:px-4 lg:px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
             <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
               {t('showing')} <span className="font-medium text-gray-900">{books.length}</span> {t('of')} <span className="font-medium text-gray-900">{total}</span> {t('results') || 'results'}
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                >
                  {t('prev')}
                </button>
                <button 
                  onClick={() => setPage(p => p + 1)} 
                  disabled={books.length < limit}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                >
                  {t('next')}
                </button>
             </div>
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {showAdd && (
            <Modal onClose={closeAll}>
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('addBook')}</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Enter details to add a new book to the library.</p>
              </div>
              <BookForm 
                form={addForm} 
                setForm={setAddFormSafe} 
                onSubmit={handleAdd} 
                updating={false} 
                isEdit={false} 
              />
            </Modal>
          )}

          {showEditId && (
            <Modal onClose={closeAll}>
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('editBook')}</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Enter the Book ID to load its details.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  value={inputId} 
                  onChange={(e) => setInputId(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && checkBookId()}
                  className="flex-1 border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                  placeholder="Enter book id"
                  autoFocus
                />
                <button 
                  onClick={checkBookId} 
                  className="bg-indigo-600 text-white px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm whitespace-nowrap"
                >
                  {t('load')}
                </button>
              </div>
            </Modal>
          )}

          {editForm && (
            <Modal onClose={closeAll}>
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('editBookDetails')}</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Update information for <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-700 break-all">{editForm.id}</span></p>
              </div>
              <BookForm 
                form={editForm} 
                setForm={setEditForm} 
                onSubmit={handleUpdate} 
                updating={updating} 
                isEdit={true} 
              />
            </Modal>
          )}

          {showDetail && selectedBook && (
            <DetailModal book={selectedBook} onClose={closeAll} />
          )}

          {toast && <Toast toast={toast} />}
        </AnimatePresence>

        {/* Delete Confirmation Modal - Separate from other modals */}
        <ConfirmDeleteModal
          isOpen={showDeleteConfirm}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          bookName={bookToDelete?.name || ''}
        />
      </motion.div>
    </Layout>
  );
}