"use client";

import React, { Suspense, useEffect, useState, use } from 'react';
import { Creator } from '../../../types/creator';
import { getCreatorByUsername } from '../../../lib/repositories/creatorRepository';
import { useUserStore } from '../../../store/userStore';

function ProfilePageContent({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [profile, setProfile] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isCurrentUser = username.toLowerCase() === 'rishi';
  const toggleFollow = useUserStore(s => s.toggleFollow);
  const isFollowing = useUserStore(s => profile && !!s.following[profile.id]);

  useEffect(() => {
    getCreatorByUsername(username).then(res => {
      setProfile(res);
      setLoading(false);
    });
  }, [username]);

  if (loading) {
    return <div className="w-full h-full flex items-center justify-center animate-pulse">Loading...</div>;
  }

  if (!profile) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4">👻</span>
        <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
        <p className="text-white/50">This user doesn&apos;t exist.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#07070c] text-white pt-[env(safe-area-inset-top)] pb-20 md:pb-0 overflow-y-auto">
      <div className="p-6 flex flex-col items-center border-b border-white/10 relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-4xl font-bold border-4 border-white/10 mb-4 shadow-lg">
          {profile.displayName[0]}
        </div>
        
        <h1 className="text-2xl font-black">{profile.displayName}</h1>
        <span className="text-white/50 font-medium mb-3">@{profile.username}</span>
        
        <p className="text-sm text-center max-w-[280px] mb-6 leading-relaxed">
          {profile.bio}
        </p>
        
        <div className="flex gap-6 mb-6">
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold">{profile.following}</span>
            <span className="text-xs text-white/50 uppercase tracking-widest">Following</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold">{profile.followers + (isFollowing ? 1 : 0)}</span>
            <span className="text-xs text-white/50 uppercase tracking-widest">Followers</span>
          </div>
        </div>
        
        {isCurrentUser ? (
          <button className="px-8 py-2.5 bg-white/10 text-white font-bold rounded-lg border border-white/20 active:bg-white/20">
            Edit Profile
          </button>
        ) : (
          <button 
            onClick={() => toggleFollow(profile.id)}
            className={`px-8 py-2.5 font-bold rounded-lg transition-colors ${isFollowing ? 'bg-white/20 text-white' : 'bg-white text-black'}`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button className="flex-1 py-3 text-sm font-bold border-b-2 border-white text-white">Played</button>
        <button className="flex-1 py-3 text-sm font-bold text-white/50 hover:text-white transition-colors">Liked</button>
        <button className="flex-1 py-3 text-sm font-bold text-white/50 hover:text-white transition-colors">Created</button>
      </div>
      
      <div className="flex-1 p-6 text-center flex flex-col items-center justify-center">
        <span className="text-4xl mb-4 text-white/30">🎮</span>
        <h3 className="text-lg font-bold text-white/50">No games here yet</h3>
      </div>
    </div>
  );
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  return (
    <Suspense fallback={<div className="w-full h-full bg-[#07070c]" />}>
      <ProfilePageContent params={params} />
    </Suspense>
  );
}
