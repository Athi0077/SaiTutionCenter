import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  PlusCircle, 
  HelpCircle, 
  Award, 
  Clock, 
  Users, 
  Trash2, 
  Check, 
  X, 
  BarChart3, 
  BookOpen,
  Image as ImageIcon,
  ArrowLeft,
  Grid
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'quiz',
    name: 'Quiz',
    icon: '🧠',
    description: 'Multiple choice questions with 4 options',
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600',
    badgeBorder: 'border-rose-200 dark:border-rose-900/50'
  },
  {
    id: 'maths_challenge',
    name: 'Maths Challenge',
    icon: '🔢',
    description: 'Solve mathematical calculation challenges',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600',
    badgeBorder: 'border-blue-200 dark:border-blue-900/50'
  },
  {
    id: 'word_scramble',
    name: 'Word Scramble',
    icon: '🔤',
    description: 'Rearrange scrambled letters to spell correct words',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600',
    badgeBorder: 'border-amber-200 dark:border-amber-900/50'
  },
  {
    id: 'image_challenge',
    name: 'Image Challenge',
    icon: '🖼️',
    description: 'Identify objects, concepts or diagrams from images',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600',
    badgeBorder: 'border-emerald-200 dark:border-emerald-900/50'
  },
  {
    id: 'puzzle',
    name: 'Puzzle',
    icon: '🧩',
    description: 'Solve logic patterns and reasoning puzzles',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600',
    badgeBorder: 'border-purple-200 dark:border-purple-900/50'
  },
  {
    id: 'true_false',
    name: 'True or False',
    icon: '✓',
    description: 'Identify whether statements are true or false',
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600',
    badgeBorder: 'border-cyan-200 dark:border-cyan-900/50'
  },
  {
    id: 'fill_blank',
    name: 'Fill in the Blanks',
    icon: '📝',
    description: 'Complete missing blank words in sentences',
    color: 'from-fuchsia-500 to-pink-600',
    bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600',
    badgeBorder: 'border-fuchsia-200 dark:border-fuchsia-900/50'
  },
  {
    id: 'match_pair',
    name: 'Match the Pair',
    icon: '🔗',
    description: 'Match corresponding left and right column pairs',
    color: 'from-lime-500 to-emerald-600',
    bgColor: 'bg-lime-50 dark:bg-lime-950/40 text-lime-600',
    badgeBorder: 'border-lime-200 dark:border-lime-900/50'
  },
];

