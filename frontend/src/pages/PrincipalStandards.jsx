import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import toast from 'react-hot-toast';
import { Plus, Trash2, BookOpen, Layers, ChevronDown, CheckCircle } from 'lucide-react';

// Predefined standard names in correct order (1st → 12th)
// Backend promotion uses createdAt order → these MUST be created in this sequence
const PREDEFINED_STANDARDS = [
  '1st Standard',
  '2nd Standard',
  '3rd Standard',
  '4th Standard',
  '5th Standard',
  '6th Standard',
  '7th Standard',
  '8th Standard',
  '9th Standard',
  '10th Standard',
  '11th Standard',
  '12th Standard',
];

const PrincipalStandards = () => {
  const [standards, setStandards] = useState([]);
  const [selectedStandard, setSelectedStandard] = useState('');
  const [newSectionNames, setNewSectionNames] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStandards();
  }, []);

  const fetchStandards = async () => {
    try {
      const res = await api.get('/standards');
      setStandards(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load standards');
    }
  };

  // Standards already created (by name)
  const existingStandardNames = standards.map(s => s.name);

  // Available predefined standards (not yet created)
  const availableStandards = PREDEFINED_STANDARDS.filter(
    name => !existingStandardNames.includes(name)
  );

  // Standards created in order (predefined ones first, then any custom)
  const sortedStandards = [
    ...PREDEFINED_STANDARDS.filter(name => existingStandardNames.includes(name))
      .map(name => standards.find(s => s.name === name)),
    ...standards.filter(s => !PREDEFINED_STANDARDS.includes(s.name)),
  ].filter(Boolean);

  const handleCreateStandard = async (e) => {
    e.preventDefault();
    if (!selectedStandard) {
      toast.error('Please select a standard from the dropdown');
      return;
    }
    setLoading(true);
    try {
      await api.post('/standards', { name: selectedStandard });
      toast.success(`${selectedStandard} created successfully!`);
      setSelectedStandard('');
      fetchStandards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating standard');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStandard = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" and all its sections? This cannot be undone.`)) return;
    try {
      await api.delete(`/standards/${id}`);
      toast.success(`${name} deleted`);
      fetchStandards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting standard');
    }
  };

  const handleAddSection = async (standardId, standardName) => {
    const sectionName = newSectionNames[standardId]?.trim();
    if (!sectionName) {
      toast.error('Please enter a section name');
      return;
    }
    try {
      await api.post('/standards/sections', { name: sectionName, standardId });
      toast.success(`Section "${sectionName}" added to ${standardName}`);
      setNewSectionNames({ ...newSectionNames, [standardId]: '' });
      fetchStandards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding section');
    }
  };

  const handleDeleteSection = async (id, name) => {
    if (!window.confirm(`Delete section "${name}"? Students in this section will be unassigned.`)) return;
    try {
      await api.delete(`/standards/sections/${id}`);
      toast.success(`Section "${name}" deleted`);
      fetchStandards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting section');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Standards & Sections</h2>

        {/* Create Standard Card */}
        <div className="bg-white p-6 rounded-2xl shadow-soft">
          <h3 className="text-lg font-bold text-gray-800 mb-1">Add Standard</h3>
          <p className="text-sm text-gray-400 mb-4">
            Standards are listed in order (1st → 12th). This order determines student promotion sequence.
          </p>

          <form onSubmit={handleCreateStandard} className="flex gap-3">
            <div className="relative flex-1">
              <select
                value={selectedStandard}
                onChange={e => setSelectedStandard(e.target.value)}
                className="w-full appearance-none p-3 pr-10 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 disabled:opacity-50"
                disabled={availableStandards.length === 0}
              >
                <option value="">
                  {availableStandards.length === 0
                    ? '✅ All standards (1st–12th) created'
                    : '-- Select a Standard --'}
                </option>
                {availableStandards.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button
              type="submit"
              disabled={!selectedStandard || loading}
              className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={18} />
              {loading ? 'Creating...' : 'Create'}
            </button>
          </form>

          {/* Progress indicator */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Standards Created</span>
              <span className="font-semibold text-gray-600">
                {existingStandardNames.filter(n => PREDEFINED_STANDARDS.includes(n)).length} / {PREDEFINED_STANDARDS.length}
              </span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {PREDEFINED_STANDARDS.map(name => {
                const created = existingStandardNames.includes(name);
                return (
                  <div
                    key={name}
                    title={name}
                    className={`px-2 py-0.5 rounded-md text-xs font-medium transition ${
                      created
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {name.replace(' Standard', '')}
                    {created && <span className="ml-1">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Standards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sortedStandards.map((standard, index) => {
            const orderNum = PREDEFINED_STANDARDS.indexOf(standard.name) + 1;
            return (
              <div key={standard._id} className="bg-white p-5 rounded-2xl shadow-soft border border-gray-50 hover:border-primary/20 transition group">
                {/* Standard Header */}
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {orderNum > 0 ? orderNum : '—'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800">{standard.name}</h3>
                      <p className="text-xs text-gray-400">
                        {standard.sections?.length || 0} section{(standard.sections?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteStandard(standard._id, standard.name)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition text-sm"
                    title="Delete standard"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Sections */}
                <div className="mb-4 min-h-[36px]">
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <Layers size={12} /> Sections
                  </p>
                  {standard.sections && standard.sections.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {standard.sections.map(sec => (
                        <div
                          key={sec._id}
                          className="bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-sm"
                        >
                          <span>{sec.name}</span>
                          <button
                            onClick={() => handleDeleteSection(sec._id, sec.name)}
                            className="text-primary/60 hover:text-red-500 font-bold rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-50 transition text-xs leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No sections yet — add one below</p>
                  )}
                </div>

                {/* Add Section */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Section name (e.g. A, B, Morning)"
                    value={newSectionNames[standard._id] || ''}
                    onChange={e => setNewSectionNames({ ...newSectionNames, [standard._id]: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSection(standard._id, standard.name);
                      }
                    }}
                    className="flex-1 p-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                  <button
                    onClick={() => handleAddSection(standard._id, standard.name)}
                    className="bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary-dark transition text-sm font-semibold flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
              </div>
            );
          })}

          {standards.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No standards created yet</p>
              <p className="text-sm mt-1">Select a standard from the dropdown above to get started</p>
            </div>
          )}
        </div>

        {/* Promotion Order Info */}
        {sortedStandards.length > 1 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
            <CheckCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold">Promotion Order is Correct ✓</p>
              <p className="text-xs text-blue-600 mt-1">
                Students will be promoted in this order:{' '}
                <span className="font-medium">
                  {sortedStandards.map(s => s.name).join(' → ')}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalStandards;
