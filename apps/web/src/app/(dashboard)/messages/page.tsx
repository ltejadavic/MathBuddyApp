"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { apiClient } from "@/lib/api-client";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { 
  Send, Loader2, User as UserIcon, Paperclip, X, Image as ImageIcon, FileText, Download, MessageCircle
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChatUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
}

interface Thread {
  id: string;
  participants: { user: ChatUser }[];
  messages: Message[];
}

interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string | null;
  attachmentUrl?: string | null;
  createdAt: string;
}

export default function MessagesPage() {
  const user = useAuthStore((state) => state.user);
  const { 
    socket, onlineUsers, activeThreadId, setActiveThreadId
  } = useChatStore();

  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId");

  const [threads, setThreads] = useState<Thread[]>([]);
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadThreads, setUnreadThreads] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (user) {
      fetchThreads();
      fetchContacts();
    }
  }, [user]);

  // Clean up global state when leaving the messages page
  useEffect(() => {
    return () => {
      useChatStore.getState().setActiveThreadId(null);
      useChatStore.getState().setIsOpen(false);
    };
  }, []);

  // Handle URL param to start chat
  useEffect(() => {
    if (initialUserId && contacts.length > 0) {
      startChatWithUser(initialUserId);
    }
  }, [initialUserId, contacts]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      setMessages((prev) => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      fetchThreads();

      if (activeThreadId !== msg.threadId) {
        setUnreadThreads(prev => {
          const next = new Set(prev);
          next.add(msg.threadId);
          return next;
        });
      } else {
        socket.emit('mark_read', msg.threadId);
      }
    };

    const handleTyping = (data: { threadId: string, userId: string, isTyping: boolean }) => {
      if (activeThreadId === data.threadId) {
        setTypingUsers(prev => {
          const next = new Set(prev);
          if (data.isTyping) next.add(data.userId);
          else next.delete(data.userId);
          return next;
        });
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
    };
  }, [socket, activeThreadId]);

  useEffect(() => {
    if (activeThreadId) {
      setUnreadThreads(prev => {
        const next = new Set(prev);
        next.delete(activeThreadId);
        return next;
      });
      setTypingUsers(new Set());
      fetchMessages(activeThreadId);
      socket?.emit('join_thread', activeThreadId);
      socket?.emit('mark_read', activeThreadId);
    } else {
      setMessages([]);
    }
  }, [activeThreadId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchThreads = async () => {
    try {
      const { data } = await apiClient.get('/chat/threads');
      setThreads(data);
      
      const initialUnread = new Set<string>();
      data.forEach((thread: any) => {
        const myParticipant = thread.participants?.find((p: any) => p.userId === user?.id);
        const latestMessage = thread.messages?.[0];
        
        if (latestMessage && myParticipant && latestMessage.senderId !== user?.id) {
          const lastRead = myParticipant.lastReadAt ? new Date(myParticipant.lastReadAt).getTime() : 0;
          const msgTime = new Date(latestMessage.createdAt).getTime();
          
          if (msgTime > lastRead && activeThreadId !== thread.id) {
            initialUnread.add(thread.id);
          }
        }
      });
      setUnreadThreads(initialUnread);
    } catch (e) {
      console.error('Failed to fetch threads', e);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data } = await apiClient.get('/chat/contacts');
      setContacts(data);
    } catch (e) {
      console.error('Failed to fetch contacts', e);
    }
  };

  const fetchMessages = async (threadId: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/chat/threads/${threadId}/messages`);
      setMessages(data);
    } catch (e) {
      console.error('Failed to fetch messages', e);
    } finally {
      setLoading(false);
    }
  };

  const startChatWithUser = async (targetUserId: string) => {
    try {
      const { data } = await apiClient.post('/chat/threads', {
        type: 'DIRECT',
        participantUserIds: [targetUserId]
      });
      setThreads(prev => {
        if (prev.find(t => t.id === data.id)) return prev;
        return [data, ...prev];
      });
      setActiveThreadId(data.id);
      fetchThreads();
    } catch (e) {
      console.error('Failed to create/get thread', e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (socket && activeThreadId) {
      socket.emit('typing', { threadId: activeThreadId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { threadId: activeThreadId, isTyping: false });
      }, 2000);
    }
  };

  const sendMessage = async () => {
    if ((!inputValue.trim() && !selectedFile) || !activeThreadId || !socket) return;
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { threadId: activeThreadId, isTyping: false });

    let attachmentUrl = null;

    if (selectedFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const res = await apiClient.post('/chat/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        attachmentUrl = res.data.attachmentUrl;
      } catch (e) {
        console.error('Failed to upload file', e);
        setUploading(false);
        return;
      }
      setUploading(false);
      setSelectedFile(null);
    }

    const payload: any = { threadId: activeThreadId };
    if (inputValue.trim()) payload.content = inputValue.trim();
    if (attachmentUrl) payload.attachmentUrl = attachmentUrl;

    socket.emit('send_message', payload, () => {
      setInputValue("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const getOtherParticipant = (thread?: Thread) => {
    if (!thread || !thread.participants) return undefined;
    return thread.participants.find(p => p.user.id !== user?.id)?.user;
  };
  
  const getDisplayName = (u?: ChatUser) => {
    if (!u) return 'Unknown';
    if (u.firstName || u.lastName) return `${u.firstName || ''} ${u.lastName || ''}`.trim();
    return u.email;
  };

  const activeThread = threads.find(t => t.id === activeThreadId);
  const otherUser = getOtherParticipant(activeThread);
  
  const sharedFiles = messages.filter(m => m.attachmentUrl);

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
      {/* Left Sidebar - Thread List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-bold text-lg">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {threads.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 pt-2">Recent</h4>
              {threads.map(thread => {
                const partner = getOtherParticipant(thread);
                if (!partner) return null;
                const isOnline = onlineUsers.includes(partner.id);
                const latestMessage = thread.messages?.[0];
                const isActive = activeThreadId === thread.id;
                
                return (
                  <div 
                    key={thread.id} 
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-brand-cyan/10 dark:bg-brand-cyan/20' : 'hover:bg-gray-100 dark:hover:bg-gray-900'}`}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback className={isActive ? "bg-brand-cyan text-white" : "bg-gray-100 text-gray-500"}>
                          {partner.firstName?.[0] || <UserIcon className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className={`text-sm truncate ${unreadThreads.has(thread.id) ? 'font-bold text-gray-900 dark:text-white' : 'font-medium'}`}>
                          {getDisplayName(partner)}
                        </p>
                        {unreadThreads.has(thread.id) && (
                          <span className="h-2.5 w-2.5 rounded-full bg-purple-400 shrink-0"></span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${unreadThreads.has(thread.id) ? 'text-brand-cyan font-medium' : 'text-gray-500'}`}>
                        {latestMessage?.content || (latestMessage?.attachmentUrl ? 'Attachment' : 'Started a chat')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Contacts</h4>
            {contacts.map(contact => {
              const isOnline = onlineUsers.includes(contact.id);
              return (
                <div 
                  key={contact.id} 
                  onClick={() => startChatWithUser(contact.id)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback className="bg-gray-100 text-gray-500">
                        {contact.firstName?.[0] || <UserIcon className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{getDisplayName(contact)}</p>
                    <p className="text-xs text-gray-400 capitalize">{contact.role.toLowerCase()}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50/50 dark:bg-gray-900/10">
        {activeThreadId ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-brand-cyan/10 text-brand-cyan">
                    {otherUser?.firstName?.[0] || <UserIcon className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {getDisplayName(otherUser)}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {otherUser && onlineUsers.includes(otherUser.id) ? (
                      <span className="text-green-500 font-medium">Online</span>
                    ) : 'Offline'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFilesModalOpen(true)}>
                <FolderOpenIcon className="h-4 w-4 mr-2" />
                Shared Files
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="flex flex-col space-y-6">
                  {messages.map(msg => {
                    const isMe = msg.senderId === user?.id;
                    const fullUrl = msg.attachmentUrl ? (msg.attachmentUrl.startsWith('/') ? `${backendUrl}${msg.attachmentUrl}` : msg.attachmentUrl) : null;
                    const isImage = msg.attachmentUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                    
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                        <div className={`p-4 rounded-2xl shadow-sm ${isMe ? 'bg-brand-cyan text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-bl-sm'}`}>
                          {fullUrl && (
                            <div className={`mb-2 ${msg.content ? 'pb-2 border-b border-white/20 dark:border-gray-700' : ''}`}>
                              {isImage ? (
                                <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                                  <img src={fullUrl} alt="Attachment" className="max-w-[250px] max-h-[250px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                                </a>
                              ) : (
                                <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-black/10 dark:bg-white/10 rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
                                  <FileText className="h-8 w-8 opacity-80" />
                                  <span className="truncate max-w-[150px] font-medium">{msg.attachmentUrl?.split('/').pop()}</span>
                                </a>
                              )}
                            </div>
                          )}
                          {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                        </div>
                        <span className="text-xs text-gray-400 mt-1.5 px-1 font-medium">
                          {format(new Date(msg.createdAt), 'h:mm a')}
                        </span>
                      </div>
                    )
                  })}
                  
                  {typingUsers.size > 0 && (
                    <div className="flex self-start items-center p-4 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm text-gray-500">
                      <span className="flex gap-1.5 items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
              {selectedFile && (
                <div className="flex items-center justify-between p-3 mb-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <Paperclip className="h-4 w-4 text-brand-cyan" />
                    <span className="truncate max-w-[300px]">{selectedFile.name}</span>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-end gap-3">
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                  }} 
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="shrink-0 h-12 w-12 rounded-full text-gray-500 hover:text-brand-cyan hover:bg-brand-cyan/10 hover:border-brand-cyan/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <div className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl flex items-center px-2">
                  <Input 
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Type a message..." 
                    className="border-0 bg-transparent h-12 focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={(!inputValue.trim() && !selectedFile) || uploading}
                    className="shrink-0 h-10 w-10 rounded-full bg-brand-cyan hover:bg-brand-cyan/90 text-white disabled:opacity-50 transition-transform active:scale-95"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 -ml-0.5" />}
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="h-24 w-24 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your Messages</h2>
            <p>Select a contact or thread to start chatting.</p>
          </div>
        )}
      </div>

      {/* Shared Files Modal */}
      <Dialog open={filesModalOpen} onOpenChange={setFilesModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Shared Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {sharedFiles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No files shared in this conversation yet.</p>
            ) : (
              sharedFiles.map(msg => {
                const fullUrl = msg.attachmentUrl ? (msg.attachmentUrl.startsWith('/') ? `${backendUrl}${msg.attachmentUrl}` : msg.attachmentUrl) : '';
                const isImage = msg.attachmentUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                const filename = msg.attachmentUrl?.split('/').pop() || 'File';
                
                return (
                  <div key={msg.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 rounded-lg bg-brand-cyan/10 flex items-center justify-center shrink-0">
                        {isImage ? <ImageIcon className="h-5 w-5 text-brand-cyan" /> : <FileText className="h-5 w-5 text-brand-cyan" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{filename}</p>
                        <p className="text-xs text-gray-500">{format(new Date(msg.createdAt), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                    </div>
                    <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 p-2 text-gray-400 hover:text-brand-cyan transition-colors">
                      <Download className="h-5 w-5" />
                    </a>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Just an extra icon component for the header button
function FolderOpenIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
