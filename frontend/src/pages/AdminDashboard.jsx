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
        toast.success('Review deleted permanently.');
      } else {
        await api.put(`/admin/reviews/${id}/${action}`);
        toast.success(`Review ${action === 'hide' ? 'hidden' : 'unhidden'} successfully.`);
      }
      await Promise.all([fetchStats(), fetchReviews()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 reveal">
            {/* Company Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                Company Breakdown
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Approved', value: stats?.approvedCompanies, color: 'bg-emerald-500', total: stats?.totalCompanies },
                  { label: 'Pending', value: stats?.pendingCompanies, color: 'bg-amber-500', total: stats?.totalCompanies },
                  { label: 'Rejected', value: stats?.rejectedCompanies, color: 'bg-red-500', total: stats?.totalCompanies },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-semibold text-gray-900">{item.value ?? 0}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.total ? ((item.value || 0) / item.total) * 100 : 0}%`, transition: 'width 1s ease-out' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                This Week
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'New Users', value: stats?.newUsersThisWeek, icon: Users, color: 'text-blue-600 bg-blue-50' },
                  { label: 'New Companies', value: stats?.newCompaniesThisWeek, icon: Building2, color: 'text-indigo-600 bg-indigo-50' },
                  { label: 'New Reviews', value: stats?.newReviewsThisWeek, icon: Star, color: 'text-amber-600 bg-amber-50' },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{item.value ?? 0}</p>
                    <p className="text-[11px] text-gray-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ COMPANIES TAB ═══════ */}
        {activeTab === 'companies' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
            {/* Filter Bar */}
            <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-gray-900">All Companies</h3>
              <div className="flex items-center gap-2">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setCompanyFilter(f)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
                      companyFilter === f
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">GST</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">City</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <SkeletonRows cols={8} rows={5} />
                  ) : filteredCompanies.length === 0 ? (
                    <tr><td colSpan="8" className="px-5 py-10 text-center text-sm text-gray-400">No companies found.</td></tr>
                  ) : (
                    filteredCompanies.map(c => (
                      <tr key={c._id} className="table-row-highlight hover:bg-indigo-50/30">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{c.name}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">{c.gst}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{c.city}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{c.businessType}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 truncate max-w-[140px]">{c.submittedBy?.email || '—'}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                        <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {c.status !== 'APPROVED' && (
                              <button
                                onClick={() => handleCompanyAction(c._id, 'approve', c.name)}
                                disabled={actionLoading === c._id}
                                className="inline-flex items-center text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium disabled:opacity-50"
                                title="Approve"
                              >
                                {actionLoading === c._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                                Approve
                              </button>
                            )}
                            {c.status !== 'REJECTED' && (
                              <button
                                onClick={() => setConfirmModal({
                                  open: true,
                                  title: 'Reject Company',
                                  message: `Are you sure you want to reject "${c.name}"? This will remove the company from public listings.`,
                                  onConfirm: () => { handleCompanyAction(c._id, 'reject', c.name); setConfirmModal({ open: false }); },
                                  variant: 'danger'
                                })}
                                disabled={actionLoading === c._id}
                                className="inline-flex items-center text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium disabled:opacity-50"
                                title="Reject"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Reject
                              </button>
                            )}
                            {c.status === 'APPROVED' && (
                              <button
                                onClick={() => setConfirmModal({
                                  open: true,
                                  title: 'Suspend Company',
                                  message: `Suspend "${c.name}"? This removes them from public listings and searches.`,
                                  onConfirm: () => { handleCompanyAction(c._id, 'suspend', c.name); setConfirmModal({ open: false }); },
                                  variant: 'danger'
                                })}
                                disabled={actionLoading === c._id}
                                className="inline-flex items-center text-xs px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 font-medium disabled:opacity-50"
                                title="Suspend"
                              >
                                <Ban className="w-3 h-3 mr-1" />
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════ REVIEWS TAB ═══════ */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
            {/* Filter Bar */}
            <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-gray-900">Review Moderation</h3>
              <div className="flex items-center gap-2">
                {['ALL', 'REPORTED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setReviewFilter(f)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
                      reviewFilter === f
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'ALL' ? 'All Reviews' : '⚠ Reported Only'}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Reviewer</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Comment</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Reports</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Visible</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <SkeletonRows cols={7} rows={5} />
                  ) : filteredReviews.length === 0 ? (
                    <tr><td colSpan="7" className="px-5 py-10 text-center text-sm text-gray-400">No reviews found.</td></tr>
                  ) : (
                    filteredReviews.map(r => (
                      <tr key={r._id} className={`table-row-highlight ${r.reportCount >= 3 ? 'bg-red-50/40' : ''}`}>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">{r.userId?.companyName || r.userId?.email || 'Unknown'}</p>
                          <p className="text-[11px] text-gray-400">{r.userId?.role}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600 truncate max-w-[140px]">{r.companyId?.name || 'Deleted'}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-semibold text-gray-900">{r.rating}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600 max-w-[200px] truncate">{r.comment || '—'}</td>
                        <td className="px-5 py-3.5">
                          {r.reportCount > 0 ? (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              r.reportCount >= 5 ? 'bg-red-100 text-red-700' :
                              r.reportCount >= 3 ? 'bg-orange-100 text-orange-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {r.reportCount} {r.reportCount === 1 ? 'report' : 'reports'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">0</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {r.isHidden ? (
                            <span className="text-xs text-red-500 font-medium flex items-center gap-1"><EyeOff className="w-3 h-3" /> Hidden</span>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Eye className="w-3 h-3" /> Visible</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.isHidden ? (
                              <button
                                onClick={() => handleReviewAction(r._id, 'unhide')}
                                disabled={actionLoading === r._id}
                                className="inline-flex items-center text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium disabled:opacity-50"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Show
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReviewAction(r._id, 'hide')}
                                disabled={actionLoading === r._id}
                                className="inline-flex items-center text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium disabled:opacity-50"
                              >
                                <EyeOff className="w-3 h-3 mr-1" />
                                Hide
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmModal({
                                open: true,
                                title: 'Delete Review',
                                message: 'Permanently delete this review? This cannot be undone and will recalculate company stats.',
                                onConfirm: () => { handleReviewAction(r._id, 'delete'); setConfirmModal({ open: false }); },
                                variant: 'danger'
                              })}
                              disabled={actionLoading === r._id}
                              className="inline-flex items-center text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════ USERS TAB ═══════ */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-gray-900">User Management</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Company / Name</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Reviews</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Subscription</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <SkeletonRows cols={8} rows={5} />
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="8" className="px-5 py-10 text-center text-sm text-gray-400">No users found.</td></tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u._id} className="table-row-highlight">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{u.companyName || '—'}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{u.email}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{u.contactNumber}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{u.reviewCount || 0}</td>
                        <td className="px-5 py-3.5">
                          {u.isSubscribed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Inactive</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setConfirmModal({
                              open: true,
                              title: u.isSubscribed ? 'Deactivate Subscription' : 'Activate Subscription',
                              message: `${u.isSubscribed ? 'Deactivate' : 'Activate'} subscription for "${u.companyName || u.email}"?`,
                              onConfirm: () => { handleToggleSubscription(u._id, u.companyName || u.email); setConfirmModal({ open: false }); },
                              variant: u.isSubscribed ? 'danger' : 'success'
                            })}
                            disabled={actionLoading === u._id}
                            className={`inline-flex items-center text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 ${
                              u.isSubscribed
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {actionLoading === u._id ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : u.isSubscribed ? (
                              <ToggleRight className="w-3.5 h-3.5 mr-1" />
                            ) : (
                              <ToggleLeft className="w-3.5 h-3.5 mr-1" />
                            )}
                            {u.isSubscribed ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
