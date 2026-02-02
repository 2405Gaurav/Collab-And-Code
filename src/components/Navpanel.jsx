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
  File,
  PlusCircle,
  Trash,
  ChevronDown,
  ChevronRight,
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

  // ✅ IMPROVED: Better useEffect with error handling
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }

    if (!workspaceId) {
      console.warn("Missing workspaceId");
      return;
    }

    let unsubscribeMembers, unsubscribeFolders, unsubscribeFiles;

    try {
      // Members listener
      const membersRef = collection(db, `workspaces/${workspaceId}/members`);
      unsubscribeMembers = onSnapshot(
        membersRef,
        (snapshot) => {
          try {
            const membersData = snapshot.docs.map((doc) => doc.data());
            const member = membersData.find((m) => m.userId === user.uid);
            if (member) {
              setUserRole(member.role);
            }
          } catch (err) {
            console.error("Error processing members snapshot:", err);
          }
        },
        (error) => {
          console.error("Error listening to members:", {
            message: error?.message,
            code: error?.code,
            fullError: error
          });
        }
      );

      // Folders listener
      const foldersRef = collection(db, `workspaces/${workspaceId}/folders`);
      unsubscribeFolders = onSnapshot(
        foldersRef,
        (snapshot) => {
          try {
            const foldersData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setFolders(foldersData);

            const initialFolderStates = {};
            foldersData.forEach((folder) => {
              initialFolderStates[folder.id] = false;
            });
            setFolderStates(initialFolderStates);
          } catch (err) {
            console.error("Error processing folders snapshot:", err);
          }
        },
        (error) => {
          console.error("Error listening to folders:", {
            message: error?.message,
            code: error?.code,
            fullError: error
          });
        }
      );

      // Files listener
      const filesRef = collection(db, `workspaces/${workspaceId}/files`);
      unsubscribeFiles = onSnapshot(
        filesRef,
        (snapshot) => {
          try {
            setFiles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          } catch (err) {
            console.error("Error processing files snapshot:", err);
          }
        },
        (error) => {
          console.error("Error listening to files:", {
            message: error?.message,
            code: error?.code,
            fullError: error
          });
        }
      );
    } catch (error) {
      console.error("Error setting up listeners:", {
        message: error?.message,
        code: error?.code,
        fullError: error
      });
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

  const handleDragOver = (e, targetFolderId) => {
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
      toast.success("Item moved!");
    } catch (error) {
      // ✅ IMPROVED: Better error logging
      console.error("Error moving item:", {
        message: error?.message,
        code: error?.code,
        fullError: error
      });
      
      if (error?.code === 'permission-denied') {
        toast.error("Permission denied: You cannot move this item");
      } else {
        toast.error(`Failed to move item: ${error?.message}`);
      }
    }
    setDraggedItem(null);
  };

  // ✅ FIXED: Add createdBy field when creating items
  const createItem = async (folderid) => {
    if (!newItemName) return;
    
    if (!auth.currentUser) {
      toast.error("You must be logged in to create items");
      return;
    }

    try {
      if (creatingType === "folder") {
        await addDoc(collection(db, `workspaces/${workspaceId}/folders`), {
          name: newItemName,
          parentFolderId: creatingParentFolderId,
          createdBy: auth.currentUser.uid,  // ✅ ADDED: Required by Firestore rules
          createdAt: new Date().toISOString(),
        });
        toast.success("Folder created!");
      } else {
        await addDoc(collection(db, `workspaces/${workspaceId}/files`), {
          name: newItemName,
          folderId: creatingParentFolderId,
          workspaceId,
          createdBy: auth.currentUser.uid,  // ✅ ADDED: Required by Firestore rules
          createdAt: new Date().toISOString(),
          content: "", // ✅ ADDED: Initialize content
        });
        toast.success("File created!");
      }
      setNewItemName("");
      setCreatingType(null);
      setCreatingParentFolderId(null);
      setFolderStates({ ...folderStates, [folderid]: true });

    } catch (error) {
      // ✅ IMPROVED: Better error logging
      console.error("Error creating item:", {
        message: error?.message,
        code: error?.code,
        creatingType,
        fullError: error
      });

      if (error?.code === 'permission-denied') {
        toast.error("Permission denied: You cannot create items in this workspace");
      } else {
        toast.error(`Failed to create ${creatingType}: ${error?.message}`);
      }
    }
  };

  const renameItem = async () => {
    if (!renamingItem?.name) return;

    try {
      const collectionName = renamingItem.type === "folder" ? "folders" : "files";
      await updateDoc(
        doc(db, `workspaces/${workspaceId}/${collectionName}/${renamingItem.id}`),
        { name: renamingItem.name }
      );
      toast.success("Item renamed!");
      setRenamingItem(null);
    } catch (error) {
      // ✅ IMPROVED: Better error logging
      console.error("Error renaming item:", {
        message: error?.message,
        code: error?.code,
        fullError: error
      });

      if (error?.code === 'permission-denied') {
        toast.error("Permission denied: You cannot rename this item");
      } else {
        toast.error(`Failed to rename item: ${error?.message}`);
      }
    }
  };

  const deleteItem = async (type, id) => {
    const confirmed = window.confirm(`Are you sure you want to delete this ${type === "folders" ? "folder" : "file"}?`);
    if (!confirmed) return;

    try {
      if (type === "folders") {
        await deleteDoc(doc(db, `workspaces/${workspaceId}/folders/${id}`));
        
        // Delete nested folders
        const nestedFolders = folders.filter(
          (folder) => folder.parentFolderId === id
        );
        for (const nestedFolder of nestedFolders) {
          await deleteItem("folders", nestedFolder.id);
        }
        
        // Delete files in folder
        const folderFiles = files.filter((file) => file.folderId === id);
        for (const file of folderFiles) {
          await deleteDoc(doc(db, `workspaces/${workspaceId}/files/${file.id}`));
        }
        
        toast.success("Folder deleted!");
      } else {
        await deleteDoc(doc(db, `workspaces/${workspaceId}/files/${id}`));
        toast.success("File deleted!");
      }
    } catch (error) {
      // ✅ IMPROVED: Better error logging
      console.error("Error deleting item:", {
        message: error?.message,
        code: error?.code,
        fullError: error
      });

      if (error?.code === 'permission-denied') {
        toast.error("Permission denied: You cannot delete this item");
      } else {
        toast.error(`Failed to delete item: ${error?.message}`);
      }
    }
  };

  const renderFolder = (folder) => {
    const nestedFolders = folders.filter((f) => f.parentFolderId === folder.id);
    const folderFiles = files.filter((file) => file.folderId === folder.id);

    return (
      <div
        key={folder.id}
        className="ml-3 border-l border-gray-700"
        draggable
        onDragStart={(e) => handleDragStart(e, folder, "folder")}
        onDragOver={(e) => handleDragOver(e, folder.id)}
        onDrop={(e) => handleDrop(e, folder.id)}
      >
        <div className="flex items-center justify-between group hover:bg-gray-800 px-1 py-2 rounded transition-colors">
          <div
            className="flex items-center flex-1 cursor-pointer"
            onClick={() => toggleFolder(folder.id)}
          >
            {folderStates[folder.id] ? (
              <ChevronDown size={16} className="mr-1" />
            ) : (
              <ChevronRight size={16} className="mr-1" />
            )}
            <Folder size={16} className="mr-2 text-blue-400" />
            {renamingItem?.id === folder.id ? (
              <input
                className="text-sm bg-gray-800 text-white px-2 py-1 rounded"
                value={renamingItem.name}
                onChange={(e) => setRenamingItem({ ...renamingItem, name: e.target.value })}
                onBlur={renameItem}
                onKeyPress={(e) => e.key === "Enter" && renameItem()}
                autoFocus
              />
            ) : (
              <span
                className="text-sm"
                onDoubleClick={() => setRenamingItem({ id: folder.id, name: folder.name, type: "folder" })}
              >
                {truncateName(folder.name)}
              </span>
            )}
          </div>

          {(userRole === "contributor" || userRole === "owner") && (
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
              <Folder
                size={14}
                className="text-blue-400 cursor-pointer hover:text-blue-300 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingType((prev) => (prev === "folder" ? null : "folder"));
                  setCreatingParentFolderId(folder.id);
                  setNewItemName("");
                  setFolderStates({ ...folderStates, [folder.id]: true });
                }}
                title="Create subfolder"
              />
              <File
                size={14}
                className="text-orange-400 cursor-pointer hover:text-orange-300 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingType((prev) => (prev === "file" ? null : "file"));
                  setCreatingParentFolderId(folder.id);
                  setNewItemName("");
                  setFolderStates({ ...folderStates, [folder.id]: true });
                }}
                title="Create file"
              />
              <Trash
                size={14}
                className="text-gray-400 hover:text-red-400 cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem("folders", folder.id);
                }}
                title="Delete folder"
              />
            </div>
          )}
        </div>

        {folderStates[folder.id] && (
          <div className="ml-1">
            {creatingType && creatingParentFolderId === folder.id && (
              <div className="ml-4 flex items-center px-2 py-1">
                <input
                  className="text-sm bg-gray-800 text-white px-2 py-1 rounded flex-1"
                  placeholder={`New ${creatingType} name`}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onBlur={createItem}
                  onKeyPress={(e) => e.key === "Enter" && createItem(folder.id)}
                  autoFocus
                />
              </div>
            )}
            {nestedFolders.map((nestedFolder) => renderFolder(nestedFolder))}
            {folderFiles.map((file) => (
              <div
                key={file.id}
                className="ml-6 flex items-center justify-between group hover:bg-gray-800 px-2 py-1 rounded transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, file, "file")}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDrop={(e) => handleDrop(e, folder.id)}
              >
                <div
                  className="flex items-center cursor-pointer flex-1"
                  onClick={() => openFile(file)}
                >
                  <File size={16} className="mr-2 text-orange-400" />
                  {renamingItem?.id === file.id ? (
                    <input
                      className="text-sm bg-gray-700 text-white px-1 rounded"
                      value={renamingItem.name}
                      onChange={(e) => setRenamingItem({ ...renamingItem, name: e.target.value })}
                      onBlur={renameItem}
                      onKeyPress={(e) => e.key === "Enter" && renameItem()}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="text-sm"
                      onDoubleClick={() => setRenamingItem({ id: file.id, name: file.name, type: "file" })}
                    >
                      {truncateName(file.name)}
                    </span>
                  )}
                </div>
                {(userRole === "contributor" || userRole === "owner") && (
                  <Trash
                    size={14}
                    className="text-gray-400 hover:text-red-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem("files", file.id);
                    }}
                    title="Delete file"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 text-gray-300 h-full w-full flex flex-col border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-semibold mb-8 text-right">FILE EXPLORER</h2>
        <div className="flex space-x-2 justify-start">
          {(userRole === "contributor" || userRole === "owner") && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCreatingParentFolderId(null);
                  setNewItemName("");
                  setCreatingType((prev) => (prev === "folder" ? null : "folder"));
                }}
                className="hover:bg-blue-700 bg-blue-500 bg-opacity-10 ring-1 ring-blue-500 px-2 py-1 rounded-md text-xs flex gap-1 transition-colors"
                title="Create new folder"
              >
                Add folder
                <Folder size={16} className="text-gray-400" />
              </button>
              <button
                onClick={() => {
                  setCreatingParentFolderId(null);
                  setNewItemName("");
                  setCreatingType((prev) => (prev === "file" ? null : "file"));
                }}
                className="hover:bg-orange-700 bg-orange-500 bg-opacity-10 ring-1 ring-orange-400 px-2 py-1 rounded-md flex items-center text-xs gap-1 transition-colors"
                title="Create new file"
              >
                Add file
                <File size={16} className="text-orange-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto py-2 px-1"
        onDragOver={(e) => handleDragOver(e, null)}
        onDrop={(e) => handleDrop(e, null)}
      >
        {creatingType && !creatingParentFolderId && (
          <div className="flex items-center px-2 py-1">
            <input
              className="text-sm bg-gray-800 py-1 text-white px-3 rounded flex-1"
              placeholder={`New ${creatingType} name`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onBlur={createItem}
              onKeyPress={(e) => e.key === "Enter" && createItem()}
              autoFocus
            />
          </div>
        )}

        {folders
          .filter((folder) => !folder.parentFolderId)
          .map((folder) => renderFolder(folder))}

        {files
          .filter((file) => !file.folderId)
          .map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between group hover:bg-gray-800 px-2 py-1 rounded transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, file, "file")}
              onDragOver={(e) => handleDragOver(e, null)}
              onDrop={(e) => handleDrop(e, null)}
            >
              <div
                className="flex items-center cursor-pointer flex-1 border-l border-gray-700 ml-1 px-2 py-1"
                onClick={() => openFile(file)}
              >
                <File size={16} className="mr-2 text-orange-400" />
                {renamingItem?.id === file.id ? (
                  <input
                    className="text-sm bg-gray-700 text-white px-1 rounded"
                    value={renamingItem.name}
                    onChange={(e) => setRenamingItem({ ...renamingItem, name: e.target.value })}
                    onBlur={renameItem}
                    onKeyPress={(e) => e.key === "Enter" && renameItem()}
                    autoFocus
                  />
                ) : (
                  <span
                    className="text-sm"
                    onDoubleClick={() => setRenamingItem({ id: file.id, name: file.name, type: "file" })}
                  >
                    {truncateName(file.name)}
                  </span>
                )}
              </div>
              {(userRole === "contributor" || userRole === "owner") && (
                <Trash
                  size={14}
                  className="text-gray-400 hover:text-red-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem("files", file.id);
                  }}
                  title="Delete file"
                />
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default NavPanel;