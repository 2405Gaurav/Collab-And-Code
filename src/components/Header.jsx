"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import InviteNotification from "./InviteNotification";
import { auth, db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Code2, ChevronLeft, Settings, LogOut, User } from "lucide-react";

const Header = ({ workspaceId }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch User Info
  useEffect(() => {
    const fetchUserInfo = async () => {
      const user = auth.currentUser;
      if (user) {
        setUserEmail(user.email);
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUserName(userSnap.data().displayName || user.displayName || "Developer");
          } else {
            setUserName(user.displayName || "Developer");
          }
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      }
    };

    fetchUserInfo();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isWorkspaceRoute = pathname.startsWith("/workspace/");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#050505]/75 backdrop-blur-xl supports-[backdrop-filter]:bg-[#050505]/60">
      <div className="flex items-center justify-between px-6 h-16 w-full">
        
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-5">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight group"
          >
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-1.5 rounded-lg shadow-[0_0_15px_-3px_rgba(124,58,237,0.3)] group-hover:shadow-[0_0_20px_-3px_rgba(124,58,237,0.5)] transition-all duration-300">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="text-zinc-100 hidden sm:inline group-hover:text-white transition-colors">
              Code & Collab
            </span>
          </Link>

          {/* Contextual Navigation (Breadcrumb style) */}
          {isWorkspaceRoute && (
            <div className="hidden sm:flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="h-6 w-[1px] bg-white/10 rotate-12 mx-1" />
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 h-8 px-3 text-sm rounded-full transition-all"
              >
                <ChevronLeft size={14} />
                <span>Dashboard</span>
              </Button>
            </div>
          )}
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-4">
          
          {/* Notifications */}
          <div className="flex items-center">
             <InviteNotification />
          </div>

          <div className="h-5 w-[1px] bg-white/10" />

          {/* Custom Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 group outline-none"
            >
              <div className="text-right hidden md:block">
                <p className="text-sm text-zinc-200 font-medium leading-none group-hover:text-white transition-colors">
                  {userName}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono mt-1 group-hover:text-zinc-400 transition-colors">
                  {userEmail}
                </p>
              </div>
              
              <Avatar className="w-9 h-9 border border-white/10 transition-all duration-300 group-hover:border-violet-500/50 group-hover:ring-2 group-hover:ring-violet-500/20">
                <AvatarImage src={auth.currentUser?.photoURL || "/robotic.png"} alt="Profile" />
                <AvatarFallback className="bg-zinc-900 text-zinc-400 text-xs font-medium">
                  {userName.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>

            {/* Dropdown Content */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-md border border-white/10 bg-[#0a0a0a] text-zinc-300 shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-2 border-b border-white/5 bg-[#0f0f0f]">
                  <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">My Account</p>
                </div>
                
                <div className="p-1">
                  <Link 
                    href="/profile" 
                    className="flex items-center w-full px-2 py-2 text-sm rounded-sm hover:bg-zinc-800 hover:text-white transition-colors group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings size={14} className="mr-2 group-hover:text-violet-400 transition-colors" />
                    Profile Settings
                  </Link>
                  
                  <Link 
                    href="/dashboard" 
                    className="flex items-center w-full px-2 py-2 text-sm rounded-sm hover:bg-zinc-800 hover:text-white transition-colors group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Code2 size={14} className="mr-2 group-hover:text-blue-400 transition-colors" />
                    My Workspaces
                  </Link>
                </div>
                
                <div className="h-[1px] bg-white/5 mx-1" />
                
                <div className="p-1">
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center w-full px-2 py-2 text-sm rounded-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    <LogOut size={14} className="mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;