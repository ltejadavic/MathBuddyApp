"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, MessageCircle, Mail, Globe, MapPin } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";

interface ProfileData {
  id: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  timezone: string | null;
  country: string | null;
  studentProfile?: {
    school: string | null;
    gradeLevel: string | null;
  };
  teacherProfile?: {
    bio: string | null;
    courses?: any[];
  };
}

export default function ProfilePage() {
  const params = useParams();
  const profileId = params.id as string;
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentUser = useAuthStore(state => state.user);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get(`/users/${profileId}/profile`);
        setProfile(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    
    if (profileId) {
      fetchProfile();
    }
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="w-full h-64 rounded-xl animate-pulse bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center">
          <p className="text-red-500 font-semibold">Error</p>
          <p className="text-gray-500 mt-2">{error || "Profile not found"}</p>
        </Card>
      </div>
    );
  }

  const displayName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'No Name Provided';
  const isMe = currentUser?.id === profile.id;

  return (
    <div className="flex-1 p-8 flex justify-center items-start">
      <Card className="w-full max-w-2xl shadow-md border-gray-100 dark:border-gray-800">
        <CardHeader className="flex flex-col md:flex-row gap-6 pb-8 border-b border-gray-100 dark:border-gray-800 items-center md:items-start text-center md:text-left">
          <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-950 shadow-sm">
            <AvatarFallback className="bg-brand-cyan/10 text-brand-cyan text-2xl">
              {profile.firstName?.[0] || <User className="w-10 h-10" />}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {displayName}
            </CardTitle>
            <CardDescription className="text-base capitalize text-brand-cyan font-medium">
              {profile.role.toLowerCase()}
            </CardDescription>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2 text-sm text-gray-500">
              {profile.email !== 'Hidden for privacy' && (
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" /> {profile.email}
                </div>
              )}
              {profile.country && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {profile.country}
                </div>
              )}
              {profile.timezone && (
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" /> {profile.timezone}
                </div>
              )}
            </div>
          </div>
          
          {!isMe && (
            <div className="mt-4 md:mt-0">
              <Button 
                onClick={() => router.push(`/messages?userId=${profile.id}`)}
                className="bg-brand-cyan hover:bg-brand-cyan/90 text-white shadow-md shadow-brand-cyan/20"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Chat
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="pt-8 space-y-6">
          {profile.role === 'STUDENT' && profile.studentProfile && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Academic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium mb-1">School</p>
                  <p className="text-sm font-medium">{profile.studentProfile.school || 'Not specified'}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium mb-1">Grade Level</p>
                  <p className="text-sm font-medium">{profile.studentProfile.gradeLevel || 'Not specified'}</p>
                </div>
              </div>
            </div>
          )}
          
          {profile.role === 'TEACHER' && profile.teacherProfile && (
            <div className="space-y-6">
              {profile.teacherProfile.courses && profile.teacherProfile.courses.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Courses Taught</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.teacherProfile.courses.map((tc: any, index: number) => {
                      // Cycle through brand-approved aesthetic colors
                      const colors = [
                        "bg-[#00B9EE]/10 text-[#00B9EE] border-[#00B9EE]/20", // Cyan
                        "bg-[#313745]/10 text-[#313745] dark:text-gray-200 border-[#313745]/20 dark:border-gray-700", // Dark Navy
                        "bg-[#8DC63F]/10 text-[#6B962F] dark:text-[#8DC63F] border-[#8DC63F]/20", // Green
                        "bg-[#FFDD00]/10 text-[#B39B00] dark:text-[#FFDD00] border-[#FFDD00]/20", // Yellow
                        "bg-[#00BFFF]/10 text-[#00BFFF] border-[#00BFFF]/20", // Light Blue
                        "bg-[#FF9B9B]/10 text-[#E65C5C] dark:text-[#FF9B9B] border-[#FF9B9B]/20", // Pink
                      ];
                      const colorClass = colors[index % colors.length];
                      
                      return (
                        <span 
                          key={tc.courseId} 
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}
                        >
                          {tc.course?.name || "Unknown Course"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">About Me</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {profile.teacherProfile.bio || 'No biography provided.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
