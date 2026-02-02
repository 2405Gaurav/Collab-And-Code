"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import {
  Folder,
  FileCode,
  FilePlus,
  FolderPlus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Edit2,
  MoreHorizontal
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const NavPanel = ({ workspaceId, openFile }) => {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [folderStates, setFolderStates] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [creatingType, setCreatingType] = useState(null);
  const [creatingParentFolderId, setCreatingParentFolderId] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [renamingItem, setRenamingItem] = useState(null);
  const router = useRouter();

  const truncateName = (name) => {
    return name.length > 20 ? `${name.substring(0, 20)}...` : name;
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return; // Allow rendering but won't fetch data yet
    if (!workspaceId) return;

    let unsubscribeMembers, unsubscribeFolders, unsubscribeFiles;

    try {
      // Members listener
      const membersRef = collection(db, `workspaces/${workspaceId}/members`);
      unsubscribeMembers = onSnapshot(membersRef, (snapshot) => {
        const membersData = snapshot.docs.map((doc) => doc.data());
        const member = membersData.find((m) => m.userId === user.uid);
        if (member) setUserRole(member.role);
      });

      // Folders listener
      const foldersRef = collection(db, `workspaces/${workspaceId}/folders`);
      unsubscribeFolders = onSnapshot(foldersRef, (snapshot) => {
        const foldersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFolders(foldersData);
        // Initialize folder states only for new folders to preserve open/close state
        setFolderStates(prev => {
          const newState = { ...prev };
          foldersData.forEach(f => {
            if (newState[f.id] === undefined) newState[f.id] = false;
          });
          return newState;
        });
      });

      // Files listener
      const filesRef = collection(db, `workspaces/${workspaceId}/files`);
      unsubscribeFiles = onSnapshot(filesRef, (snapshot) => {
        setFiles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      });

    } catch (error) {
      console.error("Error setting up listeners:", error);
    }

    return () => {
      if (unsubscribeMembers) unsubscribeMembers();
      if (unsubscribeFolders) unsubscribeFolders();
      if (unsubscribeFiles) unsubscribeFiles();
    };
  }, [workspaceId]);

  const toggleFolder = (folderId) => {
    setFolderStates((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleDragStart = (e, item, type) => {
    e.stopPropagation();
    setDraggedItem({ id: item.id, type });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e, targetFolderId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem || draggedItem.id === targetFolderId) return;

    try {
      const isFolder = draggedItem.type === "folder";
      const collectionName = isFolder ? "folders" : "files";
      const fieldName = isFolder ? "parentFolderId" : "folderId";

      await updateDoc(
        doc(db, `workspaces/${workspaceId}/${collectionName}/${draggedItem.id}`),
        { [fieldName]: targetFolderId || null }
      );
      toast.success("Item moved");
    } catch (error) {
       toast.error("Permission denied");
    }
    setDraggedItem(null);
  };

  const createItem = async (folderid) => {
    if (!newItemName) {
      setCreatingType(null); // Cancel if empty
      return;
    }
    
    if (!auth.currentUser) return;

    try {
      const commonData = {
        name: newItemName,
        workspaceId,
        createdBy: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      if (creatingType === "folder") {
        await addDoc(collection(db, `workspaces/${workspaceId}/folders`), {
          ...commonData,
          parentFolderId: creatingParentFolderId,
        });
      } else {
        await addDoc(collection(db, `workspaces/${workspaceId}/files`), {
          ...commonData,
          folderId: creatingParentFolderId,
          content: "",
        });
      }
      setNewItemName("");
      setCreatingType(null);
      setCreatingParentFolderId(null);
      if (folderid) setFolderStates({ ...folderStates, [folderid]: true });

    } catch (error) {
      toast.error("Failed to create item");
    }
  };

  const renameItem = async () => {
    if (!renamingItem?.name) {
      setRenamingItem(null);
      return;
    }

    try {
      const collectionName = renamingItem.type === "folder" ? "folders" : "files";
      await updateDoc(
        doc(db, `workspaces/${workspaceId}/${collectionName}/${renamingItem.id}`),
        { name: renamingItem.name }
      );
      setRenamingItem(null);
    } catch (error) {
      toast.error("Permission denied");
    }
  };

  const deleteItem = async (type, id) => {
    if(!window.confirm("Delete this item permanently?")) return;

    try {
      if (type === "folders") {
        await deleteDoc(doc(db, `workspaces/${workspaceId}/folders/${id}`));
        // Note: Real production apps should use cloud functions to recursively delete sub-collections
        // For now, visual removal relies on the listener updating
        toast.success("Folder deleted");
      } else {
        await deleteDoc(doc(db, `workspaces/${workspaceId}/files/${id}`));
        toast.success("File deleted");
      }
    } catch (error) {
      toast.error("Permission denied");
    }
  };

  const renderFolder = (folder) => {
    const nestedFolders = folders.filter((f) => f.parentFolderId === folder.id);
    const folderFiles = files.filter((file) => file.folderId === folder.id);
    const isEditing = renamingItem?.id === folder.id;

    return (
      <div
        key={folder.id}
        className="select-none"
        draggable
        onDragStart={(e) => handleDragStart(e, folder, "folder")}
        onDragOver={(e) => handleDragOver(e)}
        onDrop={(e) => handleDrop(e, folder.id)}
      >
        <div className="flex items-center justify-between group hover:bg-white/5 px-2 py-1 cursor-pointer transition-colors border border-transparent hover:border-white/5 mx-1 rounded-sm">
          <div
            className="flex items-center flex-1 overflow-hidden"
            onClick={() => toggleFolder(folder.id)}
          >
            <span className="text-zinc-600 mr-1">
              {folderStates[folder.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <Folder size={14} className="mr-2 text-violet-400 fill-violet-400/20" />
            
            {isEditing ? (
              <input
                className="text-xs bg-black border border-violet-500 text-white px-1 py-0.5 rounded outline-none w-full"
                value={renamingItem.name}
                onChange={(e) => setRenamingItem({ ...renamingItem, name: e.target.value })}
                onBlur={renameItem}
                onKeyDown={(e) => e.key === "Enter" && renameItem()}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="text-sm text-zinc-300 truncate"
                onDoubleClick={() => setRenamingItem({ id: folder.id, name: folder.name, type: "folder" })}
              >
                {truncateName(folder.name)}
              </span>
            )}
          </div>

          {/* Hover Actions */}
          {(userRole === "contributor" || userRole === "owner") && !isEditing && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <FolderPlus
                size={13}
                className="text-zinc-500 hover:text-zinc-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingType("folder");
                  setCreatingParentFolderId(folder.id);
                  setNewItemName("");
                  setFolderStates({ ...folderStates, [folder.id]: true });
                }}
              />
              <FilePlus
                size={13}
                className="text-zinc-500 hover:text-zinc-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingType("file");
                  setCreatingParentFolderId(folder.id);
                  setNewItemName("");
                  setFolderStates({ ...folderStates, [folder.id]: true });
                }}
              />
              <Trash2
                size={13}
                className="text-zinc-500 hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem("folders", folder.id);
                }}
              />
            </div>
          )}
        </div>

        {/* Nested Content */}
        {folderStates[folder.id] && (
          <div className="pl-4 border-l border-white/5 ml-2.5">
            {creatingType && creatingParentFolderId === folder.id && (
              <div className="flex items-center px-2 py-1 gap-2 animate-in fade-in duration-200">
                {creatingType === 'folder' ? <Folder size={14} className="text-zinc-500"/> : <FileCode size={14} className="text-zinc-500"/>}
                <input
                  className="text-xs bg-black border border-violet-500/50 text-white px-1 py-0.5 rounded outline-none flex-1 min-w-0"
                  placeholder={`Name...`}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onBlur={() => createItem(folder.id)}
                  onKeyDown={(e) => e.key === "Enter" && createItem(folder.id)}
                  autoFocus
                />
              </div>
            )}
            {nestedFolders.map((nestedFolder) => renderFolder(nestedFolder))}
            {folderFiles.map((file) => renderFile(file))}
          </div>
        )}
      </div>
    );
  };

  const renderFile = (file) => {
    const isEditing = renamingItem?.id === file.id;

    return (
      <div
        key={file.id}
        className="flex items-center justify-between group hover:bg-white/5 px-2 py-1 rounded-sm cursor-pointer transition-colors mx-1"
        draggable
        onDragStart={(e) => handleDragStart(e, file, "file")}
        onDragOver={(e) => handleDragOver(e)}
        onDrop={(e) => handleDrop(e, null)}
        onClick={() => openFile(file)}
      >
        <div className="flex items-center flex-1 overflow-hidden">
          <FileCode size={14} className="mr-2 text-blue-400/80" />
          {isEditing ? (
            <input
              className="text-xs bg-black border border-violet-500 text-white px-1 py-0.5 rounded outline-none w-full"
              value={renamingItem.name}
              onChange={(e) => setRenamingItem({ ...renamingItem, name: e.target.value })}
              onBlur={renameItem}
              onKeyDown={(e) => e.key === "Enter" && renameItem()}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="text-sm text-zinc-400 group-hover:text-zinc-200 truncate transition-colors"
              onDoubleClick={(e) => {
                  e.stopPropagation();
                  setRenamingItem({ id: file.id, name: file.name, type: "file" });
              }}
            >
              {truncateName(file.name)}
            </span>
          )}
        </div>
        {(userRole === "contributor" || userRole === "owner") && !isEditing && (
          <Trash2
            size={13}
            className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              deleteItem("files", file.id);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#0a0a0a] text-zinc-300 h-full w-full flex flex-col font-sans">
      
      {/* Header Toolbar */}
      <div className="h-10 border-b border-white/5 flex items-center justify-between px-3 shrink-0 bg-[#0a0a0a]">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Explorer</span>
        
        {(userRole === "contributor" || userRole === "owner") && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setCreatingParentFolderId(null);
                setNewItemName("");
                setCreatingType(creatingType === "file" ? null : "file");
              }}
              className={`p-1 rounded hover:bg-white/10 transition-colors ${creatingType === 'file' && !creatingParentFolderId ? 'bg-white/10 text-white' : 'text-zinc-400'}`}
              title="New File"
            >
              <FilePlus size={15} />
            </button>
            <button
              onClick={() => {
                setCreatingParentFolderId(null);
                setNewItemName("");
                setCreatingType(creatingType === "folder" ? null : "folder");
              }}
              className={`p-1 rounded hover:bg-white/10 transition-colors ${creatingType === 'folder' && !creatingParentFolderId ? 'bg-white/10 text-white' : 'text-zinc-400'}`}
              title="New Folder"
            >
              <FolderPlus size={15} />
            </button>
          </div>
        )}
      </div>

      {/* File Tree */}
      <div
        className="flex-1 overflow-y-auto py-2 custom-scrollbar"
        onDragOver={(e) => handleDragOver(e)}
        onDrop={(e) => handleDrop(e, null)}
      >
        {/* Root Level Creation Input */}
        {creatingType && !creatingParentFolderId && (
          <div className="flex items-center px-3 py-1 gap-2 mb-1 animate-in slide-in-from-top-1">
             {creatingType === 'folder' ? <Folder size={14} className="text-violet-400"/> : <FileCode size={14} className="text-blue-400"/>}
             <input
              className="text-xs bg-black border border-violet-500 text-white px-2 py-1 rounded outline-none flex-1 shadow-[0_0_10px_-2px_rgba(124,58,237,0.3)]"
              placeholder={`Name...`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onBlur={() => createItem(null)}
              onKeyDown={(e) => e.key === "Enter" && createItem(null)}
              autoFocus
            />
          </div>
        )}

        {/* Root Folders */}
        {folders
          .filter((folder) => !folder.parentFolderId)
          .map((folder) => renderFolder(folder))}

        {/* Root Files */}
        {files
          .filter((file) => !file.folderId)
          .map((file) => renderFile(file))}
          
        {/* Empty State */}
        {folders.length === 0 && files.length === 0 && !creatingType && (
           <div className="flex flex-col items-center justify-center mt-10 text-zinc-600 gap-2">
              <span className="text-xs">No files yet.</span>
           </div>
        )}
      </div>
    </div>
  );
};

export default NavPanel;