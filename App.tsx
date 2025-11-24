import React, { useState, useEffect, useRef } from 'react';
import { generateRecruitmentPackage } from './services/gemini';
import { AppState, GeneratedContent, ExperienceLevel, CompanyContext, JobFamily } from './types';
import ResultDisplay from './components/ResultDisplay';
import ChatWidget from './components/ChatWidget';
import { 
  Sparkles, 
  ChevronRight, 
  Loader2, 
  Bot, 
  Building2, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Briefcase,
  Info,
  Save,
  DownloadCloud,
  RotateCcw,
  Check,
  FileText,
  Users
} from './components/Icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  
  // State for form inputs
  const [rawNotes, setRawNotes] = useState('');
  const [inputJobTitle, setInputJobTitle] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Mid-Level');
  const [jobFamily, setJobFamily] = useState<JobFamily | ''>('');
  const [companyMission, setCompanyMission] = useState('');
  const [companyValues, setCompanyValues] = useState('');
  const [companyCulture, setCompanyCulture] = useState('');
  
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(true);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  
  // Validation state
  const [errors, setErrors] = useState<{ rawNotes?: string }>({});

  // Loading animation state
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  
  // Draft feedback state
  const [draftMessage, setDraftMessage] = useState<string | null>(null);

  // Load from LocalStorage on mount (Auto-restore)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recruitAI_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rawNotes) setRawNotes(parsed.rawNotes);
        if (parsed.inputJobTitle) setInputJobTitle(parsed.inputJobTitle);
        if (parsed.experienceLevel) setExperienceLevel(parsed.experienceLevel);
        if (parsed.jobFamily) setJobFamily(parsed.jobFamily);
        if (parsed.companyMission) setCompanyMission(parsed.companyMission);
        if (parsed.companyValues) setCompanyValues(parsed.companyValues);
        if (parsed.companyCulture) setCompanyCulture(parsed.companyCulture);
      }
    } catch (e) {
      console.error("Failed to load state", e);
    }
  }, []);

  // Save to LocalStorage on change (Auto-save)
  useEffect(() => {
    const state = {
      rawNotes,
      inputJobTitle,
      experienceLevel,
      jobFamily,
      companyMission,
      companyValues,
      companyCulture
    };
    localStorage.setItem('recruitAI_state', JSON.stringify(state));
  }, [rawNotes, inputJobTitle, experienceLevel, jobFamily, companyMission, companyValues, companyCulture]);

  // Dynamic Loading Messages
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (appState === AppState.GENERATING) {
      const messages = [
        "Analyzing your requirements...",
        "Identifying key skills and competencies...",
        "Evaluating company culture alignment...",
        "Crafting the perfect Job Description...",
        "Designing behavioral interview questions...",
        "Finalizing the recruitment package..."
      ];
      let i = 0;
      setLoadingMessage(messages[0]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [appState]);

  const handleGenerate = async () => {
    // Validation
    if (!rawNotes.trim()) {
      setErrors({ rawNotes: 'Please enter the key requirements or notes for the role.' });
      return;
    }
    setErrors({});

    setAppState(AppState.GENERATING);
    try {
      const companyContext: CompanyContext = {
        mission: companyMission,
        values: companyValues,
        culture: companyCulture,
        jobTitle: inputJobTitle,
        jobFamily: jobFamily as JobFamily || undefined
      };
      
      const data = await generateRecruitmentPackage(rawNotes, experienceLevel, companyContext);
      setResult(data);
      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
    }
  };

  const handleSaveDraft = () => {
    const draft = {
      rawNotes,
      inputJobTitle,
      experienceLevel,
      jobFamily,
      companyMission,
      companyValues,
      companyCulture,
      timestamp: Date.now()
    };
    localStorage.setItem('recruitAI_manual_draft', JSON.stringify(draft));
    setDraftMessage('Draft saved successfully!');
    setTimeout(() => setDraftMessage(null), 3000);
  };

  const handleLoadDraft = () => {
    try {
      const saved = localStorage.getItem('recruitAI_manual_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rawNotes !== undefined) setRawNotes(parsed.rawNotes);
        if (parsed.inputJobTitle !== undefined) setInputJobTitle(parsed.inputJobTitle);
        if (parsed.experienceLevel !== undefined) setExperienceLevel(parsed.experienceLevel);
        if (parsed.jobFamily !== undefined) setJobFamily(parsed.jobFamily);
        if (parsed.companyMission !== undefined) setCompanyMission(parsed.companyMission);
        if (parsed.companyValues !== undefined) setCompanyValues(parsed.companyValues);
        if (parsed.companyCulture !== undefined) setCompanyCulture(parsed.companyCulture);
        setDraftMessage('Draft loaded!');
        setTimeout(() => setDraftMessage(null), 3000);
      } else {
        setDraftMessage('No saved draft found.');
        setTimeout(() => setDraftMessage(null), 3000);
      }
    } catch (e) {
      console.error("Failed to load draft", e);
      setDraftMessage('Error loading draft.');
      setTimeout(() => setDraftMessage(null), 3000);
    }
  };

  const handleLoadResult = () => {
    try {
      const savedResult = localStorage.getItem('recruitAI_saved_result');
      if (savedResult) {
        const parsed = JSON.parse(savedResult) as GeneratedContent;
        setResult(parsed);
        setAppState(AppState.SUCCESS);
        setDraftMessage('Result loaded!');
        setTimeout(() => setDraftMessage(null), 3000);
      } else {
        setDraftMessage('No saved result found.');
        setTimeout(() => setDraftMessage(null), 3000);
      }
    } catch (e) {
      console.error("Failed to load result", e);
      setDraftMessage('Error loading result.');
      setTimeout(() => setDraftMessage(null), 3000);
    }
  };

  const jobFamilyOptions: JobFamily[] = [
    'Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Product', 'Design', 'Operations', 'Legal', 'Other'
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            RecruitAI Sandbox
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-4 text-sm text-slate-500">
          <span className="hidden sm:inline">Powered by Gemini 3 Pro</span>
          <div className="h-4 w-px bg-slate-300"></div>
          <span className="font-medium text-indigo-600">v1.4.0</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full flex flex-col lg:flex-row">
          
          {/* Left Panel: Input */}
          <div className={`
            flex-shrink-0 flex flex-col bg-white border-r border-slate-200 transition-all duration-500 ease-in-out z-20 overflow-y-auto
            ${appState === AppState.SUCCESS ? 'w-full lg:w-1/3 shadow-xl' : 'w-full lg:w-1/2 lg:mx-auto lg:translate-x-1/2'}
          `}>
            <div className={`p-6 transition-all duration-500 ${appState === AppState.SUCCESS ? '' : 'max-w-2xl w-full mx-auto my-auto'}`}>
              
              {/* Header Text & Draft Controls */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Role Definition</h2>
                  <p className="text-slate-500 text-sm">
                    Define your requirements. Our thinking model will analyze your inputs to build the perfect package.
                  </p>
                </div>
              </div>
              
              {/* Save/Load Controls Row */}
              <div className="mb-6 flex flex-wrap gap-2 relative">
                  <button 
                    onClick={handleSaveDraft}
                    className="p-2 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 flex items-center gap-2 text-xs font-medium shadow-sm"
                    title="Save current inputs"
                  >
                    <Save className="w-4 h-4" />
                    Save Draft
                  </button>
                  <button 
                    onClick={handleLoadDraft}
                    className="p-2 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 flex items-center gap-2 text-xs font-medium shadow-sm"
                    title="Load saved inputs"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Load Draft
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>
                   <button 
                    onClick={handleLoadResult}
                    className="p-2 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 flex items-center gap-2 text-xs font-medium shadow-sm"
                    title="Load previously generated results"
                  >
                    <FileText className="w-4 h-4" />
                    Load Result
                  </button>
                  
                  {draftMessage && (
                    <div className="absolute top-full left-0 mt-2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap z-50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
                      {draftMessage.includes('Error') || draftMessage.includes('No') ? null : <Check className="w-3 h-3 text-green-400" />}
                      {draftMessage}
                    </div>
                  )}
              </div>

              {/* Job Title & Family Group */}
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 mb-2">
                     <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Briefcase className="w-4 h-4 text-indigo-500" />
                        Job Title <span className="text-slate-400 font-normal">(Opt)</span>
                     </label>
                  </div>
                  <input
                    type="text"
                    value={inputJobTitle}
                    onChange={(e) => setInputJobTitle(e.target.value)}
                    placeholder="e.g. Senior Product Manager"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium placeholder-slate-400 text-sm"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                   <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      Job Family
                   </label>
                   <div className="relative">
                     <select 
                       value={jobFamily}
                       onChange={(e) => setJobFamily(e.target.value as JobFamily)}
                       className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer font-medium text-sm"
                     >
                       <option value="">Select Family...</option>
                       {jobFamilyOptions.map(fam => (
                         <option key={fam} value={fam}>{fam}</option>
                       ))}
                     </select>
                     <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                   </div>
                </div>
              </div>

              {/* Experience Level Selector */}
              <div className="mb-6">
                 <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    Target Experience Level
                 </label>
                 <div className="relative">
                   <select 
                     value={experienceLevel}
                     onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                     className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer font-medium"
                   >
                     <option value="Entry-Level">Entry-Level</option>
                     <option value="Mid-Level">Mid-Level</option>
                     <option value="Senior-Level">Senior-Level</option>
                     <option value="Lead/Executive">Lead/Executive</option>
                   </select>
                   <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                 </div>
              </div>

              {/* Company Context Section (Collapsible) */}
              <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setIsCompanyInfoOpen(!isCompanyInfoOpen)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Building2 className="w-4 h-4 text-indigo-500" />
                      Company DNA <span className="text-slate-400 font-normal">(Optional)</span>
                    </div>
                    <div className="group relative" onClick={(e) => e.stopPropagation()}>
                      <Info className="w-4 h-4 text-slate-400 cursor-help hover:text-indigo-500 transition-colors" />
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none">
                        Provide your mission and values to help Gemini tailor the tone and cultural emphasis of the Job Description and Interview questions.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                   </div>
                  </div>
                  {isCompanyInfoOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                
                {isCompanyInfoOpen && (
                  <div className="p-4 space-y-4 bg-white">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Mission Statement</label>
                      <input 
                        type="text" 
                        value={companyMission}
                        onChange={(e) => setCompanyMission(e.target.value)}
                        placeholder="e.g. To organize the world's information and make it universally accessible..."
                        className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Core Values</label>
                      <input 
                        type="text" 
                        value={companyValues}
                        onChange={(e) => setCompanyValues(e.target.value)}
                        placeholder="e.g. Move fast, Be bold, Customer obsession..."
                        className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Company Culture</label>
                      <textarea 
                        value={companyCulture}
                        onChange={(e) => setCompanyCulture(e.target.value)}
                        placeholder="e.g. Fast-paced, collaborative, remote-first, flat hierarchy..."
                        rows={2}
                        className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none placeholder-slate-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Raw Notes Input */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                   <Sparkles className="w-4 h-4 text-indigo-500" />
                   Role Raw Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rawNotes}
                  onChange={(e) => {
                    setRawNotes(e.target.value);
                    if (errors.rawNotes) setErrors({});
                  }}
                  placeholder="e.g. We need a Senior React Dev who loves UI/UX. Must know TypeScript, Tailwind, and have 5+ years experience. Hybrid role in SF. Team is small but fast-paced. We value ownership and curiosity..."
                  className={`w-full h-48 lg:h-64 p-4 rounded-xl border bg-slate-50 focus:bg-white focus:ring-4 transition-all resize-none font-mono text-sm leading-relaxed placeholder-slate-400 ${
                    errors.rawNotes 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' 
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                  }`}
                />
                {errors.rawNotes && (
                  <p className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1 animate-pulse">
                    <ChevronRight className="w-3 h-3" />
                    {errors.rawNotes}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={handleGenerate}
                  disabled={appState === AppState.GENERATING}
                  className={`
                    w-full py-4 px-6 rounded-xl font-semibold text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]
                    ${appState === AppState.GENERATING ? 'bg-slate-800 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/40'}
                  `}
                >
                  {appState === AppState.GENERATING ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Thinking deeply (Gemini 3 Pro)...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Recruitment Package
                    </>
                  )}
                </button>
              </div>

              {/* Status Messages */}
              {appState === AppState.GENERATING && (
                <div className="mt-6 p-4 rounded-lg bg-indigo-50 border border-indigo-100 animate-pulse">
                   <div className="flex items-center gap-3 text-indigo-800 font-medium mb-2">
                     <Bot className="w-5 h-5" />
                     <span>{loadingMessage}</span>
                   </div>
                   <div className="h-2 w-full bg-indigo-200 rounded-full overflow-hidden">
                     <div className="h-full w-1/3 bg-indigo-500 thinking-gradient rounded-full"></div>
                   </div>
                   <p className="text-xs text-indigo-600 mt-2 text-center">
                     Budgeting 32k tokens for reasoning & synthesis.
                   </p>
                </div>
              )}
               
              {appState === AppState.ERROR && (
                 <div className="mt-4 p-4 text-red-600 bg-red-50 rounded-lg text-sm text-center border border-red-100">
                   Something went wrong. Please check your inputs and try again.
                 </div>
              )}
            </div>
          </div>

          {/* Right Panel: Result */}
          {appState === AppState.SUCCESS && result && (
             <div className="flex-1 p-6 bg-slate-50 overflow-hidden animate-in fade-in slide-in-from-right-10 duration-700">
               <ResultDisplay content={result} />
             </div>
          )}
          
          {/* Placeholder for Initial State on Large Screens */}
          {appState === AppState.IDLE && (
            <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-50 opacity-50 pointer-events-none">
               <div className="text-center">
                 <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                   <Sparkles className="w-10 h-10 text-slate-400" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-400">Waiting for input</h3>
               </div>
            </div>
          )}

        </div>
      </main>

      {/* Chat Bot Assistant */}
      <ChatWidget content={result} />
    </div>
  );
};

export default App;