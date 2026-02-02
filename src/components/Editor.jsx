"use client";
import { Sparkles, Wrench, FileCode2, Expand, Shrink, Settings, Cpu, ChevronDown, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import axios from "axios";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "@/constants";
import Output from "./Output";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function CodeEditor({ file }) {
  // --- STATE & LOGIC (Untouched) ---
  const [selectedTheme, setSelectedTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [updatedCode, setUpdatedCode] = useState("//Select a file to start coding..!");
  const [isFixing, setIsFixing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const monaco = useMonaco();
  const timeoutRef = useRef(null);
  const editorRef = useRef();
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const settingsRef = useRef(null);

  useEffect(() => {
    if (file) {
      fetchFileContent();
    } else {
      setUpdatedCode(CODE_SNIPPETS["javascript"] || "//Select a file to start coding..!");
    }
  }, [file]);

  useEffect(() => {
    if (!file?.id || !file?.workspaceId) return;

    try {
      const filePath = `workspaces/${file.workspaceId}/files`;
      const fileRef = doc(db, filePath, file.id);

      const unsubscribe = onSnapshot(
        fileRef,
        (snapshot) => {
          try {
            if (snapshot.exists()) {
              const data = snapshot.data();
              if (data?.content && data.content !== updatedCode) {
                setUpdatedCode(data.content);
              }
            }
          } catch (error) {
            console.error("Error processing file snapshot:", error);
          }
        },
        (error) => {
          console.error("Error listening to file changes:", error);
          if (error?.code === "permission-denied") {
            toast.error("You don't have permission to view this file");
          } else {
            toast.error(`Failed to sync file: ${error?.message}`);
          }
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up file listener:", error);
    }
  }, [file]);

  const fetchFileContent = async () => {
    if (!file?.id || !file?.workspaceId) return;
    try {
      const filePath = `workspaces/${file.workspaceId}/files`;
      const fileRef = doc(db, filePath, file.id);
      const fileSnap = await getDoc(fileRef);

      if (fileSnap.exists()) {
        const content = fileSnap.data()?.content;
        if (content) {
          setUpdatedCode(content);
        } else {
          setUpdatedCode(CODE_SNIPPETS[codeLanguage] || "");
        }
      } else {
        console.warn("File document not found:", file.id);
        toast.error("File not found");
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
      if (error?.code === "permission-denied") {
        toast.error("Permission denied: You cannot access this file");
      } else {
        toast.error(`Failed to load file: ${error?.message}`);
      }
    }
  };

  const handleEditorChange = (value) => {
    if (!value) return;
    setUpdatedCode(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => autoSaveFile(value), 500);
  };

  const autoSaveFile = async (content) => {
    if (!file?.id || !file?.workspaceId) {
      console.warn("Cannot auto-save: Missing file or workspace ID");
      return;
    }

    try {
      const filePath = `workspaces/${file.workspaceId}/files`;
      const fileRef = doc(db, filePath, file.id);
      
      await updateDoc(fileRef, { 
        content,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error auto-saving file:", error);
    }
  };

  const onSelect = (codeLanguage) => {
    setCodeLanguage(codeLanguage);
    if (!file) {
      setUpdatedCode(CODE_SNIPPETS[codeLanguage] || "");
    }
  };

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const generateDocs = async () => {
    if (!updatedCode || updatedCode.trim() === "") {
      toast.error("No code to document. Write some code first!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post("/api/generate-documentation", { 
        code: updatedCode, 
        language: codeLanguage 
      });
      
      if (res.data?.documentation) {
        const documentation = res.data.documentation;
        const commentedDocs = `\n\n${documentation}`;
        setUpdatedCode((prevCode) => prevCode + commentedDocs);
        toast.success("Documentation generated!");
      } else {
        toast.error("No documentation generated");
      }
    } catch (error) {
      console.error("Failed to generate documentation:", error);
      toast.error(`Documentation generation failed: ${error?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fixSyntaxErrors = async () => {
    if (!updatedCode || updatedCode.trim() === "") {
      toast.error("No code to fix. Write some code first!");
      return;
    }

    setIsFixing(true);
    try {
      const res = await axios.post("/api/get-errors", { 
        code: updatedCode, 
        codeLanguage 
      });
      
      if (res.data?.fixedCode) {
        setUpdatedCode(res.data.fixedCode);
        toast.success("Syntax errors fixed!");
      } else if (res.data?.message) {
        toast.info(res.data.message);
      } else {
        toast.info("No syntax errors found");
      }
    } catch (error) {
      console.error("Failed to fix syntax:", error);
      toast.error(`Syntax fix failed: ${error?.message}`);
    } finally {
      setIsFixing(false);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setTimeout(() => {
      editorRef.current?.layout();
    }, 100);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    if (showSettings) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettings]);

  const themes = [
    { name: "Dark Modern", value: "vs-dark" },
    { name: "Light Modern", value: "light" },
    { name: "High Contrast", value: "hc-black" },
  ];

  // --- RENDER ---
  return (
    <div className={`
      flex flex-col bg-[#0a0a0a] border border-white/10 overflow-hidden transition-all duration-300
      ${isExpanded ? "fixed inset-0 z-50 m-0 rounded-none" : "relative h-[94%] rounded-xl m-2 shadow-2xl"}
    `}>
      
      {/* --- Toolbar / Header --- */}
      <div className="flex justify-between items-center h-12 px-4 bg-[#0a0a0a] border-b border-white/5 backdrop-blur-xl">
        
        {/* File Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-md border border-white/5">
            <FileCode2 size={14} className="text-blue-400" />
            <span className="text-xs font-medium text-zinc-300 font-mono">
              {file ? file.name : "No File Selected"}
            </span>
          </div>
          
          <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
          
          <div className="hidden sm:block">
            <LanguageSelector language={codeLanguage} onSelect={onSelect} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          
          {/* AI Tools Group */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5 mr-2">
            <button
              onClick={generateDocs}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-violet-300 hover:text-white hover:bg-violet-600/20 rounded-md transition-all disabled:opacity-50"
              title="Generate AI Documentation"
            >
              <Sparkles size={13} className={isLoading ? "animate-pulse" : ""} />
              <span className="hidden sm:inline">{isLoading ? "Writing Docs..." : "Add Docs"}</span>
            </button>
            <div className="w-px h-3 bg-white/10"></div>
            <button
              onClick={fixSyntaxErrors}
              disabled={isFixing}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:text-white hover:bg-emerald-600/20 rounded-md transition-all disabled:opacity-50"
              title="Fix Syntax Errors"
            >
              <Wrench size={13} className={isFixing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{isFixing ? "Fixing..." : "Debug"}</span>
            </button>
          </div>

          {/* Settings & View Controls */}
          <div className="flex items-center gap-2" ref={settingsRef}>
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-md transition-all duration-200 border ${showSettings ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "text-zinc-500 border-transparent hover:bg-white/5 hover:text-zinc-300"}`}
                title="Editor Settings"
              >
                <Settings size={16} />
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-64 p-4 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-2 mb-4 text-zinc-400">
                      <Cpu size={14} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Editor Config</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">THEME</label>
                        <div className="relative">
                          <select
                            value={selectedTheme}
                            onChange={(e) => setSelectedTheme(e.target.value)}
                            className="w-full bg-zinc-900 text-zinc-300 text-xs px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                          >
                            {themes.map((theme) => (
                              <option key={theme.value} value={theme.value}>{theme.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[11px] text-zinc-500 font-medium">FONT SIZE</label>
                          <span className="text-[10px] text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="24"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={toggleExpand}
              className="p-2 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 rounded-md transition-colors"
              title={isExpanded ? "Collapse View" : "Expand View"}
            >
              {isExpanded ? <Shrink size={16} /> : <Expand size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Editor Wrapper */}
        <div className={`transition-all duration-300 ${isExpanded ? "w-full" : "w-[75%]"} flex flex-col relative`}>
          <Editor
            height="100%"
            theme={selectedTheme}
            language={codeLanguage}
            defaultValue={CODE_SNIPPETS[codeLanguage] || "//Start coding..."}
            value={updatedCode}
            onMount={onMount}
            onChange={handleEditorChange}
            loading={
              <div className="flex items-center justify-center h-full text-zinc-500 gap-2">
                <Cpu className="animate-spin" size={18} />
                <span className="text-sm">Initializing Monaco...</span>
              </div>
            }
            options={{
              fontSize: fontSize,
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
              fontLigatures: true,
              wordWrap: "on",
              minimap: { enabled: false },
              padding: { top: 24, bottom: 24 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              bracketPairColorization: { enabled: true },
              suggest: { 
                preview: true,
                showIcons: true 
              },
              inlineSuggest: { enabled: true },
              guides: { 
                indentation: true, 
                bracketPairs: true 
              },
            }}
          />
          
          {/* Status Bar Overlay */}
          <div className="absolute bottom-2 right-4 flex items-center gap-2 pointer-events-none">
            {updatedCode !== CODE_SNIPPETS[codeLanguage] && (
               <div className="flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur text-emerald-500 text-[10px] px-2 py-1 rounded-full border border-emerald-500/20 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle2 size={10} />
                  <span>Autosaved</span>
               </div>
            )}
          </div>
        </div>

        {/* Output Panel - Collapsible/Conditional */}
        <AnimatePresence>
          {!isExpanded && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "25%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-white/5 bg-[#0e0e0e]"
            >
              <Output editorRef={editorRef} language={codeLanguage} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}