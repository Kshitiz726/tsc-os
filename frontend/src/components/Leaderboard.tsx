'use client';
import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, AlertCircle } from 'lucide-react';

interface User {
 id: number;
 name: string;
 points: number;
 tasks: any[];
 photoUrl?: string;
}

export function Leaderboard() {
 const [users, setUsers] = useState<User[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`)
 .then(res => res.json())
 .then(data => {
 setUsers(data);
 setLoading(false);
 });
 }, []);

 const getRatingTier = (points: number) => {
 if (points >= 50) return { label: 'Elite', color: 'text-emerald-500 bg-emerald-50', icon: <Trophy size={16} /> };
 if (points >= 0) return { label: 'Good', color: 'text-blue-500 bg-blue-50', icon: <TrendingUp size={16} /> };
 return { label: 'Warning', color: 'text-red-500 bg-red-50', icon: <AlertCircle size={16} /> };
 };

 if (loading) return <div className="text-gray-500">Loading leaderboard...</div>;

 return (
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 <div className="p-6 border-b border-gray-100">
 <h3 className="text-lg font-semibold text-gray-800">Employee Leaderboard & Ratings</h3>
 <p className="text-sm text-gray-500 mt-1">Based on task completion points</p>
 </div>
 <div className="divide-y divide-gray-100">
 {users.map((user, index) => {
 const tier = getRatingTier(user.points);
 return (
 <div key={user.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
 <div className="flex items-center gap-4">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
 ${index === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 '}`}>
 {index + 1}
 </div>
 {user.photoUrl ? (
 <img src={`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user.id}/photo`} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-gray-200"/>
 ) : (
 <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
 {user.name.charAt(0)}
 </div>
 )}
 <div>
 <h4 className="font-semibold text-gray-800">{user.name}</h4>
 <p className="text-sm text-gray-500">{user.tasks.length} Total Tasks</p>
 </div>
 </div>
 
 <div className="flex items-center gap-8">
 <div className="text-right">
 <div className="text-2xl font-bold text-gray-800">{user.points}</div>
 <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Points</div>
 </div>
 
 <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium ${tier.color}`}>
 {tier.icon}
 {tier.label}
 </div>
 </div>
 </div>
 );
 })}
 {users.length === 0 && (
 <div className="p-8 text-center text-gray-500">No employees found. They need to start the Telegram bot first.</div>
 )}
 </div>
 </div>
 );
}
