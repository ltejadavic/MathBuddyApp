"use client";

import { MessageCircle, X, Send, ArrowLeft, Loader2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { apiClient } from "@/lib/api-client";
import { io } from "socket.io-client";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";

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

export function ChatFloatingWidget() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);
  const pathname = usePathname();
  
  const { 
    socket, setSocket, onlineUsers, addOnlineUser, removeOnlineUser, setOnlineUsers,
    isOpen, setIsOpen, activeThreadId, setActiveThreadId, pendingChatUserId, setPendingChatUserId
  } = useChatStore();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadThreads, setUnreadThreads] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Initialize Socket
  useEffect(() => {
    if (!user || !token) return;
    
    // Connect to websocket backend
    const newSocket = io(backendUrl, {
      auth: { token }
    });
    
    newSocket.on('connect', () => {
      // Authenticate
      newSocket.emit('authenticate', null, (res: any) => {
        if (res?.onlineUsers) {
          setOnlineUsers(res.onlineUsers);
        }
      });
      // Re-join active thread if there is one
      const { activeThreadId } = useChatStore.getState();
      if (activeThreadId) {
        newSocket.emit('join_thread', activeThreadId);
      }
    });
    
    newSocket.on('presence_update', (data: { userId: string, status: string }) => {
      if (data.status === 'ONLINE') {
        addOnlineUser(data.userId);
      } else {
        removeOnlineUser(data.userId);
      }
    });

    newSocket.on('new_message', (msg: Message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Refresh threads to update latest message preview
      fetchThreads();

      const state = useChatStore.getState();
      if (!state.isOpen || state.activeThreadId !== msg.threadId) {
        setUnreadThreads(prev => {
          const next = new Set(prev);
          next.add(msg.threadId);
          return next;
        });
      } else {
        // We are currently viewing this thread, so mark it as read immediately
        newSocket.emit('mark_read', msg.threadId);
      }
    });

    newSocket.on('user_typing', (data: { threadId: string, userId: string, isTyping: boolean }) => {
      const state = useChatStore.getState();
      if (state.activeThreadId === data.threadId) {
        setTypingUsers(prev => {
          const next = new Set(prev);
          if (data.isTyping) {
            next.add(data.userId);
          } else {
            next.delete(data.userId);
          }
          return next;
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user, token]);

  // Fetch threads & contacts initially and when opened
  useEffect(() => {
    if (user) {
      fetchThreads();
      if (isOpen) {
        fetchContacts();
      }
    }
  }, [isOpen, user]);
  
  // Handle pending chat from profile page
  useEffect(() => {
    if (pendingChatUserId && isOpen && contacts.length > 0) {
      startChatWithUser(pendingChatUserId);
      setPendingChatUserId(null); // Clear it
    }
  }, [pendingChatUserId, isOpen, contacts]);

  // Load messages when thread changes
  useEffect(() => {
    if (activeThreadId) {
      setUnreadThreads(prev => {
        const next = new Set(prev);
        next.delete(activeThreadId);
        return next;
      });
      setTypingUsers(new Set()); // clear typing users
      fetchMessages(activeThreadId);
      socket?.emit('join_thread', activeThreadId);
      socket?.emit('mark_read', activeThreadId);
    } else {
      setMessages([]);
    }
  }, [activeThreadId, socket]);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchThreads = async () => {
    try {
      const { data } = await apiClient.get('/chat/threads');
      setThreads(data);
      
      // Calculate unread state from backend data
      const state = useChatStore.getState();
      const initialUnread = new Set<string>();
      
      data.forEach((thread: any) => {
        const myParticipant = thread.participants?.find((p: any) => p.userId === user?.id);
        const latestMessage = thread.messages?.[0];
        
        if (latestMessage && myParticipant && latestMessage.senderId !== user?.id) {
          const lastRead = myParticipant.lastReadAt ? new Date(myParticipant.lastReadAt).getTime() : 0;
          const msgTime = new Date(latestMessage.createdAt).getTime();
          
          if (msgTime > lastRead) {
            // Ignore if we are currently viewing it
            if (!(state.isOpen && state.activeThreadId === thread.id)) {
              initialUnread.add(thread.id);
            }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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

    const payload: any = {
      threadId: activeThreadId,
    };
    if (inputValue.trim()) {
      payload.content = inputValue.trim();
    }
    if (attachmentUrl) {
      payload.attachmentUrl = attachmentUrl;
    }

    socket.emit('send_message', payload, (res: any) => {
      // Message acknowledged
      setInputValue("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  if (!user) return null;
  const isMessagesPage = pathname?.startsWith('/messages');

  const getOtherParticipant = (thread?: Thread) => {
    if (!thread || !thread.participants) return undefined;
    return thread.participants.find(p => p.user.id !== user.id)?.user;
  };
  
  const getDisplayName = (u?: ChatUser) => {
    if (!u) return 'Unknown';
    if (u.firstName || u.lastName) return `${u.firstName || ''} ${u.lastName || ''}`.trim();
    return u.email;
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${isMessagesPage ? 'hidden' : ''}`}>
      <Popover open={isOpen && !isMessagesPage} onOpenChange={(open) => { if (!isMessagesPage) setIsOpen(open); }}>
        <PopoverTrigger render={
          <Button 
            size="icon" 
            className="relative h-14 w-14 rounded-full bg-brand-cyan hover:bg-brand-cyan/90 text-white shadow-lg shadow-brand-cyan/30"
          >
            {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            {!isOpen && unreadThreads.size > 0 && (
              <span className="absolute top-0 right-0 h-3.5 w-3.5 bg-purple-400 border-2 border-white rounded-full"></span>
            )}
          </Button>
        } />
        
        <PopoverContent align="end" sideOffset={16} className="w-[380px] p-0 rounded-2xl shadow-xl overflow-hidden border-gray-200 dark:border-gray-800">
          <div className="flex flex-col h-[550px] bg-white dark:bg-gray-950">
            {/* Header */}
            <div className="bg-brand-cyan p-4 text-white flex items-center shadow-sm z-10">
              {activeThreadId && (
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mr-2 h-8 w-8 rounded-full" onClick={() => setActiveThreadId(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h3 className="font-semibold leading-tight">
                  {activeThreadId 
                    ? getDisplayName(getOtherParticipant(threads.find(t => t.id === activeThreadId)))
                    : 'Messages'}
                </h3>
                <p className="text-xs opacity-90">
                  {activeThreadId 
                    ? onlineUsers.includes(getOtherParticipant(threads.find(t => t.id === activeThreadId))?.id || '') ? 'Online' : 'Offline'
                    : 'MathBuddy Communication'}
                </p>
              </div>
            </div>
            
            {/* Body */}
            {!activeThreadId ? (
              // Contacts & Threads View
              <div className="flex-1 overflow-y-auto p-2">
                {threads.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 pt-2">Recent Chats</h4>
                    {threads.map(thread => {
                      const otherUser = getOtherParticipant(thread);
                      if (!otherUser) return null;
                      const isOnline = onlineUsers.includes(otherUser.id);
                      const latestMessage = thread.messages?.[0];
                      
                      return (
                        <div 
                          key={thread.id} 
                          onClick={() => setActiveThreadId(thread.id)}
                          className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-xl cursor-pointer transition-colors"
                        >
                          <div className="relative">
                            <Avatar>
                              <AvatarFallback className="bg-brand-cyan/10 text-brand-cyan">
                                <UserIcon className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            {isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full"></span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${unreadThreads.has(thread.id) ? 'font-bold text-gray-900 dark:text-white' : 'font-medium'}`}>{getDisplayName(otherUser)}</p>
                              <p className={`text-xs truncate ${unreadThreads.has(thread.id) ? 'text-brand-cyan font-medium' : 'text-gray-500'}`}>
                                {latestMessage?.content || (latestMessage?.attachmentUrl ? 'Attachment' : 'Started a chat')}
                              </p>
                            </div>
                            {unreadThreads.has(thread.id) && (
                              <span className="h-2.5 w-2.5 rounded-full bg-purple-400 shrink-0"></span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Contacts</h4>
                  {contacts.length === 0 && (
                    <p className="text-sm text-gray-500 px-3 italic">No contacts available.</p>
                  )}
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
            ) : (
              // Active Chat View
              <>
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/30">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-4">
                      {messages.map(msg => {
                        const isMe = msg.senderId === user.id;
                        return (
                          <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                            <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-brand-cyan text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-bl-sm'}`}>
                              {msg.attachmentUrl && (
                                <div className="mb-2">
                                  {msg.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                    <a href={msg.attachmentUrl.startsWith('/') ? `${backendUrl}${msg.attachmentUrl}` : msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                      <img src={msg.attachmentUrl.startsWith('/') ? `${backendUrl}${msg.attachmentUrl}` : msg.attachmentUrl} alt="Attachment" className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                                    </a>
                                  ) : (
                                    <a href={msg.attachmentUrl.startsWith('/') ? `${backendUrl}${msg.attachmentUrl}` : msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/10 dark:bg-white/10 rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
                                      <span className="truncate max-w-[150px]">{msg.attachmentUrl.split('/').pop()}</span>
                                    </a>
                                  )}
                                </div>
                              )}
                              {msg.content}
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                              {format(new Date(msg.createdAt), 'h:mm a')}
                            </span>
                          </div>
                        )
                      })}
                      
                      {typingUsers.size > 0 && (
                        <div className="flex self-start items-center p-3 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm max-w-[85%] text-gray-500 text-sm">
                          <span className="flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                          </span>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                {/* Input Area */}
                <div className="p-3 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
                  {selectedFile && (
                    <div className="flex items-center justify-between p-2 mb-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs">
                      <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                      <button onClick={() => setSelectedFile(null)} className="text-gray-500 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <form 
                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                    className="flex items-center gap-2"
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileSelect} 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    </Button>
                    <Input 
                      value={inputValue}
                      onChange={handleInputChange}
                      placeholder="Type your message..." 
                      className="rounded-full border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus-visible:ring-brand-cyan"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={(!inputValue.trim() && !selectedFile) || uploading}
                      className="rounded-full bg-brand-cyan hover:bg-brand-cyan/90 shrink-0 text-white disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
