//teacher/books/page.tsx
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { 
  FiSearch, 
  FiPlus, 
  FiX, 
  FiChevronUp, 
  FiChevronDown, 
  FiFilter,
  FiMoreVertical,
  FiEye,
  FiEyeOff,
  FiColumns,
  FiTrash2,
  FiAlertTriangle
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

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
  SortingFn,
} from '@tanstack/react-table';

const emptyAddForm = { id: '', name: '', title: '', category: '', publisher: '', isbn: '', copies: 0 };

// Delete Confirmation Modal Component
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

// Modal Component
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <FiX className="w-6 h-6" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

// Toast Component
function Toast({ toast }: { toast: { message: string; type: 'success' | 'error' } }) {
  return (
    <motion.div
      initial={{ x: 100 }}
      animate={{ x: 0 }}
      exit={{ x: 100 }}
      className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg text-white flex items-center gap-2 ${
        toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      {toast.message}
    </motion.div>
  );
}

// Add Book Form Component
function AddBookForm({ form, setForm, onSubmit }: any) {
  const { t } = useTranslation();
  const handle = (e: any) =>
    setForm({
      ...form,
      [e.target.name]: e.target.name === 'copies' ? +e.target.value : e.target.value,
    });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3">
      {['id', 'name', 'title', 'category', 'publisher', 'isbn'].map((f) => (
        <input
          key={f}
          name={f}
          placeholder={t(f) || f.charAt(0).toUpperCase() + f.slice(1)}
          required
          value={form[f]}
          onChange={handle}
          className="w-full border p-2 rounded"
        />
      ))}
      <input
        type="number"
        name="copies"
        placeholder={t('copies') || 'Copies'}
        required
        min="0"
        value={form.copies}
        onChange={handle}
        className="w-full border p-2 rounded"
      />
      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded">
        {t('addBook') || 'Add Book'}
      </button>
    </form>
  );
}

