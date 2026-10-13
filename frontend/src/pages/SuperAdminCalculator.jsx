import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Calculator, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

const SuperAdminCalculator = () => {
  const { currentUser } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Local state for the editable amounts
  const [amounts, setAmounts] = useState({
    student: 0,
    teacher: 0,
    principal: 0,
    parent: 0
  });

  const fetchCalculatorData = async () => {
    try {
      const res = await api.get('/super-admin/calculator');
      setData(res.data);
      setAmounts(res.data.amounts);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch calculator data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalculatorData();
  }, []);

  const handleAmountChange = (role, value) => {
    const num = parseFloat(value);
    setAmounts(prev => ({
      ...prev,
      [role]: isNaN(num) ? 0 : Math.max(0, num)
    }));
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset amounts to their saved values?')) {
      if (data) {
        setAmounts(data.amounts);
        toast.success('Amounts reset to saved values');
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put('/super-admin/calculator', amounts);
      setData(res.data);
      setAmounts(res.data.amounts);
      toast.success('Amounts saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save amounts');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  if (!data) return null;

  const { counts } = data;
  
  // Real-time calculation based on local amounts
  const totals = {
    student: counts.student * (amounts.student || 0),
    teacher: counts.teacher * (amounts.teacher || 0),
    principal: counts.principal * (amounts.principal || 0),
    parent: counts.parent * (amounts.parent || 0)
  };

  const grandTotal = totals.student + totals.teacher + totals.principal + totals.parent;

  const renderCalculatorRow = (roleName, key) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors">
      <div className="font-semibold text-gray-700 capitalize">{roleName}</div>
      <div className="text-gray-600 flex justify-between md:justify-start gap-4">
        <span className="text-sm">Count:</span>
        <span className="font-bold">{counts[key]}</span>
      </div>
      <div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
          <input
            type="number"
            min="0"
            step="any"
            value={amounts[key] === 0 ? '' : amounts[key]}
            onChange={(e) => handleAmountChange(key, e.target.value)}
            placeholder="0"
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
      </div>
      <div className="text-right font-bold text-gray-800 bg-gray-100 py-2 px-4 rounded-lg">
        {formatCurrency(totals[key])}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-gray-900 to-slate-800 text-white rounded-2xl p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-400" />
            Account Amount Calculator
          </h1>
          <p className="text-gray-300">Configure per-account amounts and calculate expected totals instantly.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Calculation Setup</h2>
            {data.updatedAt && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Last saved: {new Date(data.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="hidden md:grid grid-cols-4 gap-4 p-4 bg-gray-100 font-bold text-gray-600 text-sm uppercase tracking-wider">
            <div>Role</div>
            <div>Actual Count</div>
            <div>Amount Per Account</div>
            <div className="text-right">Category Total</div>
          </div>
          
          <div className="flex flex-col">
            {renderCalculatorRow('Students', 'student')}
            {renderCalculatorRow('Teachers', 'teacher')}
            {renderCalculatorRow('Principals', 'principal')}
            {renderCalculatorRow('Parents', 'parent')}
          </div>

          <div className="p-6 bg-blue-50 border-t border-blue-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-600 font-medium">
              Formula: <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200 text-xs">Count × Amount</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest block mb-1">Grand Total</span>
              <span className="text-4xl font-extrabold text-blue-700">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Amounts'}
          </button>
        </div>

      </div>
    </Layout>
  );
};

export default SuperAdminCalculator;
