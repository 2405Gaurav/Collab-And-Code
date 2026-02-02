"use client";
import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/config/firebase";
import { UserPlus, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function SearchBar({ workspaceId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState(new Set());
  const auth = getAuth();
  const currentUserEmail = auth.currentUser?.email;
  
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceMembers();
    }
  }, [workspaceId]);

  useEffect(() => {
    if (searchTerm.length > 0) {
      fetchUsers(searchTerm.toLowerCase());
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const fetchWorkspaceMembers = async () => {
    try {
      const membersQuery = collection(db, `workspaces/${workspaceId}/members`);
      const membersSnapshot = await getDocs(membersQuery);
      const membersSet = new Set(membersSnapshot.docs.map(doc => doc.id));
      setWorkspaceMembers(membersSet);
    } catch (error) {
      // ✅ IMPROVED: Better error logging
      console.error("Error fetching workspace members:", {
        message: error?.message || "Unknown error",
        code: error?.code || "UNKNOWN",
        fullError: error
      });
      toast.error(`Failed to fetch members: ${error?.message || "Unknown error"}`);
    }
  };

  const fetchUsers = async (term) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        where("email", ">=", term),
        where("email", "<=", term + "\uf8ff")
      );

      const querySnapshot = await getDocs(q);
      let matchedUsers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter out current user and existing workspace members
      matchedUsers = matchedUsers.filter(user => user.email !== currentUserEmail && !workspaceMembers.has(user.id));

      setUsers(matchedUsers);
    } catch (error) {
      // ✅ IMPROVED: Better error logging
      console.error("Error fetching users:", {
        message: error?.message || "Unknown error",
        code: error?.code || "UNKNOWN",
        fullError: error
      });
      toast.error(`Failed to search users: ${error?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (userId, userEmail) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        invites: arrayUnion(workspaceId),
      });

      toast.success(`${userEmail} has been invited.`);
      setSearchTerm(""); // Clear search after invite
      setUsers([]);
    } catch (error) {
      // ✅ IMPROVED: Better error logging
      console.error("Error sending invitation:", {
        message: error?.message || "Unknown error",
        code: error?.code || "UNKNOWN",
        userId,
        userEmail,
        workspaceId,
        fullError: error
      });
      
      // ✅ IMPROVED: Provide user-friendly error messages based on error type
      if (error?.code === "permission-denied") {
        toast.error("Permission denied: You cannot invite users to this workspace");
      } else if (error?.message?.includes("arrayUnion")) {
        toast.error("Failed to add invite. Please try again.");
      } else {
        toast.error(`Failed to invite: ${error?.message || "Unknown error"}`);
      }
    }
  };

  return (
    <div className="relative flex items-center">
      <button 
        ref={buttonRef} 
        className="rounded-full transition flex items-start gap-2" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <UserPlus className="w-5 h-5 text-white" />Invite
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-10 right-0 bg-slate-800 p-4 rounded-lg shadow-lg w-96 z-50"
        >
          <div className="flex items-center border-b border-gray-600 pb-2">
            <input
              type="text"
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-white p-2 text-sm outline-none"
            />
            <button 
              className="ml-2 text-gray-400 hover:text-white" 
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading && <div className="text-gray-400 text-center mt-2">Loading...</div>}

          <div className="mt-2 max-h-60 overflow-y-auto">
            {users.length === 0 && !loading && searchTerm && (
              <div className="text-gray-400 text-center mt-2">No users found</div>
            )}
            {users.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-2 hover:bg-gray-800 rounded-md">
                <span className="text-white text-sm">{user.email}</span>
                <button
                  className="p-1 bg-blue-500 text-white rounded-md px-4 text-sm hover:bg-blue-600"
                  onClick={() => inviteUser(user.id, user.email)}
                >
                  Invite
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Toaster position="right-center" />
    </div>
  );
}