// Column Menu Component - FIXED: Positioned relative to the three-dot button
function ColumnMenu({ column, onClose }: { column: any; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48"
    >
      <div className="p-2">
        <button
          onClick={() => {
            column.toggleSorting(false);
            onClose();
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded text-gray-900"
        >
          <FiChevronUp className="w-4 h-4 text-gray-700" />
          {t('sortAsc') || "Sort Ascending"}
        </button>
        <button
          onClick={() => {
            column.toggleSorting(true);
            onClose();
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded text-gray-900"
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
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded text-gray-900"
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
          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded text-gray-900"
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

// Columns Visibility Menu Component
function ColumnsVisibilityMenu({ table, onClose }: { table: any; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Map column IDs to display names
  const columnDisplayNames: { [key: string]: string } = {
    id: t('bookId') || 'ID',
    title: t('title') || 'Title',
    name: t('name') || 'Name',
    category: t('category') || 'Category',
    publisher: t('publisher') || 'Publisher',
    isbn: t('isbn') || 'ISBN',
    copies: t('copies') || 'Copies',
    status: t('status') || 'Status'
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48"
    >
      <div className="p-2">
        <div className="text-xs font-semibold text-gray-500 px-2 py-1 uppercase tracking-wide">
          {t('showHideColumns') || "Show/Hide Columns"}
        </div>
        {table.getAllLeafColumns().map((column: any) => (
          <label key={column.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer text-gray-900">
            <input
              type="checkbox"
              checked={column.getIsVisible()}
              onChange={column.getToggleVisibilityHandler()}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded text-blue-600"
        >
          <FiEye className="w-4 h-4" />
          {t('showAllColumns') || "Show All Columns"}
        </button>
      </div>
    </div>
  );
}

// Sortable Column Header Component - FIXED: Three-dot button always visible and white
function SortableHeader({ column, children }: { column: any; children: React.ReactNode }) {
  const [showMenu, setShowMenu] = useState(false);
  const sorted = column.getIsSorted();

  return (
    <div className="flex items-center justify-between group relative">
      <div className="flex items-center gap-1 flex-1">
        <span className="text-white text-xs sm:text-sm">{children}</span>
        <div className="flex flex-col ml-1">
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
            setShowMenu(!showMenu);
          }}
          className="p-1 hover:bg-blue-700 rounded transition-opacity"
          title="Column options"
        >
          <FiMoreVertical className="w-4 h-4 text-white" />
        </button>
        
        {showMenu && (
          <ColumnMenu column={column} onClose={() => setShowMenu(false)} />
        )}
      </div>
    </div>
  );
}

// Custom sorting function for ID column to handle numeric values
const numericSort: SortingFn<any> = (rowA, rowB, columnId) => {
  const valueA = rowA.getValue(columnId);
  const valueB = rowB.getValue(columnId);
  
  // Convert to numbers for comparison
  const numA = Number(valueA);
  const numB = Number(valueB);
  
  // If both are valid numbers, compare numerically
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }
  
  // Fallback to string comparison
  return String(valueA).localeCompare(String(valueB));
};

// Main Teacher Books Component
export default function TeacherBooks() {
  const { t } = useTranslation();
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchBooks();
  }, [search]);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/books', { params: { search } });
      setBooks(res.data.books);
    } catch (e: any) {
      showToast(e.response?.data?.message || t('failedToLoadBooks') || 'Failed to load books', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async () => {
    try {
      await api.post('/books', addForm);
      setShowAdd(false);
      setAddForm(emptyAddForm);
      showToast(t('bookAdded') || 'Book added successfully', 'success');
      fetchBooks();
    } catch (e: any) {
      showToast(e.response?.data?.message || t('addFailed') || 'Failed to add book', 'error');
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
      showToast(t('deleted') || 'Book deleted successfully', 'success');
      fetchBooks();
    } catch (err: any) {
      showToast(err.response?.data?.message || t('deleteFailed') || 'Failed to delete book', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setBookToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setBookToDelete(null);
  };

  // Define columns with action column for delete
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t('bookId') || "ID"}
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-sm break-words">{row.getValue('id')}</span>
        ),
        size: 80,
        sortingFn: numericSort,
      },
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t('title') || "Title"}
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-sm sm:text-base break-words">{row.getValue('title')}</span>
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
          <span className="text-sm sm:text-base break-words">{row.getValue('name')}</span>
        ),
        size: 150,
      },
      {
        accessorKey: 'category',
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t('category') || "Category"}
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-sm sm:text-base break-words">{row.getValue('category') || '-'}</span>
        ),
        size: 150,
      },
      {
        accessorKey: 'publisher',
        header: ({ column }) => (
          <SortableHeader column={column}>
             {t('publisher') || "Publisher"}
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-sm sm:text-base break-words">{row.getValue('publisher') || '-'}</span>
        ),
        size: 150,
      },
      {
        accessorKey: 'isbn',
        header: ({ column }) => (
          <SortableHeader column={column}>
             {t('isbn') || "ISBN"}
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-sm sm:text-base break-words">{row.getValue('isbn') || '-'}</span>
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
            <span className="text-sm sm:text-base font-medium">
              {copies}
            </span>
          );
        },
        size: 100,
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
          const status = copies > 0 ? (t('available') || 'Available') : (t('outOfStock') || 'Out of Stock');
          return (
            <span className={`text-sm sm:text-base font-medium ${
              copies > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {status}
            </span>
          );
        },
        size: 120,
      },
      {
        id: 'actions',
        header: ({ column }) => (
          <div className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wider">
            {t('actions') || "Actions"}
          </div>
        ),
        cell: ({ row }) => {
          return (
            <button
              onClick={() => handleDeleteClick(row.original.id, row.original.name)}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title={t('delete') || "Delete"}
            >
              <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          );
        },
        size: 80,
        enableHiding: false,
      },
    ],
    [t]
  );

  // Initialize table
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
    <Layout role="teacher">
      <div className="space-y-6 p-3 sm:p-4 md:p-6">
        {/* Header Section */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">{t('teacherLibrary') || 'Teacher Library'}</h1>
              <p className="text-gray-600 text-sm sm:text-base">{t('addAndViewBooks') || 'Add and view books'}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={() => setShowAdd(true)} 
                className="flex items-center gap-2 bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                <FiPlus className="w-4 h-4" /> {t('addBook') || 'Add Book'}
              </button>
            </div>
          </div>

          {/* Search Bar - Main search always visible */}
          <div className="mt-4 flex items-center gap-2">
            <FiSearch className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              placeholder={t('searchBooks') || 'Search books...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {/* Filter Controls */}
          <div className="p-3 sm:p-4 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Global Search */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <FiSearch className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  placeholder={t('searchAllColumns') || "Search all columns..."}
                  value={globalFilter ?? ''}
                  onChange={e => setGlobalFilter(String(e.target.value))}
                  className="flex-1 sm:w-64 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                />
              </div>
              
              {/* Columns Visibility Button */}
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setShowColumnsMenu(!showColumnsMenu)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                  title={t('columns') || "Columns"}
                >
                  <FiColumns className="w-4 h-4" />
                  <span className="font-medium">{t('columns') || "Columns"}</span>
                </button>
                
                {showColumnsMenu && (
                  <ColumnsVisibilityMenu 
                    table={table} 
                    onClose={() => setShowColumnsMenu(false)} 
                  />
                )}
              </div>
            </div>
          </div>

          {/* Mobile Responsive Table Container */}
          <div className="block sm:hidden overflow-x-auto -mx-3">
            <table className="w-full min-w-[800px]">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id} 
                        className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-r last:border-r-0 bg-blue-600 text-white"
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
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <tr 
                      key={row.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {row.getVisibleCells().map(cell => (
                        <td 
                          key={cell.id} 
                          className="px-3 sm:px-4 py-3 text-sm text-gray-900 border-r last:border-r-0"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                      {isLoading ? (t('loadingBooks') || 'Loading books...') : (t('noBooksFound') || 'No books found')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Desktop Responsive Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id} 
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-r last:border-r-0 bg-blue-600 text-white"
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
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <tr 
                      key={row.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {row.getVisibleCells().map(cell => (
                        <td 
                          key={cell.id} 
                          className="px-4 py-3 text-sm text-gray-900 border-r last:border-r-0"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                      {isLoading ? (t('loadingBooks') || 'Loading books...') : (t('noBooksFound') || 'No books found')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Responsive */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t gap-4 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">{t('rowsPerPage') || "Rows per page"}</span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                  className="border rounded px-2 py-1 text-xs sm:text-sm text-gray-900"
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
                className="px-3 py-1 border rounded text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 whitespace-nowrap"
              >
                {t('prev') || "Previous"}
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 border rounded text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 whitespace-nowrap"
              >
                {t('next') || "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAdd && (
          <Modal onClose={() => setShowAdd(false)}>
            <h2 className="text-xl font-bold mb-4 text-gray-900">{t('addNewBook') || 'Add New Book'}</h2>
            <AddBookForm form={addForm} setForm={setAddForm} onSubmit={handleAdd} />
          </Modal>
        )}
        {toast && <Toast toast={toast} />}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        bookName={bookToDelete?.name || ''}
      />
    </Layout>
  );
}