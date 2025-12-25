// admin/users/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { 
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiX, FiUpload, FiFileText, 
  FiChevronUp, FiChevronDown, FiColumns, FiCheck, FiUser, FiMail 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  department?: string;
  status: 'active' | 'deactive';
  [key: string]: any; // Allow index signature for sorting
}

// Interface for the Excel Row based on the image provided
interface ExcelUserRow {
  NO?: number;
  ID: string | number;
  'Full Name': string;
  Username?: string;
  Email?: string;
  Role: string;
  Department?: string;
}

// Column Definition for dynamic rendering
const COLUMN_DEFS = [
  { key: 'id', label: 'id', width: '10%' },
  { key: 'name', label: 'name', width: '20%' },
  { key: 'username', label: 'username', width: '15%' },
  { key: 'email', label: 'email', width: '20%' },
  { key: 'role', label: 'role', width: '15%' },
  { key: 'status', label: 'status', width: '10%' },
  { key: 'actions', label: 'actions', width: '10%', disableSort: true },
];

export default function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  
  // UI States for Sorting & Visibility
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Refs for column menu
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const columnButtonRef = useRef<HTMLButtonElement>(null);

  // Close column menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showColumnMenu &&
        columnMenuRef.current &&
        columnButtonRef.current &&
        !columnMenuRef.current.contains(event.target as Node) &&
        !columnButtonRef.current.contains(event.target as Node)
      ) {
        setShowColumnMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnMenu]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg: t(msg) || msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', {
        params: { 
          page, 
          limit, 
          search, 
          role: roleFilter, 
          status: statusFilter === 'all' ? '' : statusFilter 
        },
      });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (e: any) {
      console.error(e);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter, statusFilter]);

  // --- Sorting Logic (Client Side for current page) ---
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = useMemo(() => {
    if (!sortConfig) return users;
    
    return [...users].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [users, sortConfig]);

  // --- Column Visibility Logic ---
  const toggleColumn = (key: string) => {
    setHiddenColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const totalPages = Math.ceil(total / limit);

  const handleCreate = async (data: any) => {
    try {
      await api.post('/users', data);
      setShowModal(false);
      fetchUsers();
      showToast('userCreated');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'userCreateFailed', 'error');
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    try {
      await api.put(`/users/${id}`, data);
      setEditingUser(null);
      setShowModal(false);
      fetchUsers();
      showToast('userUpdated');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'userUpdateFailed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteUserConfirm'))) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
      showToast('userDeleted');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'userDeleteFailed', 'error');
    }
  };

  const toggleStatus = useCallback((user: User) => {
    if (user.role === 'admin') return;
    const newStatus = user.status === 'active' ? 'deactive' : 'active';

    setUsers(prev => {
      const updated = [...prev];
      const index = updated.findIndex(u => u.id === user.id);
      if (index !== -1) {
        updated[index] = { ...updated[index], status: newStatus };
      }
      return updated;
    });

    api.put(`/users/${user.id}`, { status: newStatus }).catch(() => {
      setUsers(prev => {
        const updated = [...prev];
        const index = updated.findIndex(u => u.id === user.id);
        if (index !== -1) {
          updated[index] = { ...updated[index], status: user.status };
        }
        return updated;
      });
    });
  }, []);

  // --- Import Logic ---
  const handleImportUsers = async (usersToImport: any[]) => {
    if (usersToImport.length === 0) {
      showToast('No users to import', 'error');
      return;
    }
    
    try {
      const res = await api.post('/users/import', { users: usersToImport });
      setShowImportModal(false);
      fetchUsers();
      showToast(`Imported ${res.data.importedCount} users successfully`, 'success');
      if (res.data.errors && res.data.errors.length > 0) {
        console.warn('Import errors:', res.data.errors);
        setTimeout(() => showToast(`Skipped ${res.data.errors.length} duplicates/errors`, 'error'), 3500);
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Import failed', 'error');
    }
  };

  const UserFormModal = () => {
    const isEdit = !!editingUser;
    const [form, setForm] = useState({
      id: editingUser?.id ?? '',
      name: editingUser?.name ?? '',
      username: editingUser?.username ?? '',
      email: editingUser?.email ?? '',
      role: editingUser?.role ?? 'student',
      department: editingUser?.department ?? '',
    });

    // Handle ID input change with max length validation
    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      // Allow only up to 10 characters
      if (value.length <= 10) {
        setForm({ ...form, id: value });
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (isEdit) {
        // Allow updating all fields including ID.
        // editingUser!.id is the OLD id (for URL), form contains the NEW id (for body)
        handleUpdate(editingUser!.id, form);
      } else {
        // For create, username/email are managed by user first login
        handleCreate(form);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={() => setShowModal(false)}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.3 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative overflow-hidden border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              {isEdit ? t('editUser') : t('addNewUser')}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {/* ID Field - Updated: No prefix, max 10 characters */}
              <div className="group">
                <div className="relative">
                  <input
                    required
                    placeholder={t('id') || "Enter ID (max 10 characters)"}
                    value={form.id}
                    onChange={handleIdChange}
                    maxLength={10}
                    className="w-full px-3 py-2.5 pl-10 text-sm bg-gray-50 border border-gray-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    <FiEdit2 />
                  </div>
                  {/* Character counter */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                    {form.id.length}/10
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {t('idMaxLength') || 'Enter ID (maximum 10 characters, any letter or number)'}
                </p>
              </div>
              
              <input
                required
                placeholder={t('fullName')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
              
              {/* Username and Email are only editable/visible during Update. 
                  During Creation, users register these themselves. */}
              {isEdit && (
                <>
                  <input
                    required
                    placeholder={t('username')}
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                  <input
                    required
                    type="email"
                    placeholder={t('email') || "Email Address"}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </>
              )}

              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                >
                  <option value="student">{t('student')}</option>
                  <option value="teacher">{t('teacher')}</option>
                  <option value="librarian">{t('librarian')}</option>
                  <option value="admin">{t('admin')}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <FiChevronDown size={14} />
                </div>
              </div>
              <input
                placeholder={t('departmentOptional')}
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2.5 text-sm rounded-lg font-semibold shadow-sm hover:bg-blue-700 hover:shadow-md active:transform active:scale-[0.98] transition-all"
              >
                {isEdit ? t('update') : t('create')}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 text-sm rounded-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-all"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  const ImportModal = () => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ExcelUserRow[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'id' | 'range'>('all');
    const [rangeStart, setRangeStart] = useState<number>(1);
    const [rangeEnd, setRangeEnd] = useState<number>(10);
    const [targetId, setTargetId] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    const loadXLSX = async () => {
      if ((window as any).XLSX) return (window as any).XLSX;
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => resolve((window as any).XLSX);
        script.onerror = (e) => reject(e);
        document.body.appendChild(script);
      });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;
      setFile(selectedFile);
      setIsParsing(true);

      try {
        const XLSX = await loadXLSX();
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const binaryStr = event.target?.result;
            const workbook = XLSX.read(binaryStr, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet);
            setParsedData(data as ExcelUserRow[]);
          } catch (error) {
            console.error('Error parsing excel:', error);
            showToast('Failed to parse file', 'error');
          } finally {
            setIsParsing(false);
          }
        };
        reader.readAsBinaryString(selectedFile);
      } catch (error) {
         console.error('Failed to load xlsx library', error);
         showToast('Failed to load Excel parser', 'error');
         setIsParsing(false);
      }
    };

    const handleImportSubmit = () => {
      if (!parsedData.length) return;
      let finalData: ExcelUserRow[] = [];
      if (filterType === 'all') {
        finalData = parsedData;
      } else if (filterType === 'id') {
        finalData = parsedData.filter(row => String(row.ID).trim() === targetId.trim());
      } else if (filterType === 'range') {
        finalData = parsedData.filter((row, index) => {
          const checkVal = row.NO ? row.NO : index + 1;
          return checkVal >= rangeStart && checkVal <= rangeEnd;
        });
      }

      const mappedData = finalData.map(row => ({
        id: String(row.ID),
        name: row['Full Name'],
        username: row['Username'] || '',
        email: row['Email'] || '',
        role: row['Role']?.toLowerCase() || 'student',
        department: row['Department'] || '',
        status: 'active'
      }));

      // Validate: ID and Name are mandatory. Username/Email are optional (can be claimed later).
      const validData = mappedData.filter(u => u.id && u.name);
      
      if (validData.length < mappedData.length) {
         showToast(`Warning: ${mappedData.length - validData.length} rows skipped due to missing ID/Name`, 'error');
      }

      handleImportUsers(validData);
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={() => setShowImportModal(false)}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
          
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FiFileText className="text-emerald-600" /> {t('importUsers')}
            </h3>
            <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
              <FiX size={20} />
            </button>
          </div>

          {!file ? (
             <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 hover:border-emerald-400 transition-all cursor-pointer relative group">
               <input 
                 type="file" 
                 accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                 onChange={handleFileChange}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
               <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                 <FiUpload className="h-6 w-6 text-emerald-500" />
               </div>
               <p className="text-sm font-medium text-gray-700">{t('clickToUpload')}</p>
               <p className="text-xs text-gray-400 mt-1">{t('csvColumnsInfo')}</p>
             </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                <span className="text-sm text-emerald-900 font-medium truncate max-w-[200px] flex items-center gap-2">
                  <FiFileText size={14} />
                  {file.name}
                </span>
                <button onClick={() => { setFile(null); setParsedData([]); }} className="text-xs font-semibold text-red-500 hover:text-red-600 hover:underline">{t('remove')}</button>
              </div>

              {isParsing ? (
                <div className="text-center py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-xs text-gray-500">{t('processingFile')}</p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('filterOptions')}</p>
                  
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${filterType === 'all' ? 'border-emerald-500' : 'border-gray-300'}`}>
                        {filterType === 'all' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </div>
                      <input 
                        type="radio" 
                        name="filter" 
                        checked={filterType === 'all'} 
                        onChange={() => setFilterType('all')}
                        className="hidden"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">{t('allData')} ({parsedData.length} {t('rows')})</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${filterType === 'id' ? 'border-emerald-500' : 'border-gray-300'}`}>
                         {filterType === 'id' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </div>
                      <input 
                        type="radio" 
                        name="filter" 
                        checked={filterType === 'id'} 
                        onChange={() => setFilterType('id')}
                        className="hidden"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">{t('bySpecificId')}</span>
                    </label>
                    {filterType === 'id' && (
                      <motion.input 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        type="text" 
                        placeholder={t('enterId')}
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="ml-6 w-[85%] px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    )}

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${filterType === 'range' ? 'border-emerald-500' : 'border-gray-300'}`}>
                         {filterType === 'range' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </div>
                      <input 
                        type="radio" 
                        name="filter" 
                        checked={filterType === 'range'} 
                        onChange={() => setFilterType('range')}
                        className="hidden"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">{t('byRangeRow')}</span>
                    </label>
                    {filterType === 'range' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="ml-6 flex items-center gap-2"
                      >
                        <input 
                          type="number" 
                          placeholder="1" 
                          value={rangeStart}
                          onChange={(e) => setRangeStart(Number(e.target.value))}
                          className="w-20 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                        <span className="text-gray-400 text-xs">{t('to')}</span>
                        <input 
                          type="number" 
                          placeholder="10" 
                          value={rangeEnd}
                          onChange={(e) => setRangeEnd(Number(e.target.value))}
                          className="w-20 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleImportSubmit}
                  disabled={parsedData.length === 0}
                  className="flex-1 bg-blue-600 text-white py-2.5 text-sm rounded-lg font-semibold shadow-sm hover:bg-blue-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('import')} {parsedData.length > 0 ? `(${parsedData.length})` : ''}
                </button>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 text-sm rounded-lg font-medium hover:bg-gray-50 transition-all"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  };

  return (
    <Layout role="admin">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
      >
        <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-white text-sm font-medium backdrop-blur-md max-w-xs sm:max-w-sm ${
                  toast.type === 'success' ? 'bg-emerald-600/90' : 'bg-rose-600/90'
                }`}
              >
                <div className="bg-white/20 p-1 rounded-full flex-shrink-0">
                  {toast.type === 'success' ? <FiCheck size={16}/> : <FiX size={16}/>}
                </div>
                <span className="truncate">{toast.msg}</span>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">{t('manageUsers')}</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Total {total} users registered in the system</p>
          </div>
          <div className="flex flex-wrap gap-2">
             <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => setShowImportModal(true)}
                 className="bg-white border border-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all whitespace-nowrap"
               >
                 <FiFileText size={14} className="text-emerald-600" /> 
                 <span className="hidden sm:inline">{t('importCSV')}</span>
                 <span className="inline sm:hidden">{t('import')}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingUser(null);
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 shadow-sm hover:bg-blue-700 hover:shadow transition-all whitespace-nowrap"
            >
              <FiPlus size={14} /> 
              <span>{t('addUser')}</span>
            </motion.button>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          
          {/* Tabs - Made horizontal scrollable on mobile */}
          <div className="flex gap-4 sm:gap-6 border-b border-gray-100 pb-4 mb-4 overflow-x-auto">
            {[
              { id: 'all', label: 'allUsers' },
              { id: 'active', label: 'active' },
              { id: 'deactive', label: 'inactive' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                className={`text-xs sm:text-sm font-medium pb-4 -mb-4 border-b-2 transition-all whitespace-nowrap px-2 sm:px-1 ${
                  statusFilter === tab.id
                    ? 'text-white bg-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                {t(tab.label)}
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {/* Search */}
              <div className="relative w-full sm:w-64 lg:w-72 group">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input
                  placeholder={t('searchUsers') || "Search by name, ID or email..."}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none"
                />
              </div>

              {/* Role Filter */}
              <div className="relative w-full sm:w-48">
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm appearance-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none"
                >
                  <option value="">{t('allRoles') || "All Roles"}</option>
                  <option value="admin">{t('admin')}</option>
                  <option value="librarian">{t('librarian')}</option>
                  <option value="teacher">{t('teacher')}</option>
                  <option value="student">{t('student')}</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              </div>
            </div>

            {/* Column Visibility Toggle - FIXED FOR MOBILE */}
            <div className="relative self-start lg:self-auto">
               <button 
                  ref={columnButtonRef}
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors whitespace-nowrap"
               >
                 <FiColumns size={14} />
                 <span>{t('columns')}</span>
                 <FiChevronDown size={12} className={`transition-transform duration-200 ${showColumnMenu ? 'rotate-180' : ''}`} />
               </button>
               
               <AnimatePresence>
                 {showColumnMenu && (
                   <motion.div 
                     ref={columnMenuRef}
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-xl border border-gray-100 p-2 z-50"
                     style={{
                       // Ensure it stays within viewport on mobile
                       maxHeight: 'calc(100vh - 200px)',
                       overflowY: 'auto',
                       WebkitOverflowScrolling: 'touch'
                     }}
                   >
                     <div className="text-xs font-semibold text-gray-400 px-2 py-1 uppercase mb-1">{t('columnsToShow')}</div>
                     {COLUMN_DEFS.map(col => (
                       <button
                         key={col.key}
                         onClick={() => {
                           toggleColumn(col.key);
                         }}
                         className="flex items-center justify-between w-full px-2 py-2 sm:py-1.5 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                       >
                         <span>{t(col.label) || col.label}</span>
                         {!hiddenColumns.includes(col.key) && <FiCheck className="text-blue-500 flex-shrink-0" size={14} />}
                       </button>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="border-b border-gray-100 font-medium uppercase text-[10px] xs:text-xs tracking-wider">
                <tr className="bg-blue-600">
                  {COLUMN_DEFS.map((col) => {
                    if (hiddenColumns.includes(col.key)) return null;
                    return (
                      <th 
                        key={col.key} 
                        style={{ width: col.width }}
                        className={`px-3 sm:px-6 py-3 sm:py-4 ${!col.disableSort ? 'cursor-pointer hover:bg-blue-800 transition-colors select-none' : ''}`}
                        onClick={() => !col.disableSort && handleSort(col.key)}
                      >
                        <div className="flex items-center gap-1 text-white whitespace-nowrap">
                          {t(col.label) || col.label}
                          {!col.disableSort && (
                             <div className="flex flex-col ml-1 text-gray-300">
                               <FiChevronUp size={10} className={`${sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'text-white' : ''}`} />
                               <FiChevronDown size={10} className={`${sortConfig?.key === col.key && sortConfig.direction === 'desc' ? 'text-white' : ''}`} />
                             </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={COLUMN_DEFS.length - hiddenColumns.length} className="px-3 sm:px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
                      </td>
                    </tr>
                  ))
                ) : sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMN_DEFS.length - hiddenColumns.length} className="px-3 sm:px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center px-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <FiSearch size={18} className="text-gray-400" />
                        </div>
                        <p className="font-medium text-sm sm:text-base">{t('noUsersFound')}</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedUsers.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="group hover:bg-gray-50/80 transition-colors"
                    >
                      {!hiddenColumns.includes('id') && (
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="font-mono text-xs text-gray-500 group-hover:text-blue-600 transition-colors break-all">
                            {u.id}
                          </div>
                        </td>
                      )}
                      
                      {!hiddenColumns.includes('name') && (
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                           <div className="font-medium text-gray-900 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                             {u.name}
                           </div>
                           <div className="flex flex-col sm:hidden text-xs text-gray-500 mt-1">
                             {u.email && <span className="flex items-center gap-1 truncate"><FiMail size={10} /> {u.email}</span>}
                             {u.username && <span className="flex items-center gap-1 truncate"><FiUser size={10} /> {u.username}</span>}
                           </div>
                        </td>
                      )}
                      
                      {!hiddenColumns.includes('username') && (
                        <td className="hidden sm:table-cell px-6 py-4 text-gray-600 text-sm">
                          {u.username}
                        </td>
                      )}
                      
                      {!hiddenColumns.includes('email') && (
                        <td className="hidden sm:table-cell px-6 py-4 text-gray-600 text-sm">
                          <div className="truncate max-w-[150px] lg:max-w-[200px]">{u.email || '-'}</div>
                        </td>
                      )}

                      {!hiddenColumns.includes('role') && (
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] xs:text-xs font-medium border whitespace-nowrap ${
                              u.role === 'admin'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : u.role === 'librarian'
                                ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                : u.role === 'teacher'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {t(u.role)}
                          </span>
                        </td>
                      )}

                      {!hiddenColumns.includes('status') && (
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          {u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="h-2 w-2 bg-emerald-500 rounded-full"
                              />
                              <span className="hidden sm:inline">{t('active')}</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => toggleStatus(u)}
                                className="w-11 h-6 rounded-full p-0.5 cursor-pointer focus:outline-none shadow-inner flex-shrink-0"
                                style={{
                                  backgroundColor: u.status === 'active' ? '#10b981' : '#e5e7eb',
                                }}
                              >
                                <motion.div
                                  layout
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  className={`w-5 h-5 rounded-full bg-white shadow-md ${
                                    u.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </motion.button>
                              <span className="text-xs text-gray-600 sm:hidden">
                                {u.status === 'active' ? t('active') : t('inactive')}
                              </span>
                            </div>
                          )}
                        </td>
                      )}

                      {!hiddenColumns.includes('actions') && (
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <motion.button
                              whileHover={{ scale: 1.2, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setEditingUser(u);
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title={t('edit')}
                            >
                              <FiEdit2 size={14} />
                            </motion.button>
                            {u.role !== 'admin' && (
                              <motion.button
                                whileHover={{ scale: 1.2, rotate: -90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDelete(u.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title={t('delete')}
                              >
                                <FiTrash2 size={14} />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-3 sm:px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm">
              <span className="text-gray-500 text-center sm:text-left">
                {t('showing')} <span className="font-medium text-gray-900">{(page - 1) * limit + 1}</span> - <span className="font-medium text-gray-900">{Math.min(page * limit, total)}</span> {t('of')} <span className="font-medium text-gray-900">{total}</span>
              </span>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 sm:px-3 py-1.5 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
                >
                  {t('prev')}
                </button>
                <div className="flex gap-0.5 sm:gap-1">
                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = i + Math.max(1, page - 2);
                    if (p > totalPages) return null;
                    const isActive = page === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center font-medium transition-colors text-xs sm:text-sm ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }).filter(Boolean)}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 sm:px-3 py-1.5 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
                >
                  {t('next')}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">{showModal && <UserFormModal />}</AnimatePresence>
      <AnimatePresence mode="wait">{showImportModal && <ImportModal />}</AnimatePresence>
    </Layout>
  );
}