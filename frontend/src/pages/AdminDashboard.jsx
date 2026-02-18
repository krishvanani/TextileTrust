import React, { useState } from 'react';
import { Check, X, Eye } from 'lucide-react';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import useScrollReveal from '../hooks/useScrollReveal';

const AdminDashboard = () => {
  useScrollReveal();

  const [pendingCompanies, setPendingCompanies] = useState([
    { id: 101, name: "New Age Fabrics", gst: "33AAAA...", status: "PENDING", date: "2023-10-25" },
    { id: 102, name: "Luxe Looms", gst: "29BBBB...", status: "PENDING", date: "2023-10-26" },
  ]);

  const handleApprove = (id) => {
    setPendingCompanies(pendingCompanies.filter(c => c.id !== id));
    // Call API
  };

  const handleReject = (id) => {
    setPendingCompanies(pendingCompanies.filter(c => c.id !== id));
    // Call API
  };

  return (
    <div className="min-h-screen pb-20 bg-white relative overflow-hidden">
      {/* Floating gradient orbs */}
      <div className="hidden sm:block absolute top-40 right-10 w-64 h-64 bg-brand-500/8 rounded-full blur-[100px] -z-10 orb-float-1"></div>
      <div className="hidden sm:block absolute bottom-20 left-20 w-80 h-80 bg-teal-500/6 rounded-full blur-[120px] -z-10 orb-float-2"></div>
      <div className="rounded-none rounded-b-3xl border-t-0 border-x-0 reveal pt-28 bg-gray-50 shadow-md">
        <div className="container-custom py-6">
          <h1 className="text-2xl font-bold text-future-carbon">Admin Dashboard</h1>
        </div>
      </div>

      <div className="container-custom mt-8 space-y-8">
        
        {/* Pending Approvals Section */}
        <div className="rounded-2xl overflow-hidden reveal bg-gray-50 border border-gray-100 shadow-md">
          <div className="px-6 py-4 border-b border-future-smoke flex justify-between items-center bg-white/40">
            <h2 className="text-lg font-medium text-future-carbon">Pending Company Approvals</h2>
            <span className="bg-brand-50 text-brand-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-brand-100 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 pulse-dot"></span>
              {pendingCompanies.length} Pending
            </span>
          </div>
          
          {pendingCompanies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-future-smoke">
                <thead className="bg-white/40">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-future-steel uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-future-steel uppercase tracking-wider">GST Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-future-steel uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-future-steel uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-future-smoke bg-transparent">
                  {pendingCompanies.map((company) => (
                    <tr key={company.id} className="table-row-highlight">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-future-carbon">{company.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-future-steel">{company.gst}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-future-steel">{company.date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button 
                          onClick={() => handleApprove(company.id)}
                          className="text-emerald-600 hover:text-emerald-800 inline-flex items-center hover:scale-105 transition-transform"
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </button>
                        <button 
                          onClick={() => handleReject(company.id)}
                          className="text-red-600 hover:text-red-800 inline-flex items-center ml-4 hover:scale-105 transition-transform"
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-future-steel">
              No pending approvals.
            </div>
          )}
          </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
