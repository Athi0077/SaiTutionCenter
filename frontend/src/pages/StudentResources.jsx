import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Download, FileText, Video, Link as LinkIcon, Book } from 'lucide-react';
import api from '../utils/api';

const StudentResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await api.get('/resources/student');
        setResources(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch resources", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case 'pdf': return <FileText className="text-red-500" />;
      case 'ppt': return <FileText className="text-orange-500" />;
      case 'doc': return <FileText className="text-blue-500" />;
      case 'video': return <Video className="text-purple-500" />;
      default: return <LinkIcon className="text-gray-500" />;
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Book className="text-primary" size={32} />
              Resource Library
            </h1>
            <p className="text-gray-500 mt-2">Access study materials uploaded by your teachers.</p>
          </div>
          <div className="flex gap-2">
             <select className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-primary focus:outline-none bg-white font-semibold text-gray-700">
                <option>All Subjects</option>
                <option>Math</option>
                <option>Science</option>
                <option>History</option>
             </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-semibold animate-pulse">Loading resources...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((res) => (
                <div key={res._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition hover:-translate-y-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                        {getIcon(res.type)}
                      </div>
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 text-xs font-bold rounded-full">
                        {res.subjectId?.name || 'General'}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1 leading-tight">{res.title}</h3>
                    <p className="text-sm text-gray-400 font-semibold uppercase">{res.type} • {res.size || 'Link'}</p>
                    {res.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{res.description}</p>}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-50">
                    <a href={res.fileUrl || '#'} target="_blank" rel="noreferrer" className="w-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition py-2.5 rounded-xl font-bold flex items-center justify-center gap-2">
                      <Download size={18} /> Open Resource
                    </a>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Empty State example if resources was empty */}
            {resources.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200 mt-6">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Resources Yet</h3>
                <p className="text-gray-500">Your teachers haven't uploaded any study materials.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default StudentResources;
