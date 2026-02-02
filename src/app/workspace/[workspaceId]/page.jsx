"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import Chat from "@/components/Chat";
import Editor from "@/components/Editor";
import SearchBar from "@/components/Searchbar";
import { MessageCircle, PanelLeftOpen, PanelLeftClose, ChevronRight, Home, Share2 } from "lucide-react";
import Header from "@/components/Header";
import ShowMembers from "@/components/Members";
import LiveCursor from "@/components/LiveCursor";
import NavPanel from "@/components/Navpanel";
import { motion, AnimatePresence } from "framer-motion"; // Optional: adds smooth sliding for chat

const Workspace = () => {
  const { workspaceId } = useParams();
  const [selectedFile, setSelectedFile] = useState(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [membersCount, setMembersCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) return;

      const workspaceRef = doc(db, "workspaces", workspaceId);
      const workspaceSnap = await getDoc(workspaceRef);

      if (workspaceSnap.exists()) {
        const workspaceData = workspaceSnap.data();
        setWorkspaceName(workspaceData.name);

        const membersRef = collection(db, `workspaces/${workspaceId}/members`);
        const membersSnap = await getDocs(membersRef);
        setMembersCount(membersSnap.size);
      } else {
        console.error("Workspace not found");
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-zinc-300 font-sans min-w-[1024px] overflow-hidden selection:bg-violet-500/30 selection:text-violet-200">
      
      {/* Global Header */}
      <div className="z-50 border-b border-white/5 bg-[#050505]">
        <Header workspaceId={workspaceId} />
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Side - File & Folder Panel */}
        <aside
          className={`transition-all duration-300 ease-in-out border-r border-white/5 bg-[#0a0a0a] flex flex-col h-full ${
            isNavOpen ? "w-[280px]" : "w-0 border-r-0"
          } overflow-hidden`}
        >
          <div className="opacity-100 min-w-[280px] h-full">
             <NavPanel workspaceId={workspaceId} openFile={setSelectedFile} />
          </div>
        </aside>

        {/* Main - Editor Content */}
        <main className="flex-1 h-full flex flex-col bg-[#050505] relative">
          
          {/* Editor Toolbar */}
          <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#050505] select-none">
            
            {/* Left: Navigation & Breadcrumbs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500 hover:text-zinc-100 transition-colors"
                title="Toggle Sidebar"
              >
                {isNavOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              </button>

              <div className="h-4 w-[1px] bg-white/10 mx-1" />

              <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                 <span className="hover:text-zinc-300 transition-colors cursor-pointer">{workspaceName || "Loading..."}</span>
                 {selectedFile && (
                   <>
                    <ChevronRight size={14} className="text-zinc-700" />
                    <span className="text-violet-400 flex items-center gap-2">
                      {selectedFile.name}
                    </span>
                   </>
                 )}
              </div>
            </div>

            {/* Right: Tools */}
            <div className="flex items-center gap-3">
                <div className="w-64 relative">
                   <SearchBar workspaceId={workspaceId} />
                </div>
                
                <div className="h-4 w-[1px] bg-white/10 mx-1" />
                
                <div className="flex items-center">
                  <ShowMembers workspaceId={workspaceId} />
                </div>
                
                <button className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-[0_0_15px_-5px_rgba(124,58,237,0.5)] flex items-center gap-2">
                   <Share2 size={12} /> Share
                </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 overflow-hidden relative bg-[#050505]">
            <Editor file={selectedFile} />
          </div>
        </main>

        {/* Chat Panel (Sliding overlay) */}
        <div 
            className={`fixed top-[calc(64px+48px)] bottom-0 right-0 z-40 w-[400px] bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/5 shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
              isChatOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <div className="h-full flex flex-col">
            <div className="h-10 border-b border-white/5 flex items-center justify-between px-4">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">AI Assistant</span>
              <button onClick={() => setIsChatOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                 <ChevronRight size={16} />
              </button>
            </div>
            {isChatOpen && (
              <Chat workspaceId={workspaceId} isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />
            )}
          </div>
        </div>

      </div>

      {/* Floating Chat Toggle (Only visible when closed) */}
      <AnimatePresence>
        {!isChatOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="fixed bottom-8 right-8 z-50 p-4 bg-violet-600 hover:bg-violet-500 text-white rounded-full shadow-[0_0_30px_-5px_rgba(124,58,237,0.6)] border border-violet-400/20 transition-all group"
              onClick={() => setIsChatOpen(true)}
            >
             <MessageCircle className="h-6 w-6 fill-white/20" />
             <span className="absolute right-full mr-4 bg-zinc-900 text-zinc-300 text-xs py-1 px-2 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Open AI Chat
             </span>
          </motion.button>
        )}
      </AnimatePresence>

      <LiveCursor workspaceId={workspaceId} />
    </div>
  );
};

export default Workspace;