const TeacherFunActivities = () => {
  const [activeView, setActiveView] = useState('list'); // 'list' | 'select_category' | 'create_form'
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [filterType, setFilterType] = useState('all');
  
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Form State
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [availableSections, setAvailableSections] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const [activityInfo, setActivityInfo] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    timeLimit: 10,
  });

  // Category specific items state
  // 1. MCQ Items (Quiz, Maths, Puzzle, Image)
  const [mcqQuestions, setMcqQuestions] = useState([
    {
      question: '',
      imageUrl: '',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ],
      correctAnswer: 'A',
      marks: 1,
    }
  ]);

  // 2. Word Scramble Items
  const [wordScrambles, setWordScrambles] = useState([
    { word: '', hint: '', marks: 1 }
  ]);

  // 3. True or False Items
  const [trueFalseItems, setTrueFalseItems] = useState([
    { statement: '', isTrue: true, marks: 1 }
  ]);

  // 4. Fill in the Blanks Items
  const [fillBlankItems, setFillBlankItems] = useState([
    { blankQuestion: '', blankAnswer: '', marks: 1 }
  ]);

  // 5. Match Pair Items
  const [matchPairs, setMatchPairs] = useState([
    { leftItem: '', rightItem: '', marks: 1 }
  ]);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Results Modal State
  const [selectedQuizResults, setSelectedQuizResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, quizzesRes] = await Promise.all([
        api.get('/fun-activities/teacher-assignments'),
        api.get('/fun-activities/quizzes/teacher')
      ]);

      setAssignments(assignmentsRes.data.data || []);
      setQuizzes(quizzesRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleStandardChange = (stdId) => {
    setSelectedStandard(stdId);
    setSelectedSection('');
    setSelectedSubject('');
    setAvailableSubjects([]);

    const std = assignments.find(a => a.standardId === stdId);
    setAvailableSections(std ? std.sections : []);
  };

  const handleSectionChange = (secId) => {
    setSelectedSection(secId);
    setSelectedSubject('');

    const std = assignments.find(a => a.standardId === selectedStandard);
    if (std) {
      const sec = std.sections.find(s => s.sectionId === secId);
      setAvailableSubjects(sec ? sec.subjects : []);
      if (sec && sec.subjects.length === 1) {
        setSelectedSubject(sec.subjects[0]);
      }
    }
  };

  const formatForDatetimeInput = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const startCategoryCreation = (cat) => {
    setSelectedCategory(cat);
    
    const now = new Date();
    const tomorrowNight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59);

    setActivityInfo({
      title: '',
      description: '',
      startDate: formatForDatetimeInput(now),
      endDate: formatForDatetimeInput(tomorrowNight),
      timeLimit: 10,
    });

    // Reset category items
    setMcqQuestions([
      {
        question: '',
        imageUrl: '',
        options: [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }],
        correctAnswer: 'A',
        marks: 1,
      }
    ]);
    setWordScrambles([{ word: '', hint: '', marks: 1 }]);
    setTrueFalseItems([{ statement: '', isTrue: true, marks: 1 }]);
    setFillBlankItems([{ blankQuestion: '', blankAnswer: '', marks: 1 }]);
    setMatchPairs([{ leftItem: '', rightItem: '', marks: 1 }]);

    setActiveView('create_form');
  };

  // Helper for MCQ questions
  const handleAddMcq = () => {
    setMcqQuestions([
      ...mcqQuestions,
      {
        question: '',
        imageUrl: '',
        options: [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }],
        correctAnswer: 'A',
        marks: 1,
      }
    ]);
  };

  const handleRemoveMcq = (idx) => {
    if (mcqQuestions.length <= 1) return toast.error("Activity must have at least one question");
    setMcqQuestions(mcqQuestions.filter((_, i) => i !== idx));
  };

  // Helper for Word Scrambles
  const handleAddWord = () => {
    setWordScrambles([...wordScrambles, { word: '', hint: '', marks: 1 }]);
  };
  const handleRemoveWord = (idx) => {
    if (wordScrambles.length <= 1) return toast.error("Activity must have at least one word");
    setWordScrambles(wordScrambles.filter((_, i) => i !== idx));
  };

  // Helper for True/False
  const handleAddTrueFalse = () => {
    setTrueFalseItems([...trueFalseItems, { statement: '', isTrue: true, marks: 1 }]);
  };
  const handleRemoveTrueFalse = (idx) => {
    if (trueFalseItems.length <= 1) return toast.error("Activity must have at least one statement");
    setTrueFalseItems(trueFalseItems.filter((_, i) => i !== idx));
  };

  // Helper for Fill Blank
  const handleAddFillBlank = () => {
    setFillBlankItems([...fillBlankItems, { blankQuestion: '', blankAnswer: '', marks: 1 }]);
  };
  const handleRemoveFillBlank = (idx) => {
    if (fillBlankItems.length <= 1) return toast.error("Activity must have at least one question");
    setFillBlankItems(fillBlankItems.filter((_, i) => i !== idx));
  };

  // Helper for Match Pair
  const handleAddMatchPair = () => {
    setMatchPairs([...matchPairs, { leftItem: '', rightItem: '', marks: 1 }]);
  };
  const handleRemoveMatchPair = (idx) => {
    if (matchPairs.length <= 1) return toast.error("Activity must have at least one match pair");
    setMatchPairs(matchPairs.filter((_, i) => i !== idx));
  };

  // Prepare Payload & Validate
  const handleOpenPreview = (e) => {
    e.preventDefault();

    if (!selectedStandard) return toast.error("Please select a Standard");
    if (!selectedSection) return toast.error("Please select a Section");
    if (!selectedSubject) return toast.error("Please select a Subject");

    if (!activityInfo.title.trim()) return toast.error("Activity Title is required");
    if (!activityInfo.startDate) return toast.error("Start Date is required");
    if (!activityInfo.endDate) return toast.error("End Date is required");

    if (new Date(activityInfo.endDate) <= new Date(activityInfo.startDate)) {
      return toast.error("End Date must be after Start Date");
    }

    const type = selectedCategory.id;

    if (['quiz', 'maths_challenge', 'puzzle', 'image_challenge'].includes(type)) {
      for (let i = 0; i < mcqQuestions.length; i++) {
        const q = mcqQuestions[i];
        if (!q.question.trim()) return toast.error(`Item ${i + 1} question text is required`);
        for (const opt of q.options) {
          if (!opt.text.trim()) return toast.error(`Item ${i + 1} Option ${opt.key} is required`);
        }
      }
    } else if (type === 'word_scramble') {
      for (let i = 0; i < wordScrambles.length; i++) {
        if (!wordScrambles[i].word.trim()) return toast.error(`Word ${i + 1} text is required`);
      }
    } else if (type === 'true_false') {
      for (let i = 0; i < trueFalseItems.length; i++) {
        if (!trueFalseItems[i].statement.trim()) return toast.error(`Statement ${i + 1} text is required`);
      }
    } else if (type === 'fill_blank') {
      for (let i = 0; i < fillBlankItems.length; i++) {
        if (!fillBlankItems[i].blankQuestion.trim()) return toast.error(`Question ${i + 1} text is required`);
        if (!fillBlankItems[i].blankAnswer.trim()) return toast.error(`Answer ${i + 1} is required`);
      }
    } else if (type === 'match_pair') {
      for (let i = 0; i < matchPairs.length; i++) {
        if (!matchPairs[i].leftItem.trim() || !matchPairs[i].rightItem.trim()) {
          return toast.error(`Match Pair ${i + 1} requires both Left and Right items`);
        }
      }
    }

    setShowPreviewModal(true);
  };

  const handleConfirmAssignActivity = async () => {
    try {
      setSubmitting(true);
      const type = selectedCategory.id;
      let questionsPayload = [];

      if (['quiz', 'maths_challenge', 'puzzle', 'image_challenge'].includes(type)) {
        questionsPayload = mcqQuestions;
      } else if (type === 'word_scramble') {
        questionsPayload = wordScrambles;
      } else if (type === 'true_false') {
        questionsPayload = trueFalseItems.map(item => ({
          statement: item.statement,
          isTrue: item.isTrue,
          correctAnswer: item.isTrue ? 'true' : 'false',
          marks: item.marks
        }));
      } else if (type === 'fill_blank') {
        questionsPayload = fillBlankItems;
      } else if (type === 'match_pair') {
        questionsPayload = matchPairs;
      }

      const payload = {
        activityType: type,
        title: activityInfo.title,
        description: activityInfo.description,
        standardId: selectedStandard,
        sectionId: selectedSection,
        subject: selectedSubject,
        startDate: activityInfo.startDate,
        endDate: activityInfo.endDate,
        timeLimit: parseInt(activityInfo.timeLimit) || 0,
        questions: questionsPayload,
      };

      const res = await api.post('/fun-activities/quizzes', payload);
      if (res.data.success) {
        toast.success(`${selectedCategory.name} created & assigned successfully! 🎉`);
        setShowPreviewModal(false);
        // Reset Form
        setActivityInfo({ title: '', description: '', startDate: '', endDate: '', timeLimit: 10 });
        setSelectedStandard('');
        setSelectedSection('');
        setSelectedSubject('');
        setActiveView('list');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create activity");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenResults = async (quizId) => {
    try {
      setLoadingResults(true);
      setShowResultsModal(true);
      const res = await api.get(`/fun-activities/quizzes/${quizId}/results`);
      setSelectedQuizResults(res.data.data);
    } catch (err) {
      toast.error("Failed to load results");
      setShowResultsModal(false);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this activity? All student submissions will be permanently removed.")) return;

    try {
      await api.delete(`/fun-activities/quizzes/${quizId}`);
      toast.success("Activity deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete activity");
    }
  };

  const filteredQuizzes = filterType === 'all' 
    ? quizzes 
    : quizzes.filter(q => (q.activityType || 'quiz') === filterType);

  const selectedStandardObj = assignments.find(a => a.standardId === selectedStandard);
  const selectedSectionObj = selectedStandardObj?.sections.find(s => s.sectionId === selectedSection);

  const getItemCount = () => {
    const type = selectedCategory.id;
    if (['quiz', 'maths_challenge', 'puzzle', 'image_challenge'].includes(type)) return mcqQuestions.length;
    if (type === 'word_scramble') return wordScrambles.length;
    if (type === 'true_false') return trueFalseItems.length;
    if (type === 'fill_blank') return fillBlankItems.length;
    if (type === 'match_pair') return matchPairs.length;
    return 0;
  };

  const getTotalMarks = () => {
    const type = selectedCategory.id;
    let list = [];
    if (['quiz', 'maths_challenge', 'puzzle', 'image_challenge'].includes(type)) list = mcqQuestions;
    else if (type === 'word_scramble') list = wordScrambles;
    else if (type === 'true_false') list = trueFalseItems;
    else if (type === 'fill_blank') list = fillBlankItems;
    else if (type === 'match_pair') list = matchPairs;

    return list.reduce((acc, item) => acc + (parseInt(item.marks) || 1), 0);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-10">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-rose-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-semibold backdrop-blur-md border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Fun Activities Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Category Activity Creation</h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Create exciting learning activities from 8 predefined categories for your assigned classes. Track student scores and participation in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10 shrink-0">
            {activeView !== 'list' && (
              <button
                onClick={() => setActiveView('list')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white hover:bg-white/20 transition"
              >
                <ArrowLeft className="w-4 h-4" /> My Activities
              </button>
            )}

            {activeView === 'list' && (
              <button
                onClick={() => setActiveView('select_category')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-amber-400 text-gray-900 hover:bg-amber-300 shadow-lg shadow-amber-400/20 transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4" /> + Create Activity
              </button>
            )}
          </div>

          <div className="absolute right-0 top-0 bottom-0 opacity-10 w-1/3 bg-gradient-to-l from-amber-400 to-transparent pointer-events-none"></div>
        </div>

        {/* VIEW 1: MY ACTIVITIES DASHBOARD */}
        {activeView === 'list' && (
          <div className="space-y-6">
            
            {/* Category Filter Bar */}
            <div className="bg-white dark:bg-[#0b1120] p-3 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                  filterType === 'all'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-gray-200'
                }`}
              >
                All ({quizzes.length})
              </button>

              {CATEGORIES.map((cat) => {
                const count = quizzes.filter(q => (q.activityType || 'quiz') === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setFilterType(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                      filterType === cat.id
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-gray-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span className="opacity-70 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Activities Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-12 text-center border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-4">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                  🎯
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">No Activities Found</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                  No activities recorded under this category. Click "+ Create Activity" to get started!
                </p>
                <button
                  onClick={() => setActiveView('select_category')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition"
                >
                  <PlusCircle className="w-4 h-4" /> Create Activity Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuizzes.map((quiz) => {
                  const catMeta = CATEGORIES.find(c => c.id === (quiz.activityType || 'quiz')) || CATEGORIES[0];
                  return (
                    <div 
                      key={quiz._id}
                      className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Header & Badges */}
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${catMeta.bgColor} ${catMeta.badgeBorder}`}>
                            <span>{catMeta.icon}</span>
                            <span>{catMeta.name}</span>
                          </span>

                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            quiz.displayStatus === 'closed' 
                              ? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400' 
                              : quiz.displayStatus === 'coming_soon'
                              ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400'
                          }`}>
                            {quiz.displayStatus}
                          </span>
                        </div>

                        <div>
                          <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            {quiz.standardId?.name} - Section {quiz.sectionId?.name} • {quiz.subject}
                          </p>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 line-clamp-1">{quiz.title}</h3>
                        </div>

                        {quiz.description && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{quiz.description}</p>
                        )}

                        {/* Info Pills */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-600 dark:text-slate-300 pt-1">
                          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#172235] p-2 rounded-xl">
                            <HelpCircle className="w-4 h-4 text-indigo-500" />
                            <span>{quiz.questions?.length || 0} Items</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#172235] p-2 rounded-xl">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span>{quiz.totalMarks} Marks</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#172235] p-2 rounded-xl">
                            <Clock className="w-4 h-4 text-rose-500" />
                            <span>{quiz.timeLimit > 0 ? `${quiz.timeLimit} Mins` : 'No Limit'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#172235] p-2 rounded-xl">
                            <Users className="w-4 h-4 text-emerald-500" />
                            <span>{quiz.totalSubmissions}/{quiz.totalEnrolled} Done</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center justify-between pt-1">
                          <span>Starts: {new Date(quiz.startDate).toLocaleDateString()}</span>
                          <span>Ends: {new Date(quiz.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-gray-100 dark:border-[#1E293B] flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleOpenResults(quiz._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                        >
                          <BarChart3 className="w-3.5 h-3.5" /> View Results
                        </button>

                        <button
                          onClick={() => handleDeleteQuiz(quiz._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                          title="Delete Activity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: SELECT CATEGORY GRID */}
        {activeView === 'select_category' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <Grid className="w-5 h-5 text-rose-600" /> Select Activity Category
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">Choose a predefined interactive category to build an activity for your students.</p>
              </div>

              <button
                onClick={() => setActiveView('list')}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-slate-400 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] shadow-sm hover:shadow-xl transition flex flex-col justify-between space-y-5 group"
                >
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-[#172235] text-3xl flex items-center justify-center shadow-xs group-hover:scale-110 transition duration-300">
                      {cat.icon}
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100">{cat.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{cat.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => startCategoryCreation(cat)}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" /> Create {cat.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: CATEGORY ACTIVITY BUILDER FORM */}
        {activeView === 'create_form' && (
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-[#1E293B] space-y-8">
            
            {/* Header with Selected Category Info */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E293B] pb-5">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-2xl flex items-center justify-center">
                  {selectedCategory.icon}
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Category Activity Builder</span>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-slate-100">Create {selectedCategory.name}</h2>
                </div>
              </div>

              <button
                onClick={() => setActiveView('select_category')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                Change Category
              </button>
            </div>

            <form onSubmit={handleOpenPreview} className="space-y-8">
              
              {/* STEP 1: CLASS / SUBJECT AUTHORIZATION */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 text-xs font-extrabold flex items-center justify-center">1</span>
                  Target Class & Subject Selection
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                  Select ONLY from your authorized teaching assignments (Standard → Section → Subject).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Step 1: Standard */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                      Step 1 — Standard <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm"
                      value={selectedStandard}
                      onChange={(e) => handleStandardChange(e.target.value)}
                    >
                      <option value="">Select Standard</option>
                      {assignments.map((asg) => (
                        <option key={asg.standardId} value={asg.standardId}>
                          {asg.standardName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Section */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                      Step 2 — Section <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      disabled={!selectedStandard}
                      className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm disabled:opacity-50"
                      value={selectedSection}
                      onChange={(e) => handleSectionChange(e.target.value)}
                    >
                      <option value="">Select Section</option>
                      {availableSections.map((sec) => (
                        <option key={sec.sectionId} value={sec.sectionId}>
                          Section {sec.sectionName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 3: Subject */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                      Step 3 — Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      disabled={!selectedSection}
                      className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm disabled:opacity-50"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                      <option value="">Select Subject</option>
                      {availableSubjects.map((subj, idx) => (
                        <option key={idx} value={subj}>
                          {subj}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* STEP 2: COMMON ACTIVITY DETAILS */}
              <div className="pt-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 text-xs font-extrabold flex items-center justify-center">2</span>
                  Activity Details & Schedule
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                      Activity Title <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder={`e.g. ${selectedCategory.name} Challenge 1`}
                      className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                      value={activityInfo.title}
                      onChange={(e) => setActivityInfo({ ...activityInfo, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                      Description (Optional)
                    </label>
                    <textarea 
                      rows="2"
                      placeholder="Add brief instructions for your students..."
                      className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium resize-none"
                      value={activityInfo.description}
                      onChange={(e) => setActivityInfo({ ...activityInfo, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                        Start Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="datetime-local" 
                        required
                        className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-xs sm:text-sm"
                        value={activityInfo.startDate}
                        onChange={(e) => setActivityInfo({ ...activityInfo, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                        End Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="datetime-local" 
                        required
                        className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-xs sm:text-sm"
                        value={activityInfo.endDate}
                        onChange={(e) => setActivityInfo({ ...activityInfo, endDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                        Time Limit (Minutes)
                      </label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="0 = No limit"
                        className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                        value={activityInfo.timeLimit}
                        onChange={(e) => setActivityInfo({ ...activityInfo, timeLimit: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3: CATEGORY-SPECIFIC BUILDER */}
              <div className="pt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 text-xs font-extrabold flex items-center justify-center">3</span>
                    {selectedCategory.name} Builder ({getItemCount()})
                  </h3>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900/50">
                    Total Marks: {getTotalMarks()}
                  </span>
                </div>

                {/* 3A: MCQ BUILDER (Quiz, Maths, Puzzle, Image Challenge) */}
                {['quiz', 'maths_challenge', 'puzzle', 'image_challenge'].includes(selectedCategory.id) && (
                  <div className="space-y-6">
                    {mcqQuestions.map((q, qIndex) => (
                      <div 
                        key={qIndex}
                        className="p-6 bg-gray-50 dark:bg-[#172235]/60 rounded-2xl border border-gray-200 dark:border-[#334155] space-y-4 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span>Question {qIndex + 1}</span>
                          </span>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs font-bold text-gray-500">Marks:</label>
                              <input 
                                type="number" 
                                min="1"
                                className="w-16 p-1.5 bg-white dark:bg-[#0b1120] border border-gray-200 dark:border-[#334155] text-center rounded-lg font-bold text-sm"
                                value={q.marks}
                                onChange={(e) => {
                                  const updated = [...mcqQuestions];
                                  updated[qIndex].marks = Math.max(1, parseInt(e.target.value) || 1);
                                  setMcqQuestions(updated);
                                }}
                              />
                            </div>

                            {mcqQuestions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMcq(qIndex)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Image Challenge specific Image URL field */}
                        {selectedCategory.id === 'image_challenge' && (
                          <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> Image URL (Optional)
                            </label>
                            <input 
                              type="text" 
                              placeholder="https://example.com/image.jpg"
                              className="w-full p-2.5 bg-white dark:bg-[#0b1120] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl text-xs font-medium"
                              value={q.imageUrl || ''}
                              onChange={(e) => {
                                const updated = [...mcqQuestions];
                                updated[qIndex].imageUrl = e.target.value;
                                setMcqQuestions(updated);
                              }}
                            />
                          </div>
                        )}

                        <input 
                          type="text" 
                          required
                          placeholder={`Enter question ${qIndex + 1} text...`}
                          className="w-full p-3 bg-white dark:bg-[#0b1120] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...mcqQuestions];
                            updated[qIndex].question = e.target.value;
                            setMcqQuestions(updated);
                          }}
                        />

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {q.options.map((opt) => (
                            <div 
                              key={opt.key}
                              className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                                q.correctAnswer === opt.key 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700' 
                                  : 'bg-white dark:bg-[#0b1120] border-gray-200 dark:border-[#334155]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...mcqQuestions];
                                  updated[qIndex].correctAnswer = opt.key;
                                  setMcqQuestions(updated);
                                }}
                                className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 transition ${
                                  q.correctAnswer === opt.key 
                                    ? 'bg-emerald-600 text-white shadow-xs' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                {opt.key}
                              </button>

                              <input 
                                type="text" 
                                required
                                placeholder={`Option ${opt.key}`}
                                className="w-full bg-transparent text-sm font-medium text-gray-800 dark:text-slate-100 focus:outline-none"
                                value={opt.text}
                                onChange={(e) => {
                                  const updated = [...mcqQuestions];
                                  const option = updated[qIndex].options.find(o => o.key === opt.key);
                                  if (option) option.text = e.target.value;
                                  setMcqQuestions(updated);
                                }}
                              />

                              {q.correctAnswer === opt.key && (
                                <Check className="w-4 h-4 text-emerald-600 shrink-0 mr-1" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddMcq}
                      className="w-full py-3 border-2 border-dashed border-rose-300 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 font-bold rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" /> Add Question
                    </button>
                  </div>
                )}

                {/* 3B: WORD SCRAMBLE BUILDER */}
                {selectedCategory.id === 'word_scramble' && (
                  <div className="space-y-4">
                    {wordScrambles.map((ws, index) => (
                      <div key={index} className="p-5 bg-gray-50 dark:bg-[#172235]/60 rounded-2xl border border-gray-200 dark:border-[#334155] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Word {index + 1}</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs font-bold text-gray-500">Marks:</label>
                              <input 
                                type="number" min="1"
                                className="w-16 p-1 bg-white dark:bg-[#0b1120] border border-gray-200 rounded-lg text-center font-bold text-xs"
                                value={ws.marks}
                                onChange={(e) => {
                                  const updated = [...wordScrambles];
                                  updated[index].marks = Math.max(1, parseInt(e.target.value) || 1);
                                  setWordScrambles(updated);
                                }}
                              />
                            </div>
                            {wordScrambles.length > 1 && (
                              <button type="button" onClick={() => handleRemoveWord(index)} className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">Original Word *</label>
                            <input 
                              type="text" required uppercase
                              placeholder="e.g. SCHOOL"
                              className="w-full p-3 bg-white dark:bg-[#0b1120] border border-gray-200 rounded-xl text-sm font-extrabold tracking-widest text-indigo-600 uppercase"
                              value={ws.word}
                              onChange={(e) => {
                                const updated = [...wordScrambles];
                                updated[index].word = e.target.value;
                                setWordScrambles(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">Hint (Optional)</label>
                            <input 
                              type="text"
                              placeholder="e.g. A place for learning"
                              className="w-full p-3 bg-white dark:bg-[#0b1120] border border-gray-200 rounded-xl text-sm font-medium"
                              value={ws.hint}
                              onChange={(e) => {
                                const updated = [...wordScrambles];
                                updated[index].hint = e.target.value;
                                setWordScrambles(updated);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button" onClick={handleAddWord}
                      className="w-full py-3 border-2 border-dashed border-amber-300 text-amber-600 font-bold rounded-2xl hover:bg-amber-50 transition flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" /> Add Word
                    </button>
                  </div>
                )}

                {/* 3C: TRUE OR FALSE BUILDER */}
                {selectedCategory.id === 'true_false' && (
                  <div className="space-y-4">
                    {trueFalseItems.map((tf, index) => (
                      <div key={index} className="p-5 bg-gray-50 dark:bg-[#172235]/60 rounded-2xl border border-gray-200 dark:border-[#334155] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider">Statement {index + 1}</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs font-bold text-gray-500">Marks:</label>
                              <input 
                                type="number" min="1"
                                className="w-16 p-1 bg-white dark:bg-[#0b1120] border border-gray-200 rounded-lg text-center font-bold text-xs"
                                value={tf.marks}
                                onChange={(e) => {
                                  const updated = [...trueFalseItems];
                                  updated[index].marks = Math.max(1, parseInt(e.target.value) || 1);
                                  setTrueFalseItems(updated);
                                }}
                              />
                            </div>
                            {trueFalseItems.length > 1 && (
                              <button type="button" onClick={() => handleRemoveTrueFalse(index)} className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <input 
                          type="text" required
                          placeholder="e.g. The Sun is a star."
                          className="w-full p-3 bg-white dark:bg-[#0b1120] border border-gray-200 rounded-xl text-sm font-medium"
                          value={tf.statement}
                          onChange={(e) => {
                            const updated = [...trueFalseItems];
                            updated[index].statement = e.target.value;
                            setTrueFalseItems(updated);
                          }}
                        />

                        <div className="flex items-center gap-4 pt-1">
                          <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Correct Answer:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...trueFalseItems];
                              updated[index].isTrue = true;
                              setTrueFalseItems(updated);
                            }}
                            className={`px-4 py-1.5 rounded-xl font-bold text-xs transition ${
                              tf.isTrue 
                                ? 'bg-emerald-600 text-white shadow-xs' 
                                : 'bg-white dark:bg-slate-800 text-gray-600 border'
                            }`}
                          >
                            ✓ True
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...trueFalseItems];
                              updated[index].isTrue = false;
                              setTrueFalseItems(updated);
                            }}
                            className={`px-4 py-1.5 rounded-xl font-bold text-xs transition ${
                              !tf.isTrue 
                                ? 'bg-rose-600 text-white shadow-xs' 
                                : 'bg-white dark:bg-slate-800 text-gray-600 border'
                            }`}
                          >
                            ✕ False
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button" onClick={handleAddTrueFalse}
                      className="w-full py-3 border-2 border-dashed border-cyan-300 text-cyan-600 font-bold rounded-2xl hover:bg-cyan-50 transition flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" /> Add Statement
                    </button>
                  </div>
                )}

                {/* 3D: FILL IN THE BLANKS BUILDER */}
                {selectedCategory.id === 'fill_blank' && (
                  <div className="space-y-4">
                    {fillBlankItems.map((fb, index) => (
                      <div key={index} className="p-5 bg-gray-50 dark:bg-[#172235]/60 rounded-2xl border border-gray-200 dark:border-[#334155] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-fuchsia-600 uppercase tracking-wider">Question {index + 1}</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs font-bold text-gray-500">Marks:</label>
                              <input 
                                type="number" min="1"
                                className="w-16 p-1 bg-white dark:bg-[#0b1120] border border-gray-200 rounded-lg text-center font-bold text-xs"
                                value={fb.marks}
                                onChange={(e) => {
                                  const updated = [...fillBlankItems];
                                  updated[index].marks = Math.max(1, parseInt(e.target.value) || 1);
                                  setFillBlankItems(updated);
                                }}
                              />
                            </div>
                            {fillBlankItems.length > 1 && (
                              <button type="button" onClick={() => handleRemoveFillBlank(index)} className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">Sentence with blank (use _____ for blank) *</label>
                          <input 
                            type="text" required
                            placeholder="e.g. The capital of Tamil Nadu is _____."
                            className="w-full p-3 bg-white dark:bg-[#0b1120] border border-gray-200 rounded-xl text-sm font-medium"
                            value={fb.blankQuestion}
                            onChange={(e) => {
                              const updated = [...fillBlankItems];
                              updated[index].blankQuestion = e.target.value;
                              setFillBlankItems(updated);
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">Exact Blank Answer *</label>
                          <input 
                            type="text" required
                            placeholder="e.g. Chennai"
                            className="w-full p-3 bg-white dark:bg-[#0b1120] border border-gray-200 rounded-xl text-sm font-bold text-emerald-600"
                            value={fb.blankAnswer}
                            onChange={(e) => {
                              const updated = [...fillBlankItems];
                              updated[index].blankAnswer = e.target.value;
                              setFillBlankItems(updated);
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button" onClick={handleAddFillBlank}
                      className="w-full py-3 border-2 border-dashed border-fuchsia-300 text-fuchsia-600 font-bold rounded-2xl hover:bg-fuchsia-50 transition flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" /> Add Blank Question
                    </button>
                  </div>
                )}

                {/* 3E: MATCH THE PAIR BUILDER */}
                {selectedCategory.id === 'match_pair' && (
                  <div className="space-y-4">
                    {matchPairs.map((mp, index) => (
                      <div key={index} className="p-5 bg-gray-50 dark:bg-[#172235]/60 rounded-2xl border border-gray-200 dark:border-[#334155] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-lime-600 uppercase tracking-wider">Pair {index + 1}</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs font-bold text-gray-500">Marks:</label>
                              <input 
                                type="number" min="1"
                                className="w-16 p-1 bg-white dark:bg-[#0b1120] border border-gray-200 rounded-lg text-center font-bold text-xs"
                                value={mp.marks}
                                onChange={(e) => {
                                  const updated = [...matchPairs];
                                  updated[index].marks = Math.max(1, parseInt(e.target.value) || 1);
                                  setMatchPairs(updated);
                                }}
                              />
                            </div>
                            {matchPairs.length > 1 && (
                              <button type="button" onClick={() => handleRemoveMatchPair(index)} className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">Left Item *</label>
                            <input 
                              type="text" required
                              placeholder="e.g. India"
                              className="w-full p-3 bg-white dark:bg-[#0b1120] border border-gray-200 rounded-xl text-sm font-semibold text-indigo-600"
                              value={mp.leftItem}
                              onChange={(e) => {
                                const updated = [...matchPairs];
                                updated[index].leftItem = e.target.value;
                                setMatchPairs(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">Right Matching Item *</label>
                            <input 
                              type="text" required
                              placeholder="e.g. New Delhi"
                              className="w-full p-3 bg-white dark:bg-[#0b1120] border border-gray-200 rounded-xl text-sm font-semibold text-emerald-600"
                              value={mp.rightItem}
                              onChange={(e) => {
                                const updated = [...matchPairs];
                                updated[index].rightItem = e.target.value;
                                setMatchPairs(updated);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button" onClick={handleAddMatchPair}
                      className="w-full py-3 border-2 border-dashed border-lime-300 text-lime-600 font-bold rounded-2xl hover:bg-lime-50 transition flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" /> Add Match Pair
                    </button>
                  </div>
                )}

              </div>

              {/* Submit & Assign Action */}
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveView('select_category')}
                  className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 transition text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" /> Assign Activity
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* PREVIEW & CONFIRMATION MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-[#1E293B] space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E293B] pb-4">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <span>{selectedCategory.icon}</span> Preview {selectedCategory.name} Assignment
              </h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm font-medium">
              <div className="p-4 bg-gray-50 dark:bg-[#172235] rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Activity Category:</span>
                  <span className="font-bold text-rose-600">{selectedCategory.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Title:</span>
                  <span className="font-bold text-gray-900 dark:text-slate-100">{activityInfo.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Class & Section:</span>
                  <span className="font-bold text-indigo-600">{selectedStandardObj?.standardName} - Section {selectedSectionObj?.sectionName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subject:</span>
                  <span className="font-bold text-emerald-600">{selectedSubject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Items:</span>
                  <span className="font-bold">{getItemCount()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Marks:</span>
                  <span className="font-bold">{getTotalMarks()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time Limit:</span>
                  <span className="font-bold">{activityInfo.timeLimit > 0 ? `${activityInfo.timeLimit} Mins` : 'No Limit'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Start Date:</span>
                  <span className="font-bold">{new Date(activityInfo.startDate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">End Date:</span>
                  <span className="font-bold">{new Date(activityInfo.endDate).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 transition text-sm"
              >
                Back to Edit
              </button>

              <button
                onClick={handleConfirmAssignActivity}
                disabled={submitting}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition text-sm flex items-center gap-2"
              >
                {submitting ? 'Assigning...' : 'Confirm & Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS BREAKDOWN MODAL */}
      {showResultsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-[#1E293B] space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E293B] pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-100">
                  {selectedQuizResults?.quiz?.title || 'Activity Results'}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedQuizResults?.quiz?.standard} - Section {selectedQuizResults?.quiz?.section} • {selectedQuizResults?.quiz?.subject}
                </p>
              </div>

              <button onClick={() => setShowResultsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingResults ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
              </div>
            ) : selectedQuizResults ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-blue-600">Total Enrolled</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{selectedQuizResults.stats.totalStudents}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-emerald-600">Participated</p>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">{selectedQuizResults.stats.participated}</p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-amber-600">Not Attempted</p>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">{selectedQuizResults.stats.notParticipated}</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-purple-600">Average Score</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">{selectedQuizResults.stats.averageScore}%</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-100 dark:border-[#1E293B] rounded-2xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-[#172235] text-gray-600 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="p-3">Student Name</th>
                        <th className="p-3 text-center">Score</th>
                        <th className="p-3 text-center">Percentage</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B] font-medium text-gray-800 dark:text-slate-200">
                      {selectedQuizResults.studentResults.map((st, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-semibold">{st.name}</td>
                          <td className="p-3 text-center">
                            {st.status === 'Completed' ? `${st.score} / ${st.totalMarks}` : '-'}
                          </td>
                          <td className="p-3 text-center font-bold">
                            {st.status === 'Completed' ? `${st.percentage}%` : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              st.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {st.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : null}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TeacherFunActivities;
