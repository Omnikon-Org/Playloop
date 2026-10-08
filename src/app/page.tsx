import { GameFeed } from '../components/feed/GameFeed';

export default function Home() {
  return (
    <main className="w-full h-[100dvh] bg-black text-white relative">
      <GameFeed />
    </main>
  );
}
