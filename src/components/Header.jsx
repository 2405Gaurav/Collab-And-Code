"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import InviteNotification from "./InviteNotification";
import { auth, db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { LayoutDashboard, Code2, ChevronLeft } from "lucide-react";

const Header = ({ workspaceId }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(true);
  const [userName, setUserName] = useState("");

  // Fetch Workspace Privacy Settings
  useEffect(() => {
    if (!workspaceId) return;

    const fetchWorkspaceDetails = async () => {
      try {
        const workspaceRef = doc(db, "workspaces", workspaceId);
        const workspaceSnap = await getDoc(workspaceRef);

        if (workspaceSnap.exists()) {
          setIsPublic(workspaceSnap.data().isPublic ?? true);
        }
      } catch (error) {
        console.error("Error fetching workspace details:", error);
      }
    };

    fetchWorkspaceDetails();
  }, [workspaceId]);

  // Fetch User Info
  useEffect(() => {
    const fetchUserInfo = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUserName(userSnap.data().displayName || user.email);
          } else {
            setUserName(user.displayName || "User");
          }
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      }
    };

    fetchUserInfo();
  }, []);

  const isWorkspaceRoute = pathname.startsWith("/workspace/");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 h-16 max-w-[1920px] mx-auto">
        
        {/* Left: Logo or Back Navigation */}
        <div className="flex items-center gap-6">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity group"
          >
            <div className="bg-violet-600 p-1.5 rounded-lg group-hover:bg-violet-500 transition-colors">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="text-zinc-100 hidden sm:inline">Code & Collab</span>
          </Link>

          {/* Contextual Dashboard Navigation */}
          {isWorkspaceRoute && (
            <>
              <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="hidden sm:flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-white/5 h-9"
              >
                <ChevronLeft size={16} />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </Button>
            </>
          )}
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-4">
          
          {/* Notifications */}
          <div className="flex items-center">
             <InviteNotification />
          </div>

          <div className="h-6 w-[1px] bg-white/10" />

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs text-zinc-500 font-medium">Signed in as</p>
              <p className="text-sm text-zinc-200 font-medium truncate max-w-[150px]">{userName}</p>
            </div>

            <Link href="/profile">
              <Avatar className="w-9 h-9 border border-white/10 hover:border-violet-500/50 transition-all cursor-pointer ring-offset-2 ring-offset-[#0a0a0a] hover:ring-2 hover:ring-violet-600/20">
                <AvatarImage src={auth.currentUser?.photoURL || "/robotic.png"} alt="Profile" />
                <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">
                  {userName.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;