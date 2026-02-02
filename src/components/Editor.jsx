"use client";
import { Moon, Sun, Sparkles, Wrench, File, Expand, Shrink, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import axios from "axios";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "@/constants";
import { Box } from "@chakra-ui/react";
import Output from "./Output";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import toast from "react-hot-toast";

export default function CodeEditor({ file }) {
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

  // ✅ Initialize code with proper default
  useEffect(() => {
    if (file) {
      fetchFileContent();
    } else {
      setUpdatedCode(CODE_SNIPPETS["javascript"] || "//Select a file to start coding..!");
    }
  }, [file]);

  // ✅ Better real-time sync with error handling
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
            console.error("Error processing file snapshot:", {
              message: error?.message,
              code: error?.code,
              fullError: error
            });
          }
        },
        (error) => {
          // ✅ Handle snapshot listener errors
          console.error("Error listening to file changes:", {
            message: error?.message,
            code: error?.code,
            fullError: error
          });
          
          if (error?.code === "permission-denied") {
            toast.error("You don't have permission to view this file");
          } else {
            toast.error(`Failed to sync file: ${error?.message}`);
          }
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up file listener:", {
        message: error?.message,
        code: error?.code,
        fullError: error
      });
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
          // ✅ Handle empty content
          setUpdatedCode(CODE_SNIPPETS[codeLanguage] || "");
        }
      } else {
        console.warn("File document not found:", file.id);
        toast.error("File not found");
      }
    } catch (error) {
      // ✅ Better error logging
      console.error("Error fetching file content:", {
        message: error?.message,
        code: error?.code,
        fileId: file?.id,
        workspaceId: file?.workspaceId,
        fullError: error
      });

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
    
    // ✅ Auto-save with proper error handling
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
      // ✅ Better error logging
      console.error("Error auto-saving file:", {
        message: error?.message,
        code: error?.code,
        fileId: file?.id,
        fullError: error
      });

      if (error?.code === "permission-denied") {
        console.warn("Auto-save permission denied for file:", file?.id);
      }
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
      // ✅ Better error logging
      console.error("Failed to generate documentation:", {
        message: error?.message,
        code: error?.code,
        fullError: error
      });
      
      toast.error(`Documentation generation failed: ${error?.message || "Unknown error"}`);
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
      // ✅ Better error logging
      console.error("Failed to fix syntax:", {
        message: error?.message,
        code: error?.code,
        fullError: error
      });
      
      toast.error(`Syntax fix failed: ${error?.message || "Unknown error"}`);
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

  // ✅ Better click-outside detection
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
    { name: "Dark", value: "vs-dark" },
    { name: "Light", value: "light" },
    { name: "High Contrast", value: "hc-black" },
  ];

  return (
    <div className={`bg-gray-900 m-2 h-[94%] rounded-xl p-3 ${isExpanded ? "fixed inset-0 z-50 m-0" : "relative"}`}>
      <Box className="relative h-full">
        <div className="flex h-full">
          <Box w={isExpanded ? "100%" : "78%"} transition="all 0.3s ease" className="bg-green-30 h-[100%]">
            <div className="flex justify-between items-center h-[10%] pr-12">
              {file && (
                <div className="flex items-center bg-gray-900 text-white px-4 max-h-[50px] rounded-md shadow-md border border-gray-700 w-40">
                  <File size={16} className="mr-2 text-green-400" />
                  <span className="text-sm text-gray-300 line-clamp-1">{file.name}</span>
                </div>
              )}
              <div className="flex gap-3 items-center">
                <div className="relative" ref={settingsRef}>
                  <button
                    className="flex items-center bg-gray-800 text-white p-2 rounded-full shadow-md hover:bg-gray-700 transition ring-1 ring-gray-600"
                    onClick={() => setShowSettings(!showSettings)}
                    aria-label="Editor settings"
                    title="Editor settings"
                  >
                    <Settings size={16} />
                  </button>
                  {showSettings && (
                    <div className="absolute left-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl p-3 space-y-3 z-50">
                      <div>
                        <label htmlFor="theme-selector" className="text-xs text-gray-300 mb-1 block">Theme</label>
                        <select
                          id="theme-selector"
                          name="theme"
                          className="w-full bg-gray-700 text-gray-200 text-xs p-1 rounded"
                          value={selectedTheme}
                          onChange={(e) => setSelectedTheme(e.target.value)}
                          aria-label="Select editor theme"
                        >
                          {themes.map((theme) => (
                            <option key={theme.value} value={theme.value}>
                              {theme.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="fontSize-slider" className="text-xs text-gray-300 mb-1 block">
                          Font Size: {fontSize}px
                        </label>
                        <input
                          id="fontSize-slider"
                          name="fontSize"
                          type="range"
                          min="10"
                          max="24"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-full bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          aria-label={`Font size: ${fontSize} pixels`}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <button
                  className="flex items-center gap-1.5 bg-blue-700 bg-opacity-20 ring-1 ring-blue-600 text-white px-3 py-1.5 rounded-full shadow-md hover:bg-blue-600 hover:bg-opacity-30 transition disabled:opacity-50 text-xs"
                  onClick={generateDocs}
                  disabled={isLoading}
                  title="Generate documentation for code"
                  aria-label="Generate documentation"
                >
                  <Sparkles size={14} /> {isLoading ? "Generating..." : "Docs"}
                </button>
                <button
                  className="flex items-center gap-1.5 bg-teal-600 bg-opacity-20 ring-1 ring-teal-600 text-white px-3 py-1.5 rounded-full shadow-md hover:bg-teal-600 hover:bg-opacity-30 transition disabled:opacity-50 text-xs"
                  onClick={fixSyntaxErrors}
                  disabled={isFixing}
                  title="Fix syntax errors"
                  aria-label="Fix syntax errors"
                >
                  <Wrench size={14} /> {isFixing ? "Fixing..." : "Fix"}
                </button>
                <button
                  className="flex items-center gap-1.5 bg-purple-600 bg-opacity-20 ring-1 ring-purple-600 text-white px-3 py-1.5 rounded-full shadow-md hover:bg-purple-600 hover:bg-opacity-30 transition text-xs"
                  onClick={toggleExpand}
                  title={isExpanded ? "Collapse editor" : "Expand editor"}
                  aria-label={isExpanded ? "Collapse editor" : "Expand editor"}
                >
                  {isExpanded ? (
                    <Shrink size={14} className="transition-transform" />
                  ) : (
                    <Expand size={14} className="transition-transform" />
                  )}
                  {isExpanded ? "Collapse" : "Expand"}
                </button>
              </div>
              <LanguageSelector language={codeLanguage} onSelect={onSelect} />
            </div>
            <Editor
              height={isExpanded ? "calc(100vh - 100px)" : "92%"}
              theme={selectedTheme}
              language={codeLanguage}
              defaultValue={CODE_SNIPPETS[codeLanguage] || "//Start coding..."}
              value={updatedCode}
              onMount={onMount}
              onChange={handleEditorChange}
              options={{
                fontSize: fontSize,
                wordWrap: "on",
                minimap: { enabled: false },
                bracketPairColorization: true,
                suggest: { preview: true },
                inlineSuggest: {
                  enabled: true,
                  showToolbar: "onHover",
                  mode: "subword",
                  suppressSuggestions: false,
                },
                quickSuggestions: { other: true, comments: true, strings: true },
                suggestSelection: "recentlyUsed",
              }}
            />
          </Box>
          {!isExpanded && <Output editorRef={editorRef} language={codeLanguage} />}
        </div>
      </Box>
    </div>
  );
}