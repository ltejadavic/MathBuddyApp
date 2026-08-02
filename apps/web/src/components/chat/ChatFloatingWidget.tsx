"use client";

import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";

export function ChatFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  // For now, it's just a mockup
  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger render={
          <Button 
            size="icon" 
            className="h-14 w-14 rounded-full bg-brand-cyan hover:bg-brand-cyan/90 text-white shadow-lg shadow-brand-cyan/30"
          />
        }>
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={16} className="w-[350px] p-0 rounded-2xl shadow-xl overflow-hidden border-gray-200 dark:border-gray-800">
          <div className="flex flex-col h-[450px]">
            {/* Header */}
            <div className="bg-brand-cyan p-4 text-white">
              <h3 className="font-semibold">MathBuddy Support</h3>
              <p className="text-xs opacity-90">Chat with teachers and admins</p>
            </div>
            
            {/* Messages Area (Mocked) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex flex-col space-y-2">
                <div className="bg-gray-200 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none self-start max-w-[80%]">
                  <p className="text-sm">Hi there! How can we help you today?</p>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Input 
                placeholder="Type your message..." 
                className="rounded-full border-gray-200 dark:border-gray-800"
              />
              <Button size="icon" className="rounded-full bg-brand-cyan hover:bg-brand-cyan/90 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
