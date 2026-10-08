export default function NotificationsPage() {
  const notifs = [
    { id: 1, type: 'like', text: 'Alex liked your game Flappy Glide Night.', time: '2m ago' },
    { id: 2, type: 'comment', text: 'Sam commented: "This is too hard!"', time: '1h ago' },
    { id: 3, type: 'follow', text: 'Pixel Ninja started following you.', time: '3h ago' },
    { id: 4, type: 'leaderboard', text: 'Brain Gains beat your score in Math Blitz!', time: '1d ago' },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#07070c] text-white pt-[env(safe-area-inset-top)] pb-20 md:pb-0">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h1 className="font-bold text-xl">Inbox</h1>
        <button className="text-xs font-bold text-white/50 hover:text-white">Mark all read</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifs.map(n => (
          <div key={n.id} className="p-4 border-b border-white/5 flex gap-3 items-start hover:bg-white/5 transition-colors cursor-pointer">
             <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-xl">
               {n.type === 'like' && '❤️'}
               {n.type === 'comment' && '💬'}
               {n.type === 'follow' && '👥'}
               {n.type === 'leaderboard' && '🏆'}
             </div>
             <div className="flex-1">
               <p className="text-sm font-medium">{n.text}</p>
               <span className="text-xs text-white/40">{n.time}</span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
