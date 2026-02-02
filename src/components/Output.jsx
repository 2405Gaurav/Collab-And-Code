"use client";
import { useState, useRef, useEffect } from "react";
import { executeCode } from "../api";
import { Play, Loader2, Terminal, AlertTriangle, Trash2, CheckCircle2 } from "lucide-react";

const Output = ({ editorRef, language }) => {
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  
  // Auto-scroll to bottom when output changes
  const endOfOutputRef = useRef(null);
  
  useEffect(() => {
    endOfOutputRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;
    
    setIsLoading(true);
    // Reset state before running
    setIsError(false);
    
    try {
      const { run: result } = await executeCode(language, sourceCode);
      setOutput(result.output.split("\n"));
      result.stderr ? setIsError(true) : setIsError(false);
    } catch (error) {
      console.log(error);
      setIsError(true);
      setOutput(['Error: Failed to execute code. Check the API connection.']);
    } finally {
      setIsLoading(false);
    }
  };

  const clearOutput = () => {
    setOutput(null);
    setIsError(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-l border-white/5 w-[30%] min-w-[300px] shadow-xl relative z-10">
      
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0f0f0f]">
        <div className="flex items-center gap-2 text-zinc-400">
          <Terminal size={14} />
          <span className="text-xs font-bold uppercase tracking-wider">Console</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear Button */}
          {output && (
            <button 
              onClick={clearOutput}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
              title="Clear Console"
            >
              <Trash2 size={14} />
            </button>
          )}

          {/* Run Button */}
          <button
            onClick={runCode}
            disabled={isLoading}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold text-white transition-all
              ${isLoading 
                ? 'bg-zinc-800 cursor-not-allowed opacity-50' 
                : 'bg-violet-600 hover:bg-violet-500 shadow-[0_0_15px_-3px_rgba(124,58,237,0.5)]'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={12} className="fill-current" />
                <span>Run Code</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Output Area */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-[#0a0a0a] custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
             <div className="relative">
                <div className="h-8 w-8 rounded-full border-2 border-zinc-800 border-t-violet-500 animate-spin" />
             </div>
             <p className="text-xs animate-pulse">Compiling...</p>
          </div>
        ) : output ? (
          <div className="flex flex-col gap-1">
            
            {/* Status Badge */}
            <div className={`flex items-center gap-2 text-xs mb-3 pb-2 border-b border-white/5 ${isError ? 'text-red-400' : 'text-green-400'}`}>
               {isError ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
               <span>{isError ? 'Execution Failed' : 'Execution Successful'}</span>
            </div>

            {/* Logs */}
            {output.map((line, i) => (
              <div 
                key={i} 
                className={`
                  whitespace-pre-wrap break-words leading-relaxed
                  ${isError ? 'text-red-300' : 'text-zinc-300'}
                `}
              >
                <span className="select-none text-zinc-700 mr-3 text-xs opacity-50">{i + 1}</span>
                {line}
              </div>
            ))}
            <div ref={endOfOutputRef} />
          </div>
        ) : (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-60">
            <Terminal size={48} strokeWidth={1} className="mb-4 text-zinc-800" />
            <p className="text-sm">Ready to execute</p>
            <p className="text-xs mt-1">Click "Run Code" to see output</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Output;