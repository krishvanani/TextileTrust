import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Lock, ShieldCheck, CheckCircle, ArrowLeft, Zap } from 'lucide-react';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();

  const formData = location.state?.formData;
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Redirect if no form data (user navigated directly)
  useEffect(() => {
    if (!formData) {
      navigate('/subscription?view=form');
    }
  }, [formData, navigate]);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Call backend to activate subscription
      const { data } = await api.post('/subscription/activate', formData);

      if (data.success && data.data) {
        updateUser(data.data);

        // Auto-register company
        try {
          const companyData = {
            name: formData.companyName,
            gst: formData.gstNumber,
            pan: formData.panNumber,
            city: formData.city,
            businessType: formData.businessType,
            contactPerson: formData.contactPerson,
            officialEmail: formData.email,
            officialPhone: formData.contactNumber,
          };

          const companyResponse = await api.post('/companies/register', companyData);

          if (companyResponse.data && companyResponse.data._id) {
            await updateUser({ ...data.data, companyId: companyResponse.data._id });
            setPaymentSuccess(true);
            setTimeout(() => {
              window.location.href = `/company/${companyResponse.data._id}`;
            }, 2000);
          } else {
            setPaymentSuccess(true);
            setTimeout(() => navigate('/subscription?view=success'), 2000);
          }
        } catch (companyError) {
          console.error('Company registration failed:', companyError);
          setPaymentSuccess(true);
          setTimeout(() => navigate('/subscription?view=success'), 2000);
        }
      }
    } catch (error) {
      console.error('Payment failed:', error);
      alert(error.response?.data?.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!formData) return null;

  // Payment Success Screen
  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white px-4">
        <GlassCard className="max-w-md w-full text-center p-10 reveal">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6 border-2 border-emerald-200 animate-bounce">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-500 mb-1">$1,000.00 has been charged to your card.</p>
          <p className="text-sm text-gray-400">Redirecting you to your company profile...</p>
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-28 sm:pt-32 pb-16 px-4 relative overflow-hidden">
      {/* Floating gradient orbs */}
      <div className="hidden sm:block absolute top-20 right-20 w-72 h-72 bg-brand-500/8 rounded-full blur-[100px] -z-10 orb-float-1"></div>
      <div className="hidden sm:block absolute bottom-40 left-10 w-96 h-96 bg-teal-500/8 rounded-full blur-[120px] -z-10 orb-float-2"></div>
      <div className="max-w-5xl mx-auto">

        {/* Back Button */}
        <button
          onClick={() => navigate('/subscription?view=form')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 font-medium mb-8 transition-colors"
          disabled={isProcessing}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Subscription Form
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: Payment Form */}
          <div className="lg:col-span-3">
            <div className="p-0 overflow-hidden border border-gray-100 bg-gray-50 rounded-2xl shadow-md gradient-border-card">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 sm:p-8 text-white">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Payment Gateway</h2>
                    <p className="text-xs text-gray-300">Secure Transaction • 256-bit SSL Encrypted</p>
                  </div>
                </div>
              </div>

              {/* Card Form */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full p-3.5 border border-gray-300 rounded-xl outline-none text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all bg-white input-glow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full p-3.5 border border-gray-300 rounded-xl outline-none text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all bg-white pr-12 input-glow"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5">
                      <div className="w-8 h-5 bg-blue-600 rounded text-white text-[8px] flex items-center justify-center font-bold">VISA</div>
                      <div className="w-8 h-5 bg-red-500 rounded text-white text-[8px] flex items-center justify-center font-bold">MC</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      maxLength={7}
                      className="w-full p-3.5 border border-gray-300 rounded-xl outline-none text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all bg-white input-glow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">CVC</label>
                    <input
                      type="text"
                      placeholder="123"
                      maxLength={4}
                      className="w-full p-3.5 border border-gray-300 rounded-xl outline-none text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all bg-white input-glow"
                    />
                  </div>
                </div>

                {/* Pay Button */}
                <Button
                  onClick={handlePayment}
                  variant="primary"
                  fullWidth
                  className="py-4 text-base shadow-xl shadow-brand-500/20 mt-2"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing Payment...
                    </span>
                  ) : (
                    'Pay $1,000.00'
                  )}
                </Button>

                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5 pt-2">
                  <Lock className="w-3 h-3 float-animation-fast" /> Your payment information is securely encrypted
                </p>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <div className="p-0 overflow-hidden border border-gray-100 bg-gray-50 rounded-2xl shadow-md sticky top-32 card-hover-lift">
              <div className="bg-gray-50 p-6 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Order Summary</h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Premium Plan</h4>
                    <p className="text-xs text-gray-500">Annual Subscription</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Company</span>
                    <span className="font-medium text-gray-900">{formData.companyName}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST Number</span>
                    <span className="font-mono text-xs text-gray-900">{formData.gstNumber}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Business Type</span>
                    <span className="font-medium text-gray-900">{formData.businessType}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>$1,000.00</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Tax</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-lg pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>$1,000.00</span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="w-4 h-4" />
                    What you get:
                  </div>
                  <ul className="text-xs text-emerald-600 space-y-1.5 ml-6">
                    <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 flex-shrink-0" /> Verified Company Profile</li>
                    <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 flex-shrink-0" /> Credit Risk Reports</li>
                    <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 flex-shrink-0" /> Advanced Search Filters</li>
                    <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 flex-shrink-0" /> Market Trends & Analytics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Payment;
