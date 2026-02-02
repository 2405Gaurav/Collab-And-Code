"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { 
  Plus, 
  Trash2, 
  Globe, 
  Lock, 
  Loader2, 
  Layout, 
  Search, 
  MoreVertical 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import Header from "@/components/Header";
import ShowMembers from "@/components/Members";
import "react-toastify/dist/ReactToastify.css";

const toastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
};

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      // Optional: Add a small delay or check auth state persistence
      // router.push("/login"); 
      return;
    }

    const fetchWorkspaces = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "workspaces"));

        const workspaceData = await Promise.all(
          querySnapshot.docs.map(async (workspaceDoc) => {
            const membersRef = collection(
              db,
              `workspaces/${workspaceDoc.id}/members`
            );
            const membersSnapshot = await getDocs(membersRef);

            const userMemberData = membersSnapshot.docs.find(
              (doc) => doc.data().userId === user.uid
            );

            if (!userMemberData) return null;

            return {
              id: workspaceDoc.id,
              ...workspaceDoc.data(),
              role: userMemberData.data().role || "Unknown",
            };
          })
        );

        setWorkspaces(workspaceData.filter(Boolean));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [user]);

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim() || isCreating) return;

    try {
      setIsCreating(true);
      const workspaceRef = await addDoc(collection(db, "workspaces"), {
        name: workspaceName,
        isPublic,
        createdAt: new Date().toISOString(),
      });

      const membersRef = collection(db, `workspaces/${workspaceRef.id}/members`);
      await setDoc(doc(membersRef, user.uid), {
        userId: user.uid,
        role: "owner",
        displayName: user.displayName || "Unknown",
        photoURL: user.photoURL || "/robotic.png",
      });

      const cursorsRef = doc(db, `workspaces/${workspaceRef.id}`);
      await setDoc(cursorsRef, { cursors: {} }, { merge: true });

      setWorkspaces([
        ...workspaces,
        { id: workspaceRef.id, name: workspaceName, isPublic, role: "owner" },
      ]);
      toast.success("Workspace created successfully!", toastOptions);
      setIsOpen(false);
      setWorkspaceName("");
    } catch (error) {
      toast.error("Failed to create workspace.", toastOptions);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteWorkspace = async (workspaceId) => {
    const confirmationToast = toast(
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-white">Delete this workspace permanently?</span>
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toast.dismiss(confirmationToast)}
            className="text-zinc-400 hover:text-white h-8"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              try {
                setDeletingWorkspaceId(workspaceId);
                await deleteDoc(doc(db, `workspaces/${workspaceId}`));
                setWorkspaces(workspaces.filter((ws) => ws.id !== workspaceId));
                toast.success("Workspace deleted", toastOptions);
              } catch (error) {
                toast.error("Failed to delete", toastOptions);
              } finally {
                setDeletingWorkspaceId(null);
                toast.dismiss(confirmationToast);
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white h-8"
          >
            Delete
          </Button>
        </div>
      </div>,
      {
        ...toastOptions,
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        hideProgressBar: true,
      }
    );
  };

  const filteredWorkspaces = workspaces.filter(ws => 
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-violet-500/30 selection:text-violet-200">
      <ToastContainer theme="dark" />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="fixed top-0 left-0 right-0 h-96 bg-violet-950/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Wrapper */}
      <div className="relative z-10">
        <Header />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        
        {/* Dashboard Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Your Workspaces</h1>
            <p className="text-zinc-400 text-sm">Manage your projects and collaborators.</p>
          </div>

          <div className="flex w-full md:w-auto gap-3">
            <div className="relative group w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-violet-400 transition-colors" size={16} />
              <Input 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#111] border-white/10 focus:ring-violet-500/20 focus:border-violet-500/50 h-10 transition-all"
              />
            </div>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-[0_0_20px_-5px_rgba(124,58,237,0.3)] h-10 px-4">
                  <Plus size={18} className="mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#111] border border-white/10 text-white sm:max-w-md shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Create Workspace</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Workspace Name</Label>
                    <Input
                      placeholder="e.g. Portfolio Redesign"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="bg-zinc-900/50 border-white/10 focus:ring-violet-500/20 focus:border-violet-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Visibility</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        onClick={() => setIsPublic(true)}
                        className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 transition-all ${isPublic ? 'bg-violet-500/10 border-violet-500 text-violet-200' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-zinc-800'}`}
                      >
                        <Globe size={20} />
                        <span className="text-sm font-medium">Public</span>
                      </div>
                      <div 
                        onClick={() => setIsPublic(false)}
                        className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 transition-all ${!isPublic ? 'bg-violet-500/10 border-violet-500 text-violet-200' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-zinc-800'}`}
                      >
                        <Lock size={20} />
                        <span className="text-sm font-medium">Private</span>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsOpen(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWorkspace}
                    disabled={isCreating}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Project"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
                <div className="bg-zinc-800 p-4 rounded-full mb-4">
                  <Layout className="text-zinc-400" size={32} />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No workspaces found</h3>
                <p className="text-zinc-500 text-sm">Create a new project to get started.</p>
              </div>
            ) : (
              filteredWorkspaces.map((ws) => (
                <Card
                  key={ws.id}
                  className="group relative bg-[#111] border border-white/5 hover:border-violet-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-900/10 overflow-hidden"
                >
                  <Link href={`/workspace/${ws.id}`} className="block h-full">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ws.isPublic ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                            {ws.isPublic ? <Globe size={10} className="mr-1" /> : <Lock size={10} className="mr-1" />}
                            {ws.isPublic ? "Public" : "Private"}
                          </div>
                          
                          {/* Owner badge */}
                          {ws.role === 'owner' && (
                             <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 bg-zinc-900 px-2 py-1 rounded">Owner</span>
                          )}
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors line-clamp-1">
                          {ws.name}
                        </h2>
                        
                        <p className="text-zinc-500 text-xs mb-6 font-mono">ID: {ws.id.slice(0, 8)}...</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                         <div onClick={(e) => e.stopPropagation()}>
                            <ShowMembers workspaceId={ws.id} />
                         </div>
                         <div className="text-xs text-zinc-500 group-hover:hidden">
                            View Project →
                         </div>
                      </div>
                    </CardContent>
                  </Link>

                  {/* Context Actions (Delete) */}
                  {ws.role === "owner" && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-950/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          deleteWorkspace(ws.id);
                        }}
                        disabled={deletingWorkspaceId === ws.id}
                      >
                        {deletingWorkspaceId === ws.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;