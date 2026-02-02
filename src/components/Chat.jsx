"use client";

import { useState, useEffect, useRef } from "react";
import { auth, firestore } from "@/config/firebase";
import {
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  where
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Sparkles, Trash2, X, Send, Command, Terminal, Cpu, Bot } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Animation variants for that "Senior Engineer" polish
const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } }
};

function Chatroom({ workspaceId, setIsChatOpen }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [error, setError] = useState(null);

  const userId = auth.currentUser?.uid;
  const name = auth.currentUser?.displayName || "Anonymous";

  const messagesEndRef = useRef(null);

  // --- LOGIC SECTION (Untouched Functionality) ---

  useEffect(() => {
    if (!workspaceId || !userId) {
      setLoading(false);
      setError("Missing workspace or user ID");
      return;
    }

    setLoading(true);
    setError(null);
    let unsubscribe = null;

    try {
      const messagesRef = collection(firestore, "messages");
      const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

      unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          try {
            const messagesData = snapshot.docs
              .map((doc) => ({ id: doc.id, ...doc.data() }))
              .filter((msg) => msg.workspaceId === workspaceId);

            setMessages(messagesData);
            setLoading(false);
            setError(null);
          } catch (err) {
            console.error("Error processing messages snapshot:", err);
            setError("Failed to process messages");
            setLoading(false);
          }
        },
        (error) => {
          console.error("Error in messages listener:", error);
          if (error?.code === 'permission-denied') {
            setError("Permission denied: You cannot access messages.");
            toast.error("Permission denied for messages");
          } else if (error?.code === 'unavailable') {
            setError("Firestore service unavailable.");
          } else {
            setError(`Error loading messages: ${error?.message}`);
          }
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Error setting up messages listener:", error);
      setError("Failed to connect to messages");
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (err) {
          console.debug("Listener cleanup error:", err?.message);
        }
      }
    };
  }, [workspaceId, userId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAIProcessing]);

  const generateAIResponse = async (prompt) => {
    setIsAIProcessing(true);
    try {
      const response = await fetch('/api/getChatResponse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, workspaceId }),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }
  
      const data = await response.json();
      return data.aiResponse || "I couldn't generate a response.";
    } catch (error) {
      console.error("AI API Error:", error);
      toast.error(`AI Error: ${error?.message}`);
      return "Sorry, I couldn't process that request.";
    } finally {
      setIsAIProcessing(false);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;
    if (!userId || !workspaceId) {
      toast.error("Not connected to workspace");
      return;
    }

    const imageUrl = auth.currentUser?.photoURL || "/robotic.png";
    const aiMatch = newMessage.match(/@(.+)/);
    let aiPrompt = null;
    let userMessage = newMessage;

    if (aiMatch) {
      aiPrompt = aiMatch[1].trim();
    }

    try {
      const messagesRef = collection(firestore, "messages");
      
      if (userMessage) {
        await addDoc(messagesRef, {
          text: userMessage,
          createdAt: serverTimestamp(),
          imageUrl,
          userId,
          name,
          workspaceId,
        });
      }

      if (aiPrompt) {
        const aiResponse = await generateAIResponse(aiPrompt);
        await addDoc(messagesRef, {
          text: `🤖 ${aiResponse}`,
          createdAt: serverTimestamp(),
          imageUrl: "/ai-avatar.png",
          userId: "AI_BOT",
          name: "CodeBot",
          workspaceId,
        });
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(`Failed to send message: ${error?.message}`);
    }
  };

  const clearChat = async () => {
    if (!workspaceId) {
      toast.error("Workspace not connected");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to clear all messages?");
    if (!confirmed) return;

    try {
      const messagesRef = collection(firestore, "messages");
      const querySnapshot = await getDocs(
        query(messagesRef, where("workspaceId", "==", workspaceId))
      );
      
      const deletePromises = querySnapshot.docs.map((docItem) => 
        deleteDoc(doc(messagesRef, docItem.id))
      );
      await Promise.all(deletePromises);
      
      setMessages([]);
      toast.success("Chat cleared!");
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast.error(`Failed to clear chat: ${error?.message}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- UI COMPONENTS ---

  const MessageBubble = ({ msg }) => {
    const isCurrentUser = msg.userId === userId;
    const isAI = msg.userId === "AI_BOT";
    const [copiedCode, setCopiedCode] = useState(null);

    const parseMessage = (text) => {
      const parts = [];
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let lastIndex = 0;
      let match;

      while ((match = codeBlockRegex.exec(text)) !== null) {
        const [fullMatch, lang, code] = match;
        const startIndex = match.index;
        const endIndex = codeBlockRegex.lastIndex;

        if (startIndex > lastIndex) {
          parts.push({ type: 'text', content: text.substring(lastIndex, startIndex) });
        }
        parts.push({ type: 'code', lang: lang || 'text', code: code.trim() });
        lastIndex = endIndex;
      }
      if (lastIndex < text.length) {
        parts.push({ type: 'text', content: text.substring(lastIndex) });
      }
      return parts;
    };

    const copyToClipboard = async (code, index) => {
      try {
        await navigator.clipboard.writeText(code);
        setCopiedCode(index);
        toast.success("Copied!");
        setTimeout(() => setCopiedCode(null), 2000);
      } catch (err) {
        toast.error("Failed to copy");
      }
    };

    return (
      <motion.div 
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        className={`flex w-full gap-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"} mb-6`}
      >
        {/* Avatar */}
        <div className="flex-shrink-0 mt-1">
          {isAI ? (
             <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-violet-400" />
             </div>
          ) : (
            <img
              src={msg.imageUrl || "/robotic.png"}
              alt="Avatar"
              className={`w-8 h-8 rounded-lg border border-white/10 object-cover ${isCurrentUser ? "ring-2 ring-zinc-700" : ""}`}
            />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col max-w-[85%] ${isCurrentUser ? "items-end" : "items-start"}`}>
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className={`text-[11px] font-medium tracking-wide ${isAI ? "text-violet-400" : "text-zinc-400"}`}>
              {isAI ? "AI Copilot" : msg.name}
            </span>
            {isAI && <span className="text-[10px] bg-violet-500/10 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/20">BOT</span>}
          </div>

          <div className={`
            relative py-3 px-4 text-sm rounded-xl border backdrop-blur-sm overflow-hidden
            ${isCurrentUser 
              ? "bg-zinc-800 text-zinc-100 border-zinc-700" 
              : isAI 
                ? "bg-zinc-900/60 text-zinc-200 border-violet-500/20 shadow-[0_0_15px_-3px_rgba(124,58,237,0.1)]" 
                : "bg-zinc-900/60 text-zinc-300 border-zinc-800"
            }
          `}>
            {parseMessage(msg.text).map((part, index) => {
              if (part.type === 'text') {
                return (
                  <span key={index} className="whitespace-pre-wrap leading-relaxed">
                    {part.content.replace("🤖", "").trim()}
                  </span>
                );
              }
              
              if (part.type === 'code') {
                return (
                  <div key={index} className="relative my-3 rounded-lg overflow-hidden border border-white/10 bg-[#050505] shadow-sm group">
                    {/* "Mac-style" Code Window Header */}
                    <div className="flex items-center justify-between px-3 py-2 bg-[#111] border-b border-white/5">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                        </div>
                        <span className="text-[10px] text-zinc-600 font-mono uppercase">{part.lang}</span>
                        <button
                          onClick={() => copyToClipboard(part.code, index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-800 rounded"
                        >
                          {copiedCode === index ? (
                            <CheckIcon className="h-3 w-3 text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="h-3 w-3 text-zinc-400" />
                          )}
                        </button>
                    </div>
                    <SyntaxHighlighter
                      language={part.lang}
                      style={vscDarkPlus}
                      customStyle={{
                        background: 'transparent',
                        padding: '1rem',
                        fontSize: '0.8rem',
                        margin: 0
                      }}
                      codeTagProps={{ style: { fontFamily: 'JetBrains Mono, Fira Code, monospace' } }}
                    >
                      {part.code}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </motion.div>
    );
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0a0a] border border-white/10 rounded-xl">
        <Sparkles className="h-6 w-6 text-violet-500 animate-pulse mb-3" />
        <p className="text-sm text-zinc-500 font-medium">Initializing workspace connection...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-zinc-100 font-sans border border-white/10 rounded-xl shadow-2xl overflow-hidden relative">
      
      {/* Background Grid Pattern (Subtle) */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center px-5 py-4 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-zinc-800/50 rounded-md border border-white/5">
            <Terminal className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-200 tracking-tight">Mission Control</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500/50"></span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">LIVE SYNC ACTIVE</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            onClick={clearChat}
            variant="ghost"
            className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Clear Terminal"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-zinc-800 mx-1"></div>
          <Button
            onClick={() => setIsChatOpen(false)}
            variant="ghost"
            className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 py-6 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-zinc-500"
            >
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 mb-4">
                <Bot className="h-8 w-8 text-zinc-600" />
              </div>
              <p className="font-medium text-zinc-400">Ready to collaborate</p>
              <p className="text-sm text-zinc-600 mt-1">Type <span className="text-violet-400 font-mono bg-violet-500/10 px-1 rounded">@</span> to summon AI</p>
            </motion.div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))
          )}
        </AnimatePresence>

        {isAIProcessing && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-1"
          >
             <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-violet-400 animate-spin-slow" />
             </div>
             <div className="flex gap-1 items-center bg-zinc-900/50 px-3 py-2 rounded-lg border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <span className="text-xs text-zinc-500 ml-2">Processing query...</span>
             </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-10 p-5 bg-[#0a0a0a] border-t border-white/5">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="relative group"
        >
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
             <Command className="w-4 h-4" />
          </div>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message or type @ for AI..."
            className="w-full bg-zinc-900/50 text-zinc-200 placeholder:text-zinc-600 border-zinc-800 rounded-xl pl-10 pr-12 py-6 focus-visible:ring-1 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50 transition-all shadow-inner"
            disabled={isAIProcessing}
          />
          
          <Button 
            type="submit" 
            disabled={isAIProcessing || !userId || !workspaceId || !newMessage.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-lg bg-zinc-800 hover:bg-violet-600 text-zinc-400 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-zinc-800"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="mt-2 text-[10px] text-zinc-600 flex justify-between px-1">
          <span>Markdown supported</span>
          <span>Shift + Enter for new line</span>
        </div>
      </div>

      {error && (
        <div className="absolute top-16 left-0 w-full bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-400 z-50 flex items-center justify-center">
           {error}
        </div>
      )}
    </div>
  );
}

export default Chatroom;