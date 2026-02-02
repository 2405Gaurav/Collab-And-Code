"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/config/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogTitle, 
  DialogDescription,
  DialogHeader,
  DialogFooter 
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logout from "@/helpers/logoutHelp";
import { 
  ArrowLeft, 
  LogOut, 
  KeyRound, 
  Mail, 
  Check, 
  X, 
  Loader2 
} from "lucide-react";

const toastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invites, setInvites] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setEmail(currentUser.email);
        fetchInvites(currentUser.uid);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchInvites = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setInvites(userSnap.data().invites || []);
      }
    } catch (error) {
      console.error("Error fetching invites:", error);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset link sent to your email!", toastOptions);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Error sending password reset email", toastOptions);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async (workspaceId) => {
    if (!user) return;

    try {
      const membersRef = doc(db, `workspaces/${workspaceId}/members`, user.uid);
      await setDoc(membersRef, {
        userId: user.uid,
        role: "contributor",
        displayName: user.displayName || "Unknown",
        photoURL: user.photoURL || "/robotic.png",
      });

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        invites: arrayRemove(workspaceId),
      });

      setInvites(invites.filter((id) => id !== workspaceId));
      toast.success("Joined workspace successfully!", toastOptions);
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast.error("Error joining workspace", toastOptions);
    }
  };

  const handleDeleteInvite = async (workspaceId) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        invites: arrayRemove(workspaceId),
      });

      setInvites(invites.filter((id) => id !== workspaceId));
      toast.info("Invite declined", toastOptions);
    } catch (error) {
      console.error("Error deleting invite:", error);
      toast.error("Error declining invite", toastOptions);
    }
  };

  const isGoogleUser = user && user.providerData.some((provider) => provider.providerId === "google.com");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-violet-500/30 selection:text-violet-200 flex items-center justify-center p-6 relative overflow-hidden">
      <ToastContainer theme="dark" />

      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-0 left-0 right-0 h-96 bg-violet-950/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[#111]/80 border border-white/10 backdrop-blur-xl shadow-2xl shadow-violet-900/10 z-10 rounded-xl overflow-hidden">
        
        {/* Header / Avatar */}
        <div className="relative pt-12 pb-8 px-6 flex flex-col items-center bg-gradient-to-b from-white/5 to-transparent">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 text-zinc-400 hover:text-white hover:bg-white/5"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft size={20} />
            </Button>
            
            <div className="p-1 rounded-full ring-2 ring-violet-500/30 bg-[#111] mb-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user?.photoURL || "/robotic.png"} alt="Profile" />
                <AvatarFallback className="bg-zinc-800 text-zinc-400 text-2xl">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <h1 className="text-xl font-bold tracking-tight text-white">{user?.displayName || "Anonymous User"}</h1>
            <p className="text-sm text-zinc-500 font-medium">{user?.email}</p>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Action Buttons */}
          <div className="space-y-3">
            {!isGoogleUser && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white h-11">
                    <KeyRound size={16} className="mr-3 text-zinc-500" />
                    Reset Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#111] border border-white/10 text-white sm:max-w-md shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Reset Password</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Enter your email to receive a password reset link.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-zinc-900/50 border-white/10 text-white focus:border-violet-500/50 focus:ring-violet-500/20"
                    />
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsDialogOpen(false)}
                      className="text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordReset}
                      disabled={isLoading}
                      className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Link"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Button
              variant="outline"
              onClick={logout}
              className="w-full justify-start border-red-900/30 text-red-400 hover:text-red-300 hover:bg-red-950/30 hover:border-red-900/50 h-11"
            >
              <LogOut size={16} className="mr-3" />
              Sign Out
            </Button>
          </div>

          <div className="border-t border-white/10 my-4"></div>

          {/* Invitations Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
                <Mail size={16} className="text-violet-400" />
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Invitations</h2>
                {invites.length > 0 && (
                    <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {invites.length}
                    </span>
                )}
            </div>
            
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {invites.length > 0 ? (
                invites.map((workspaceId) => (
                  <div key={workspaceId} className="bg-zinc-900/50 border border-white/5 p-3 rounded-lg flex justify-between items-center group hover:border-violet-500/30 transition-colors">
                    <div className="flex flex-col">
                        <span className="text-xs text-zinc-500 uppercase">Workspace ID</span>
                        <span className="text-sm text-zinc-300 font-mono truncate max-w-[120px]">{workspaceId.slice(0, 8)}...</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20"
                        onClick={() => handleAcceptInvite(workspaceId)}
                        title="Accept"
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20"
                        onClick={() => handleDeleteInvite(workspaceId)}
                        title="Decline"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border border-dashed border-white/5 rounded-lg bg-white/[0.02]">
                    <p className="text-sm text-zinc-500">No pending invitations</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;