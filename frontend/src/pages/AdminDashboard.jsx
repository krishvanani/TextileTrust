import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, X, Eye, EyeOff, Trash2, Shield, ShieldAlert, ShieldCheck, ShieldOff,
  Users, Building2, Star, CreditCard, AlertTriangle, TrendingUp,
  ChevronDown, Search, RefreshCw, ToggleLeft, ToggleRight, Ban, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import useScrollReveal from '../hooks/useScrollReveal';

// ────────────────────────────────────────────
//  STAT CARD
// ────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, subValue, subLabel }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-1 group">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {subValue !== undefined && (
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          +{subValue} {subLabel}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600">{value ?? '—'}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

// ────────────────────────────────────────────
//  STATUS BADGE
// ────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
};

// ────────────────────────────────────────────
//  CONFIRM MODAL
// ────────────────────────────────────────────
const ConfirmModal = ({ open, title, message, onConfirm, onCancel, variant = 'danger' }) => {
  if (!open) return null;
  const btnColor = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500';
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center modal-backdrop-blur">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 max-w-sm w-full mx-4 fade-in-scale">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex items-center space-x-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${btnColor}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────
//  SKELETON TABLE ROWS
// ────────────────────────────────────────────
const SkeletonRows = ({ cols = 5, rows = 5 }) => (
  Array.from({ length: rows }).map((_, i) => (
    <tr key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 bg-gray-200 rounded skeleton-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
        </td>
      ))}
    </tr>
  ))
);

