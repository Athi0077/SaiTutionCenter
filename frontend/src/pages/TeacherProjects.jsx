import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { PlusCircle, Edit, Trash2, FileText, CheckSquare } from 'lucide-react';
import TeacherProjectApprovals from './TeacherProjectApprovals';

const TeacherProjects = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects/teacher');
        setProjects(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex border-b border-gray-200 mb-6 gap-6">
          <button 
            className={`flex items-center gap-2 pb-3 px-2 font-bold text-lg transition border-b-2 ${activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            onClick={() => setActiveTab('list')}
          >
            <FileText className="w-5 h-5" /> My Projects
          </button>
          <button 
            className={`flex items-center gap-2 pb-3 px-2 font-bold text-lg transition border-b-2 ${activeTab === 'approvals' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            onClick={() => setActiveTab('approvals')}
          >
            <CheckSquare className="w-5 h-5" /> Approvals
          </button>
        </div>

        {activeTab === 'list' ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
              <Link 
                to="/teacher/projects/create" 
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
              >
                <PlusCircle size={20} /> Create Project
              </Link>
            </div>

            {loading ? (
              <p>Loading projects...</p>
            ) : projects.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow text-center">
                <p className="text-gray-500 mb-4">You haven't created any projects yet.</p>
                <Link to="/teacher/projects/create" className="text-primary font-semibold hover:underline">
                  Create your first project
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                  <div key={project._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition hover:-translate-y-1">
                    <div className="p-5 border-b border-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{project.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          project.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {project.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">{project.subjectId?.name} • {project.classId?.className}</p>
                    </div>
                    
                    <div className="p-5 bg-gray-50">
                      <div className="flex justify-between text-sm text-gray-600 mb-4">
                        <div>
                          <p className="text-xs text-gray-400">Due Date</p>
                          <p className="font-semibold text-red-500">{new Date(project.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Link to={`/teacher/projects/${project._id}`} className="text-sm text-primary font-semibold hover:underline">
                          View Details
                        </Link>
                        <div className="flex gap-2 text-gray-400">
                          <button className="hover:text-primary transition" title="Edit"><Edit size={16} /></button>
                          <button className="hover:text-red-500 transition" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TeacherProjectApprovals />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherProjects;
