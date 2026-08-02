import { create } from 'zustand';
import { Socket } from 'socket.io-client';

interface ChatState {
  socket: Socket | null;
  onlineUsers: string[];
  activeThreadId: string | null;
  pendingChatUserId: string | null;
  isOpen: boolean;
  
  setSocket: (socket: Socket | null) => void;
  setOnlineUsers: (users: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
  
  setActiveThreadId: (threadId: string | null) => void;
  setPendingChatUserId: (userId: string | null) => void;
  setIsOpen: (isOpen: boolean) => void;
  
  openChatWithUser: (userId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  socket: null,
  onlineUsers: [],
  activeThreadId: null,
  pendingChatUserId: null,
  isOpen: false,
  
  setSocket: (socket) => set({ socket }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (userId) => set((state) => ({ 
    onlineUsers: state.onlineUsers.includes(userId) ? state.onlineUsers : [...state.onlineUsers, userId] 
  })),
  removeOnlineUser: (userId) => set((state) => ({
    onlineUsers: state.onlineUsers.filter(id => id !== userId)
  })),
  
  setActiveThreadId: (threadId) => set({ activeThreadId: threadId, pendingChatUserId: null }),
  setPendingChatUserId: (userId) => set({ pendingChatUserId: userId }),
  setIsOpen: (isOpen) => set({ isOpen }),
  
  openChatWithUser: (userId) => set({ pendingChatUserId: userId, isOpen: true }),
}));