// ════════════════════════════════════════════
//  MAIN ADMIN DASHBOARD
// ════════════════════════════════════════════
const AdminDashboard = () => {
  useScrollReveal();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Guard: Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // ── State ──
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // tracks which item is loading
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [reviewFilter, setReviewFilter] = useState('ALL'); // ALL | REPORTED
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false });

  // ── Data Fetching ──
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const params = companyFilter !== 'ALL' ? `?status=${companyFilter}` : '';
      const { data } = await api.get(`/admin/companies${params}`);
      setCompanies(data.companies || []);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  }, [companyFilter]);

  const fetchReviews = useCallback(async () => {
    try {
      const endpoint = reviewFilter === 'REPORTED' ? '/admin/reviews/reported' : '/admin/reviews';
      const { data } = await api.get(endpoint);
      setReviews(reviewFilter === 'REPORTED' ? (data || []) : (data.reviews || []));
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  }, [reviewFilter]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchCompanies(), fetchReviews(), fetchUsers()]);
    setLoading(false);
  }, [fetchStats, fetchCompanies, fetchReviews, fetchUsers]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      refreshAll();
    }
  }, [user]);

  // Re-fetch when filters change
  useEffect(() => { if (user?.role === 'ADMIN') fetchCompanies(); }, [companyFilter]);
  useEffect(() => { if (user?.role === 'ADMIN') fetchReviews(); }, [reviewFilter]);

  // ── Actions ──
  const handleCompanyAction = async (id, action, name) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/companies/${id}/${action}`);
      toast.success(`${name} has been ${action}ed.`);
      await Promise.all([fetchStats(), fetchCompanies()]);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} company.`);
    }
    setActionLoading(null);
  };

  const handleReviewAction = async (id, action) => {
    setActionLoading(id);
    try {
      if (action === 'delete') {
        await api.delete(`/admin/reviews/${id}`);
        toast.success('Review deleted.');
        setReviews(prev => prev.filter(r => r._id !== id));
      } else {
        await api.put(`/admin/reviews/${id}/${action}`);
        toast.success(action === 'hide' ? 'Review hidden.' : 'Review visible again.');
        setReviews(prev => prev.map(r => r._id === id ? { ...r, isHidden: action === 'hide' } : r));
      }
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
      fetchReviews();
    }
    setActionLoading(null);
  };

  const handleToggleSubscription = async (id, name) => {
    setActionLoading(id);
    try {
      const { data } = await api.put(`/admin/users/${id}/toggle-subscription`);
      toast.success(data.message);
      await Promise.all([fetchStats(), fetchUsers()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle subscription.');
    }
    setActionLoading(null);
  };

  // ── Guard render ──
  if (!user || user.role !== 'ADMIN') return null;

  // ── Search Filter Helper ──
  const filterBySearch = (items, fields) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      fields.some(f => {
        const val = f.split('.').reduce((o, k) => o?.[k], item);
        return val && String(val).toLowerCase().includes(q);
      })
    );
  };

  const filteredCompanies = filterBySearch(companies, ['name', 'gst', 'city', 'submittedBy.email']);
  const filteredReviews = filterBySearch(reviews, ['userId.companyName', 'userId.email', 'companyId.name', 'comment']);
  const filteredUsers = filterBySearch(users, ['companyName', 'email', 'contactNumber', 'role']);

  // ── Tabs Config ──
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'companies', label: 'Companies', icon: Building2, count: stats?.pendingCompanies },
    { id: 'reviews', label: 'Reviews', icon: Star, count: stats?.reportedReviews },
    { id: 'users', label: 'Users', icon: Users },
  ];

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-gray-50 via-white to-slate-50 relative overflow-hidden">
      {/* Floating gradient orbs */}
      <div className="hidden sm:block absolute top-40 right-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -z-10 orb-float-1" />
      <div className="hidden sm:block absolute bottom-20 left-20 w-80 h-80 bg-purple-500/5 rounded-full blur-[120px] -z-10 orb-float-2" />

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 pt-28 pb-8 reveal">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">Admin Panel</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            </div>
            <button
              onClick={refreshAll}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/20 focus:outline-none disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container-custom mt-6 space-y-6">

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 reveal">
          <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="bg-blue-600" subValue={stats?.newUsersThisWeek} subLabel="this week" />
          <StatCard icon={Building2} label="Companies" value={stats?.totalCompanies} color="bg-indigo-600" subValue={stats?.newCompaniesThisWeek} subLabel="this week" />
          <StatCard icon={Star} label="Reviews" value={stats?.totalReviews} color="bg-amber-500" subValue={stats?.newReviewsThisWeek} subLabel="this week" />
          <StatCard icon={CreditCard} label="Subscriptions" value={stats?.totalSubscriptions} color="bg-emerald-600" />
          <StatCard icon={AlertTriangle} label="Pending" value={stats?.pendingCompanies} color="bg-orange-500" />
          <StatCard icon={ShieldAlert} label="Reported Reviews" value={stats?.reportedReviews} color="bg-red-500" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto reveal">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar (for tables) */}
        {activeTab !== 'overview' && (
          <div className="relative reveal">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 input-glow"
            />
          </div>
        )}

        {/* ═══════ OVERVIEW TAB ═══════ */}
        {activeTab === 'overview' && (
          <div className="space-y-5 animate-fade-in-up">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Pending Approvals', value: stats?.pendingCompanies ?? 0, desc: 'companies awaiting review', icon: Building2, color: 'from-amber-500 to-orange-500', tab: 'companies' },
                { label: 'Reported Reviews', value: stats?.reportedReviews ?? 0, desc: 'reviews flagged by users', icon: ShieldAlert, color: 'from-red-500 to-rose-500', tab: 'reviews' },
                { label: 'Active Subscriptions', value: stats?.totalSubscriptions ?? 0, desc: 'paying members', icon: CreditCard, color: 'from-emerald-500 to-teal-500', tab: 'users' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item.tab)}
                  className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-lg hover:-translate-y-1 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.value}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  Company Breakdown
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Approved', value: stats?.approvedCompanies, color: 'bg-emerald-500', bgLight: 'bg-emerald-50', textColor: 'text-emerald-700', total: stats?.totalCompanies },
                    { label: 'Pending', value: stats?.pendingCompanies, color: 'bg-amber-500', bgLight: 'bg-amber-50', textColor: 'text-amber-700', total: stats?.totalCompanies },
                    { label: 'Rejected', value: stats?.rejectedCompanies, color: 'bg-red-500', bgLight: 'bg-red-50', textColor: 'text-red-700', total: stats?.totalCompanies },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-700">{item.label}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.bgLight} ${item.textColor}`}>{item.value ?? 0}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.color} transition-all duration-1000 ease-out`}
                            style={{ width: `${item.total ? ((item.value || 0) / item.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Total Companies</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.totalCompanies ?? 0}</span>
                </div>
              </div>

              {/* This Week Activity */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  This Week's Activity
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'New Users', value: stats?.newUsersThisWeek, icon: Users, color: 'from-blue-500 to-indigo-500', bgLight: 'bg-blue-50', textColor: 'text-blue-600' },
                    { label: 'New Companies', value: stats?.newCompaniesThisWeek, icon: Building2, color: 'from-indigo-500 to-purple-500', bgLight: 'bg-indigo-50', textColor: 'text-indigo-600' },
                    { label: 'New Reviews', value: stats?.newReviewsThisWeek, icon: Star, color: 'from-amber-500 to-orange-500', bgLight: 'bg-amber-50', textColor: 'text-amber-600' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 shadow-sm`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{item.label}</p>
                        <p className="text-xs text-gray-400">added this week</p>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{item.value ?? 0}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Total Platform Users</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.totalUsers ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ COMPANIES TAB ═══════ */}
        {activeTab === 'companies' && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Companies</h3>
              <div className="flex items-center gap-2 overflow-x-auto">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setCompanyFilter(f)}
                    className={`text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border transition-all whitespace-nowrap ${
                      companyFilter === f
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Company Cards */}
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3 skeleton-pulse" />
                        <div className="h-3 bg-gray-100 rounded w-2/3 skeleton-pulse" />
                      </div>
                      <div className="h-8 w-20 bg-gray-100 rounded-lg skeleton-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No companies found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCompanies.map(c => (
                  <div key={c._id} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-all group">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {/* Company Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h4 className="text-sm font-semibold text-gray-900">{c.name}</h4>
                          <StatusBadge status={c.status} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                          <span className="font-mono text-gray-500">{c.gst}</span>
                          {c.city && <span className="flex items-center gap-1">📍 {c.city}</span>}
                          {c.businessType && <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{c.businessType}</span>}
                          {c.submittedBy?.email && <span className="text-gray-400 truncate max-w-[180px]">{c.submittedBy.email}</span>}
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {c.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleCompanyAction(c._id, 'approve', c.name)}
                            disabled={actionLoading === c._id}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-medium disabled:opacity-50 transition-all"
                          >
                            {actionLoading === c._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Approve
                          </button>
                        )}
                        {c.status !== 'REJECTED' && (
                          <button
                            onClick={() => setConfirmModal({
                              open: true,
                              title: 'Reject Company',
                              message: `Reject "${c.name}"? This removes them from public listings.`,
                              onConfirm: () => { handleCompanyAction(c._id, 'reject', c.name); setConfirmModal({ open: false }); },
                              variant: 'danger'
                            })}
                            disabled={actionLoading === c._id}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-medium disabled:opacity-50 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        )}
                        {c.status === 'APPROVED' && (
                          <button
                            onClick={() => setConfirmModal({
                              open: true,
                              title: 'Suspend Company',
                              message: `Suspend "${c.name}"? This removes them from public listings.`,
                              onConfirm: () => { handleCompanyAction(c._id, 'suspend', c.name); setConfirmModal({ open: false }); },
                              variant: 'danger'
                            })}
                            disabled={actionLoading === c._id}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 font-medium disabled:opacity-50 transition-all"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Suspend
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════ REVIEWS TAB ═══════ */}
        {activeTab === 'reviews' && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Review Moderation</h3>
              <div className="flex items-center gap-2">
                {['ALL', 'REPORTED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setReviewFilter(f)}
                    className={`text-sm font-medium px-4 py-2 rounded-xl border transition-all ${
                      reviewFilter === f
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'ALL' ? 'All Reviews' : '⚠ Reported'}
                  </button>
                ))}
              </div>
            </div>

            {/* Review Cards */}
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3 skeleton-pulse" />
                        <div className="h-3 bg-gray-100 rounded w-1/2 skeleton-pulse" />
                        <div className="h-3 bg-gray-100 rounded w-2/3 skeleton-pulse" />
                      </div>
                      <div className="h-8 w-16 bg-gray-100 rounded-lg skeleton-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Star className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No reviews found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReviews.map(r => (
                  <div
                    key={r._id}
                    className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-all ${
                      r.isHidden ? 'border-red-200 bg-red-50/20' :
                      r.reportCount >= 3 ? 'border-orange-200 bg-orange-50/20' :
                      'border-gray-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      {/* Review content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-sm font-semibold text-gray-900">{r.userId?.companyName || r.userId?.email || 'Unknown'}</span>
                          <span className="text-gray-300">→</span>
                          <span className="text-sm text-indigo-600 font-medium">{r.companyId?.name || 'Deleted'}</span>
                          {r.reportCount > 0 && (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              r.reportCount >= 5 ? 'bg-red-100 text-red-700' :
                              r.reportCount >= 3 ? 'bg-orange-100 text-orange-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              ⚠ {r.reportCount} {r.reportCount === 1 ? 'report' : 'reports'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`w-4 h-4 ${
                              i <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                            }`} />
                          ))}
                          <span className="text-sm font-semibold text-gray-600 ml-1">{r.rating}/5</span>
                        </div>
                        {r.comment && (
                          <p className="text-sm text-gray-500 leading-relaxed">"{r.comment}"</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setConfirmModal({
                            open: true,
                            title: 'Delete Review',
                            message: 'Permanently delete this review? This cannot be undone.',
                            onConfirm: () => { handleReviewAction(r._id, 'delete'); setConfirmModal({ open: false }); },
                            variant: 'danger'
                          })}
                          disabled={actionLoading === r._id}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-medium disabled:opacity-50 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════ USERS TAB ═══════ */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <span className="text-xs text-gray-400">{filteredUsers.length} users</span>
            </div>

            {/* User Cards */}
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 skeleton-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4 skeleton-pulse" />
                        <div className="h-3 bg-gray-100 rounded w-1/3 skeleton-pulse" />
                      </div>
                      <div className="h-8 w-24 bg-gray-100 rounded-lg skeleton-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No users found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map(u => (
                  <div key={u._id} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {/* User Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                          u.isSubscribed
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {(u.companyName || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{u.companyName || '—'}</h4>
                            <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 shrink-0">
                              {u.role}
                            </span>
                            {u.isSubscribed && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                <ShieldCheck className="w-3 h-3" /> Subscribed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400 flex-wrap">
                            <span className="truncate max-w-[160px] sm:max-w-none">{u.email}</span>
                            <span>{u.contactNumber}</span>
                            <span>{u.reviewCount || 0} reviews</span>
                            <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => setConfirmModal({
                          open: true,
                          title: u.isSubscribed ? 'Deactivate Subscription' : 'Activate Subscription',
                          message: `${u.isSubscribed ? 'Deactivate' : 'Activate'} subscription for "${u.companyName || u.email}"?`,
                          onConfirm: () => { handleToggleSubscription(u._id, u.companyName || u.email); setConfirmModal({ open: false }); },
                          variant: u.isSubscribed ? 'danger' : 'success'
                        })}
                        disabled={actionLoading === u._id}
                        className={`inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 shrink-0 self-start sm:self-center ${
                          u.isSubscribed
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {actionLoading === u._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : u.isSubscribed ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                        {u.isSubscribed ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ open: false })}
        variant={confirmModal.variant}
      />
    </div>
  );
};

export default AdminDashboard;
