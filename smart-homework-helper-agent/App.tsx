import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, X, Cpu, BookOpen, Layers } from 'lucide-react';
import { MessageBubble } from './components/MessageBubble';
import { ObservabilityPanel } from './components/ObservabilityPanel';
import { 
  runAgent1_Classifier, 
  runAgent2_Assessor, 
  runAgent3_SolverStream, 
  runAgent4_Practice 
} from './services/geminiService';
import { AgentLog, AgentStep, Message, StudentProfile } from './types';

// Mock Initial Student Profile
const INITIAL_PROFILE: StudentProfile = {
  id: 'Demo_Student_001',
  name: 'Alex',
  subjects: {},
  totalQuestions: 0,
  learningStyle: 'Visual'
};

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Smart Homework Helper Agent. \n\nI use a 4-agent system to provide personalized help: \n1. **Classifier Agent** 🔍 \n2. **Assessor Agent** 📊 \n3. **Solver Agent** ✏️ \n4. **Practice Agent** 📝 \n\nAsk me any homework question!',
      timestamp: Date.now()
    }
  ]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [currentStep, setCurrentStep] = useState<AgentStep>('idle');
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(INITIAL_PROFILE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentStep]);

  const addLog = (log: AgentLog) => {
    setLogs(prev => [...prev, log]);
  };

  const updateLog = (id: string, updates: Partial<AgentLog>) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, ...updates } : log));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || currentStep !== 'idle') return;

    const userQuestion = input.trim();
    setInput('');
    
    // Add User Message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: userQuestion, timestamp: Date.now() }]);

    // --- AGENT PIPELINE START ---
    
    // 1. CLASSIFIER AGENT
    setCurrentStep('classifying');
    const log1Id = `log-1-${Date.now()}`;
    addLog({
      id: log1Id,
      agentName: 'AGENT 1: SUBJECT CLASSIFIER',
      emoji: '🔍',
      timestamp: Date.now(),
      status: 'running',
      input: userQuestion
    });

    const startTime = Date.now();
    let classifierData;
    
    try {
      classifierData = await runAgent1_Classifier(userQuestion);
      updateLog(log1Id, { 
        status: 'success', 
        output: JSON.stringify(classifierData, null, 2),
        durationMs: Date.now() - startTime,
        metadata: { subject: classifierData.subject, topic: classifierData.topic, confidence: classifierData.confidence }
      });
    } catch (error) {
      updateLog(log1Id, { status: 'error', output: String(error) });
      setCurrentStep('idle');
      return;
    }

    // 2. ASSESSOR AGENT
    setCurrentStep('assessing');
    const log2Id = `log-2-${Date.now()}`;
    addLog({
      id: log2Id,
      agentName: 'AGENT 2: DIFFICULTY ASSESSOR',
      emoji: '📊',
      timestamp: Date.now(),
      status: 'running',
      input: `Subject: ${classifierData.subject}`
    });

    const startTime2 = Date.now();
    let assessorData;
    
    try {
      assessorData = await runAgent2_Assessor(userQuestion, classifierData);
      updateLog(log2Id, { 
        status: 'success', 
        output: JSON.stringify(assessorData, null, 2),
        durationMs: Date.now() - startTime2,
        metadata: { difficulty: assessorData.adjustedDifficulty, grade: assessorData.gradeLevel }
      });
    } catch (error) {
      updateLog(log2Id, { status: 'error', output: String(error) });
      setCurrentStep('idle');
      return;
    }

    // 3. SOLVER AGENT (Streamed)
    setCurrentStep('solving');
    const log3Id = `log-3-${Date.now()}`;
    addLog({
      id: log3Id,
      agentName: 'AGENT 3: SOLUTION GENERATOR',
      emoji: '✏️',
      timestamp: Date.now(),
      status: 'running',
      input: "Starting Step-by-Step Pedagogical Generation..."
    });

    const startTime3 = Date.now();
    const botMsgId = `bot-${Date.now()}`;
    // Create placeholder bot message
    setMessages(prev => [...prev, { id: botMsgId, role: 'assistant', content: '', timestamp: Date.now() }]);

    let fullSolutionText = '';
    try {
      const streamResult = await runAgent3_SolverStream(userQuestion, classifierData, assessorData);
      
      for await (const chunk of streamResult.stream) {
        const chunkText = chunk.text();
        fullSolutionText += chunkText;
        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: fullSolutionText } : m));
        // Auto scroll during stream
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }
      
      updateLog(log3Id, { 
        status: 'success', 
        output: "Markdown Generated Successfully",
        durationMs: Date.now() - startTime3,
        metadata: { length: fullSolutionText.length }
      });

    } catch (error) {
      updateLog(log3Id, { status: 'error', output: String(error) });
      setCurrentStep('idle');
      return;
    }

    // 4. PRACTICE AGENT
    setCurrentStep('generating_practice');
    const log4Id = `log-4-${Date.now()}`;
    addLog({
      id: log4Id,
      agentName: 'AGENT 4: PRACTICE GENERATOR',
      emoji: '📝',
      timestamp: Date.now(),
      status: 'running',
      input: "Generating related practice problems..."
    });

    const startTime4 = Date.now();
    try {
      const practiceText = await runAgent4_Practice(userQuestion, fullSolutionText);
      const combinedContent = fullSolutionText + '\n\n---\n\n' + practiceText;
      
      setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: combinedContent } : m));
      
      updateLog(log4Id, { 
        status: 'success', 
        output: "Practice Problems Appended",
        durationMs: Date.now() - startTime4,
      });
    } catch (error) {
       updateLog(log4Id, { status: 'error', output: String(error) });
    }

    // 5. MEMORY UPDATE
    setCurrentStep('updating_memory');
    const log5Id = `log-5-${Date.now()}`;
    addLog({
      id: log5Id,
      agentName: 'MEMORY SYSTEM',
      emoji: '🧠',
      timestamp: Date.now(),
      status: 'running',
      input: "Updating Student Profile..."
    });

    // Simulate Memory Update
    setStudentProfile(prev => ({
      ...prev,
      totalQuestions: prev.totalQuestions + 1,
    }));
    
    updateLog(log5Id, {
      status: 'success',
      output: "Profile Synced",
      durationMs: 150,
      metadata: { newTotal: studentProfile.totalQuestions + 1 }
    });

    setCurrentStep('idle');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Sidebar / Observability Panel (Desktop: Right Side, but conceptually logic view) */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[450px] transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out md:relative md:block shadow-2xl md:shadow-none`}>
        <div className="h-full w-full relative">
           <button 
             onClick={() => setIsSidebarOpen(false)}
             className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-white"
           >
             <X size={24} />
           </button>
           <ObservabilityPanel logs={logs} studentProfile={studentProfile} />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative w-full">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg">
               <BookOpen size={24} />
             </div>
             <div>
               <h1 className="font-bold text-gray-800 text-lg leading-tight">Smart Homework Helper</h1>
               <p className="text-xs text-gray-500 font-medium">Multi-Agent AI System • Kaggle Capstone</p>
             </div>
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <ActivityIcon status={currentStep} />
          </button>

          <div className="hidden md:flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-gray-700">STATUS</span>
                <span className={`text-xs flex items-center gap-1 ${currentStep === 'idle' ? 'text-green-600' : 'text-indigo-600'}`}>
                   <span className={`w-2 h-2 rounded-full ${currentStep === 'idle' ? 'bg-green-500' : 'bg-indigo-500 animate-pulse'}`}></span>
                   {currentStep === 'idle' ? 'READY' : currentStep.toUpperCase().replace('_', ' ')}
                </span>
             </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar bg-white"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
          ))}
          
          {currentStep !== 'idle' && (
            <div className="flex justify-start mb-6 animate-pulse">
               <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl rounded-tl-none border border-gray-100">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-500 font-medium">
                    {getStepLabel(currentStep)}
                  </span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto relative">
             <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a homework question (e.g., 'Help me solve 2x + 5 = 15')"
                  className="w-full pl-6 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-gray-800 placeholder-gray-400 transition-all"
                  disabled={currentStep !== 'idle'}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || currentStep !== 'idle'}
                  className={`absolute right-2 p-2 rounded-full transition-colors ${
                    !input.trim() || currentStep !== 'idle'
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                  }`}
                >
                  <Send size={20} />
                </button>
             </form>
             <div className="text-center mt-2">
                <p className="text-[10px] text-gray-400">
                   Powered by Gemini 2.5 • Agents: Classifier, Assessor, Solver, Practice
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Helper for mobile header icon
const ActivityIcon = ({ status }: { status: AgentStep }) => {
  if (status === 'idle') return <Layers size={24} />;
  return <Cpu size={24} className="animate-pulse text-indigo-600" />;
}

// Helper for step labels
const getStepLabel = (step: AgentStep) => {
  switch(step) {
    case 'classifying': return 'Agent 1: Classifying Subject...';
    case 'assessing': return 'Agent 2: Assessing Difficulty...';
    case 'solving': return 'Agent 3: Generating Solution...';
    case 'generating_practice': return 'Agent 4: Creating Practice Problems...';
    case 'updating_memory': return 'System: Updating Student Profile...';
    default: return 'Thinking...';
  }
}

export default App;
