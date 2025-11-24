import React from 'react';
import { AgentLog, StudentProfile } from '../types';
import { Terminal, Activity, Brain, Clock, ShieldCheck, Database } from 'lucide-react';

interface ObservabilityPanelProps {
  logs: AgentLog[];
  studentProfile: StudentProfile;
}

export const ObservabilityPanel: React.FC<ObservabilityPanelProps> = ({ logs, studentProfile }) => {
  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-300 font-mono text-xs md:text-sm border-l border-slate-700 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2 text-emerald-400">
          <Activity size={16} />
          <span className="font-bold tracking-wider">SYSTEM OBSERVABILITY</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-900 text-emerald-300">
             LIVE
           </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-px bg-slate-700 shrink-0">
        <div className="bg-slate-900 p-3">
           <div className="text-slate-500 mb-1 flex items-center gap-1"><Clock size={12}/> AVG LATENCY</div>
           <div className="text-white font-bold text-lg">~4.2s</div>
        </div>
        <div className="bg-slate-900 p-3">
           <div className="text-slate-500 mb-1 flex items-center gap-1"><Brain size={12}/> AGENTS ACTIVE</div>
           <div className="text-white font-bold text-lg">4/4</div>
        </div>
        <div className="bg-slate-900 p-3">
           <div className="text-slate-500 mb-1 flex items-center gap-1"><ShieldCheck size={12}/> SAFETY SCORE</div>
           <div className="text-emerald-400 font-bold text-lg">100%</div>
        </div>
        <div className="bg-slate-900 p-3">
           <div className="text-slate-500 mb-1 flex items-center gap-1"><Database size={12}/> MEMORY OPS</div>
           <div className="text-white font-bold text-lg">{studentProfile.totalQuestions}</div>
        </div>
      </div>

      {/* Logs Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {logs.length === 0 && (
          <div className="text-slate-600 text-center mt-10 italic">
            Waiting for agent activity...
          </div>
        )}

        {logs.map((log) => (
          <div key={log.id} className="border border-slate-700 rounded bg-slate-800/50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Log Header */}
            <div className={`px-3 py-2 flex items-center justify-between border-b border-slate-700 ${
              log.status === 'running' ? 'bg-slate-800' : 
              log.status === 'success' ? 'bg-emerald-950/30' : 'bg-red-950/30'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{log.emoji}</span>
                <span className={`font-bold ${log.status === 'running' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {log.agentName}
                </span>
              </div>
              <span className="text-slate-500 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>

            {/* Log Content */}
            <div className="p-3 space-y-2">
              {log.status === 'running' && (
                <div className="flex items-center gap-2 text-yellow-500 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  Processing...
                </div>
              )}

              {log.metadata && (
                <div className="grid grid-cols-1 gap-1">
                   {Object.entries(log.metadata).map(([key, value]) => (
                     <div key={key} className="flex gap-2 text-[10px]">
                       <span className="text-indigo-300 w-24 shrink-0 font-semibold uppercase">{key}:</span>
                       <span className="text-slate-300 font-mono truncate">
                         {Array.isArray(value) ? `[${value.length} items]` : String(value)}
                       </span>
                     </div>
                   ))}
                </div>
              )}

              {log.output && (
                <div className="mt-2 pt-2 border-t border-slate-700/50">
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Output Payload</p>
                  <pre className="text-[10px] text-green-300 overflow-x-auto whitespace-pre-wrap break-all font-mono bg-black/20 p-2 rounded">
                    {log.output.substring(0, 300) + (log.output.length > 300 ? '...' : '')}
                  </pre>
                </div>
              )}
              
              {log.durationMs && (
                <div className="text-[10px] text-slate-500 text-right mt-1">
                  Latency: {log.durationMs}ms
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Student Profile Snapshot */}
      <div className="bg-slate-800 p-3 border-t border-slate-700 shrink-0">
        <div className="flex items-center gap-2 mb-2 text-indigo-400">
          <Database size={14} />
          <span className="font-bold">MEMORY STATE</span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          <div>ID: {studentProfile.id}</div>
          <div>Style: {studentProfile.learningStyle}</div>
          <div>Stats: {studentProfile.totalQuestions} Interactions</div>
        </div>
      </div>
    </div>
  );
};
