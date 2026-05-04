'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

const useWindowSize = () => {
  const [size, setSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1200, 
    height: typeof window !== 'undefined' ? window.innerHeight : 800 
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
};// === TIPOS DE DATOS ===
type ReactionType = 'fast' | 'champ' | 'fire' | 'eyes';

interface Comment {
  id: string;
  author: string;
  number: string;
  text: string;
}

interface Post {
  id: number;
  type: 'OFFICIAL' | 'ALERT' | 'PILOT';
  authorName: string;
  authorNumber: string;
  authorAvatar: string;
  timestamp: string;
  content: string;
  image?: string;
  reactions: Record<ReactionType, number>;
  comments: Comment[];
  userReacted?: ReactionType | null;
}

interface ChatMessage {
  id: number;
  authorName: string;
  authorNumber: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

// === DATOS DE EJEMPLO ===
const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    type: 'OFFICIAL',
    authorName: 'DIRECCIÓN DE CARRERA',
    authorNumber: 'RC',
    authorAvatar: '🏁',
    timestamp: 'Hace 5 min',
    content: '🔥 ¡ATENCIÓN! 🔥\n\n¿Quieres estrenar moto? 🏍️💨\n¡Esta es tu oportunidad!\n\n🎉 Podrás participar por una MOTO 0KM MRX 200 GO PRO 🎉\n\nSiente la adrenalina, vive la aventura y llévate esta increíble máquina diseñada para los que buscan más.\n\n👉 Participa ahora y haz realidad tu sueño de tener moto propia.\n\n#Sorteo #Moto0KM #MRX200 #GoPro #Adrenalina #CumpleTuSueño',
    image: '/sponsors/mrx200-sorteo.png',
    reactions: { fast: 120, champ: 45, fire: 89, eyes: 230 },
    comments: []
  }
];

const INITIAL_CHAT: ChatMessage[] = [
  { id: 1, authorName: 'Race Control', authorNumber: 'RC', authorAvatar: '🎙️', content: 'Bienvenidos a la Copa Stunt F2R. Mantengan la comunicación profesional.', timestamp: '08:00', isMine: false },
  { id: 2, authorName: 'Daniel Rojas', authorNumber: '07', authorAvatar: '🇨🇴', content: '¿A qué hora abren el acceso a Pits para mecánicos?', timestamp: '08:15', isMine: false },
  { id: 3, authorName: 'Organización', authorNumber: 'ORG', authorAvatar: '📋', content: 'Acceso habilitado a partir de las 09:00 AM por la puerta 2.', timestamp: '08:17', isMine: false }
];

const SPONSORS = [
  {
    name: 'NITROX', emoji: '🥇', badge: 'PATROCINADOR PRINCIPAL', badgeColor: '#FFD700',
    links: { ig: 'https://instagram.com/nitrox_colombia', web: 'https://nitrox.com.co' }
  },
  {
    name: 'PASKINES STUNT', emoji: '🏍️', badge: 'ORGANIZADOR', badgeColor: '#39FF14',
    links: { ig: 'https://instagram.com/paskines_stunt', yt: 'https://youtube.com/@PaskinesStunt', tk: 'https://tiktok.com/@paskinesstunt', fb: 'https://facebook.com/paskinesstunt' }
  },
  {
    name: 'F2R RACING', emoji: '🏁', badge: 'CO-ORGANIZADOR', badgeColor: '#39FF14',
    links: { ig: 'https://instagram.com/f2r_racing_col', fb: 'https://facebook.com/f2rracing' }
  },
  {
    name: 'PLAZA MAYOR MEDELLÍN', emoji: '📍', badge: 'VENUE OFICIAL', badgeColor: '#FFFFFF',
    links: { ig: 'https://instagram.com/plazamayormedellin', web: 'https://plazamayor.com.co' }
  },
  {
    name: 'GOBERNACIÓN DE ANTIOQUIA', emoji: '🏛️', badge: 'APOYO INSTITUCIONAL', badgeColor: '#FFFFFF',
    links: { ig: 'https://instagram.com/gobantioquia', web: 'https://antioquia.gov.co' }
  },
  {
    name: 'ALCALDÍA DE MEDELLÍN', emoji: '🏙️', badge: 'APOYO MUNICIPAL', badgeColor: '#FFFFFF',
    links: { ig: 'https://instagram.com/alcaldiademed', web: 'https://medellin.gov.co' }
  }
];

const QUICK_REPLIES = ["En pits", "Box box box", "Llanta pinchada", "Fallo mecánico", "Todo OK"];

// SVGs
const IgIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
const YtIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>;
const TkIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1-.01-3.62.01-7.25-.01-10.87.53-.02 1.05-.03 1.58-.02.16.59.33 1.17.5 1.76.71.49 1.53.81 2.37.95.83.14 1.68.14 2.52 0 .43-.07.85-.18 1.25-.33v3.74c-.58.12-1.18.17-1.78.14zm-5.59 7.42c1.17 0 2.22.61 2.85 1.55.61.9.83 2.03.62 3.09-.23 1.15-.84 2.19-1.73 2.93-.89.73-2.04 1.13-3.19 1.11-1.28-.02-2.52-.56-3.41-1.49-.89-.93-1.37-2.22-1.35-3.52.02-1.3.52-2.54 1.41-3.46.88-.91 2.11-1.45 3.39-1.46.47 0 .94.08 1.41.25z" /></svg>;
const FbIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
const WebIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;

// === COMPONENTE PRINCIPAL ===
export default function PskPitxDashboard() {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const [activeTab, setActiveTab] = useState<'ALL' | 'OFFICIAL' | 'MINE'>('ALL');
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [newPostText, setNewPostText] = useState('');
  const [newChatText, setNewChatText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  
  // Floating Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatModalRef = useRef<HTMLDivElement>(null);
  
  // Countdown state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Usuario logueado mock
  const currentUser = {
    name: 'Walter Garzon',
    number: '99',
    avatar: '🇨🇴'
  };

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  // Click outside to close chat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chatModalRef.current && !chatModalRef.current.contains(e.target as Node) && isChatOpen) {
        setIsChatOpen(false);
      }
    };
    if (isChatOpen) {
      // Small delay to prevent immediate close on open click
      setTimeout(() => window.addEventListener('click', handleClickOutside), 10);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isChatOpen]);

  useEffect(() => {
    // 21 de mayo de 2026 a las 08:00 AM UTC-5
    const targetDate = new Date(Date.UTC(2026, 4, 21, 13, 0, 0)).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, total: difference });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost: Post = {
      id: Date.now(),
      type: 'PILOT',
      authorName: currentUser.name,
      authorNumber: currentUser.number,
      authorAvatar: currentUser.avatar,
      timestamp: 'Ahora mismo',
      content: newPostText,
      reactions: { fast: 0, champ: 0, fire: 0, eyes: 0 },
      comments: []
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
  };

  const handleCommentSubmit = (postId: number, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    const newComment: Comment = {
      id: `c_${Date.now()}`,
      author: currentUser.name,
      number: currentUser.number,
      text: text.trim()
    };

    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { ...p, comments: [...p.comments, newComment] };
      }
      return p;
    }));

    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const handleChatSubmit = (e: React.FormEvent | null, textOverride?: string) => {
    if (e) e.preventDefault();
    const text = textOverride || newChatText;
    if (!text.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now(),
      authorName: currentUser.name,
      authorNumber: currentUser.number,
      authorAvatar: currentUser.avatar,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true
    };

    setChatMessages([...chatMessages, newMsg]);
    setNewChatText('');
    
    // Simulate someone typing back
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        authorName: 'Race Control',
        authorNumber: 'RC',
        authorAvatar: '🎙️',
        content: 'Copiado. Mensaje recibido en control de carrera.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMine: false
      }]);
    }, 2500);
  };

  const handleReaction = (postId: number, reaction: ReactionType) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        const isRemoving = p.userReacted === reaction;
        const newReactions = { ...p.reactions };
        
        if (p.userReacted && p.userReacted !== reaction) {
          newReactions[p.userReacted]--;
        }
        
        if (isRemoving) {
          newReactions[reaction]--;
          return { ...p, reactions: newReactions, userReacted: null };
        } else {
          newReactions[reaction]++;
          return { ...p, reactions: newReactions, userReacted: reaction };
        }
      }
      return p;
    }));
  };

  const filteredPosts = posts.filter(p => {
    if (activeTab === 'OFFICIAL') return p.type === 'OFFICIAL' || p.type === 'ALERT';
    if (activeTab === 'MINE') return p.authorNumber === currentUser.number;
    return true;
  });

  const getEventStatus = () => {
    if (timeLeft.total <= 0 && timeLeft.total > -86400000) return <span style={{color: 'var(--accent-green)'}}>🏁 HOY ES EL DÍA</span>;
    if (timeLeft.days > 0 && timeLeft.days < 7) return <span className="blink-fast" style={{color: 'var(--accent-green)'}}>¡EVENTO ESTA SEMANA!</span>;
    if (timeLeft.days >= 7) return <span>PRÓXIMO EVENTO</span>;
    return <span>PREPARATIVOS EN CURSO</span>;
  };

  return (
    <div className="pskpitx-app">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Orbitron:wght@400;500;700;900&display=swap');

        :root {
          --bg-dark: #050505;
          --bg-panel: #111111;
          --bg-panel-light: #1A1A1A;
          --accent-green: #39FF14;
          --accent-green-glow: rgba(57, 255, 20, 0.3);
          --accent-yellow: #FFD700;
          --text-main: #FFFFFF;
          --text-muted: #888888;
          --border-color: #333333;
        }

        .pskpitx-app {
          font-family: 'Barlow Condensed', sans-serif;
          background-color: var(--bg-dark);
          color: var(--text-main);
          height: calc(100dvh - 64px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-image: 
            linear-gradient(rgba(57, 255, 20, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(57, 255, 20, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          background-position: center center;
        }

        .font-display { font-family: 'Orbitron', sans-serif; }
        
        /* HEADER */
        .pskpitx-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 70px;
          background-color: rgba(10, 10, 10, 0.9);
          border-bottom: 2px solid var(--accent-green);
          box-shadow: 0 4px 20px var(--accent-green-glow);
          backdrop-filter: blur(10px);
          z-index: 10;
          flex-shrink: 0;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 1.8rem;
          font-weight: 900;
          letter-spacing: 2px;
          color: var(--text-main);
          text-shadow: 0 0 10px rgba(57,255,20,0.4);
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--accent-green);
          font-weight: 700;
          letter-spacing: 1px;
          font-size: 1.2rem;
        }

        .live-dot {
          width: 10px;
          height: 10px;
          background-color: var(--accent-green);
          border-radius: 50%;
          animation: pulse-green 1.5s infinite;
        }

        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 var(--accent-green-glow); }
          70% { box-shadow: 0 0 0 10px rgba(57, 255, 20, 0); }
          100% { box-shadow: 0 0 0 0 rgba(57, 255, 20, 0); }
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-badge {
          display: flex;
          align-items: center;
          background: var(--bg-panel-light);
          border: 1px solid var(--border-color);
          padding: 4px 12px 4px 4px;
          border-radius: 30px;
          gap: 10px;
        }

        .user-number {
          background: var(--accent-green);
          color: var(--bg-dark);
          font-weight: 900;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }

        /* 2-COLUMN LAYOUT */
        .pskpitx-layout {
          display: flex;
          gap: 1.5rem;
          padding: 1.5rem;
          flex: 1;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          overflow: hidden;
        }

        .panel {
          background-color: rgba(17, 17, 17, 0.85);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-header {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          font-weight: 700;
          font-size: 1.2rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          background: linear-gradient(180deg, rgba(57,255,20,0.05) 0%, transparent 100%);
          flex-shrink: 0;
        }

        /* SIDEBAR */
        .sidebar-left {
          width: 280px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          overflow-y: auto;
          flex-shrink: 0;
          padding-right: 5px;
        }
        .sidebar-left::-webkit-scrollbar { width: 4px; }
        .sidebar-left::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

        .telemetry-bar {
          height: 4px;
          background: #333;
          margin-top: 5px;
          border-radius: 2px;
          overflow: hidden;
        }
        .telemetry-fill {
          height: 100%;
          background: var(--accent-green);
          width: 100%;
          animation: pulse-bar 2s infinite alternate;
        }
        @keyframes pulse-bar {
          0% { opacity: 0.6; }
          100% { opacity: 1; box-shadow: 0 0 10px var(--accent-green-glow); }
        }

        .blink-fast {
          animation: blink-fast 1s infinite;
        }
        @keyframes blink-fast {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* SPONSORS */
        .sponsors-list {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 8px; /* Reduced gap */
        }
        .sponsor-card {
          background: var(--bg-panel-light);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 8px 12px; /* Compact padding */
          transition: all 0.3s ease;
          position: relative;
        }
        .sponsor-card:not(:last-child)::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 10%;
          width: 80%;
          height: 1px;
          background: rgba(255,255,255,0.05);
        }
        .sponsor-card:hover {
          border-color: var(--accent-green);
          box-shadow: 0 0 15px var(--accent-green-glow);
          transform: translateY(-2px);
          z-index: 2;
        }
        .sponsor-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }
        .sponsor-name {
          font-size: 11px; /* Required 11px */
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sponsor-badge {
          font-size: 9px;
          font-family: 'Barlow Condensed', sans-serif;
          letter-spacing: 0.5px;
          padding: 1px 4px;
          border-radius: 10px;
          display: inline-block;
          background: rgba(255,255,255,0.05);
          font-weight: 600;
          white-space: nowrap;
        }
        .sponsor-links {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
        .sponsor-link {
          color: var(--text-muted);
          transition: 0.2s;
          position: relative;
        }
        .sponsor-link:hover {
          color: var(--accent-green);
          transform: scale(1.1);
        }
        .sponsor-link svg {
          width: 18px; /* 18px inline SVG */
          height: 18px;
        }
        /* Tooltip */
        .sponsor-link::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-5px);
          background: #000;
          color: var(--accent-green);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: 0.2s;
          border: 1px solid var(--accent-green);
          z-index: 10;
        }
        .sponsor-link:hover::after {
          opacity: 1;
          transform: translateX(-50%) translateY(-2px);
        }

        /* FEED */
        .feed-container {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding-right: 10px;
        }
        .feed-container::-webkit-scrollbar { width: 6px; }
        .feed-container::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

        .create-post {
          padding: 1.5rem;
          border-top: 3px solid var(--accent-green);
          flex-shrink: 0;
        }
        .create-post textarea {
          width: 100%;
          background: var(--bg-dark);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1rem;
          color: white;
          font-family: inherit;
          font-size: 1.1rem;
          resize: none;
          outline: none;
          transition: border-color 0.3s;
        }
        .create-post textarea:focus {
          border-color: var(--accent-green);
          box-shadow: 0 0 10px var(--accent-green-glow);
        }
        .post-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 1rem;
        }
        .btn {
          background: var(--bg-panel-light);
          border: 1px solid var(--border-color);
          color: white;
          padding: 8px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.2s;
        }
        .btn:hover {
          background: var(--border-color);
          box-shadow: 0 0 10px rgba(255,255,255,0.1);
        }
        .btn-primary {
          background: var(--accent-green);
          color: var(--bg-dark);
          border-color: var(--accent-green);
        }
        .btn-primary:hover {
          background: #2DEB11;
          box-shadow: 0 0 20px var(--accent-green-glow);
        }

        .feed-tabs {
          display: flex;
          gap: 1rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
          flex-shrink: 0;
        }
        .tab {
          background: none;
          border: none;
          color: var(--text-muted);
          font-family: 'Orbitron', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          padding: 5px 10px;
          transition: color 0.3s;
          position: relative;
        }
        .tab.active {
          color: var(--accent-green);
        }
        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -11px;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--accent-green);
          box-shadow: 0 -2px 10px var(--accent-green-glow);
        }

        .post {
          background: var(--bg-panel);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          overflow: hidden;
          animation: slideUp 0.5s ease-out;
          transition: transform 0.2s, box-shadow 0.2s;
          flex-shrink: 0;
        }
        .post:hover {
          border-color: var(--accent-green);
          box-shadow: 0 5px 20px rgba(57,255,20,0.1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .post.OFFICIAL { border-left: 4px solid var(--accent-green); }
        .post.ALERT { border-left: 4px solid var(--accent-green); }
        .post.PILOT { border-left: 4px solid var(--text-muted); }

        .post-header {
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .post-avatar {
          width: 45px; height: 45px;
          background: var(--bg-panel-light);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; border: 1px solid var(--border-color);
        }
        .post-meta { flex: 1; }
        .post-author { font-size: 1.2rem; font-weight: 700; display: flex; align-items: center; gap: 8px;}
        .post-badge {
          font-size: 0.7rem; padding: 2px 6px; border-radius: 4px;
          font-family: 'Orbitron', sans-serif; letter-spacing: 1px;
        }
        .badge-official { background: rgba(57, 255, 20, 0.1); color: var(--accent-green); border: 1px solid var(--accent-green); }
        .badge-alert { background: rgba(57, 255, 20, 0.1); color: var(--accent-green); border: 1px solid var(--accent-green); }
        .post-time { font-size: 0.9rem; color: var(--text-muted); margin-top: 2px; }
        
        .post-body {
          padding: 1.5rem; font-size: 1.2rem; line-height: 1.5; letter-spacing: 0.5px;
        }
        .post-image {
          width: 100%; max-height: 450px; object-fit: contain; background: #000;
          border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);
        }

        .post-footer {
          padding: 1rem 1.5rem; background: rgba(0,0,0,0.2);
          display: flex; align-items: center; justify-content: space-between;
        }
        .reactions { display: flex; gap: 10px; }
        .reaction-btn {
          background: var(--bg-panel-light); border: 1px solid var(--border-color);
          padding: 5px 12px; border-radius: 20px; color: white; cursor: pointer;
          font-weight: 600; display: flex; align-items: center; gap: 6px; transition: all 0.2s;
        }
        .reaction-btn:hover { background: #333; transform: scale(1.05); }
        .reaction-btn.active {
          background: rgba(57, 255, 20, 0.15); border-color: var(--accent-green); color: var(--accent-green);
        }
        
        .comments-section { padding: 0 1.5rem 1.5rem 1.5rem; }
        .comment {
          background: var(--bg-panel-light); padding: 10px 15px; border-radius: 8px;
          margin-top: 10px; font-size: 1.1rem;
        }
        .comment-author { font-weight: 700; color: var(--accent-green); margin-right: 8px; }
        
        .comment-form { display: flex; gap: 8px; margin-top: 15px; }
        .comment-form input {
          flex: 1; background: var(--bg-dark); border: 1px solid var(--border-color);
          color: white; padding: 10px 15px; border-radius: 8px; font-family: inherit; font-size: 0.95rem; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .comment-form input:focus { border-color: var(--accent-green); box-shadow: 0 0 10px var(--accent-green-glow); }
        .comment-submit {
          background: var(--bg-panel-light); border: 1px solid var(--border-color); color: var(--accent-green);
          padding: 0 20px; border-radius: 8px; cursor: pointer; font-family: 'Orbitron', sans-serif; font-weight: 700;
          transition: all 0.2s;
        }
        .comment-submit:hover { background: var(--accent-green); color: var(--bg-dark); border-color: var(--accent-green); box-shadow: 0 0 15px var(--accent-green-glow); }

        /* FLOATING CHAT BUTTON */
        .floating-chat-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--accent-green);
          color: var(--bg-dark);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 0 20px var(--accent-green-glow);
          z-index: 1000;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: pulse-glow 2s infinite;
        }
        .floating-chat-btn:hover {
          transform: scale(1.1);
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(57, 255, 20, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(57, 255, 20, 0); }
          100% { box-shadow: 0 0 0 0 rgba(57, 255, 20, 0); }
        }
        .chat-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #FF1E1E;
          color: white;
          font-size: 12px;
          font-weight: bold;
          border-radius: 10px;
          padding: 2px 6px;
          border: 2px solid var(--bg-dark);
        }

        /* FLOATING CHAT MODAL */
        .chat-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 998;
          backdrop-filter: blur(2px);
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        .chat-modal {
          position: fixed;
          bottom: 0;
          right: 30px;
          width: 380px;
          height: 50vh;
          min-height: 400px;
          background: #111;
          border: 1px solid var(--border-color);
          border-top: 3px solid var(--accent-green);
          border-radius: 12px 12px 0 0;
          box-shadow: 0 -5px 30px rgba(0,0,0,0.8);
          z-index: 999;
          display: flex;
          flex-direction: column;
          animation: slideUpModal 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        @keyframes slideUpModal {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .chat-container { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
        .chat-messages {
          flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 1rem;
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-thumb { background: #333; }

        .chat-bubble-wrapper { display: flex; gap: 10px; max-width: 85%; }
        .chat-bubble-wrapper.mine { align-self: flex-end; flex-direction: row-reverse; }
        .chat-avatar {
          width: 30px; height: 30px; background: #222; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0;
        }
        .chat-bubble {
          background: var(--bg-panel-light); padding: 10px 15px; border-radius: 12px 12px 12px 2px;
          border: 1px solid var(--border-color); position: relative;
        }
        .mine .chat-bubble {
          background: rgba(57, 255, 20, 0.1); border-color: rgba(57, 255, 20, 0.3); border-radius: 12px 12px 2px 12px;
        }
        .chat-meta { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px; display: flex; gap: 8px; }
        .mine .chat-meta { justify-content: flex-end; }
        .chat-text { font-size: 1.1rem; line-height: 1.4; }

        .chat-input-area { padding: 1rem; border-top: 1px solid var(--border-color); background: rgba(0,0,0,0.2); }
        .quick-replies { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 10px; }
        .quick-replies::-webkit-scrollbar { height: 0; }
        .qr-btn {
          background: #222; border: 1px solid #444; color: #CCC; padding: 4px 10px;
          border-radius: 15px; font-size: 0.9rem; white-space: nowrap; cursor: pointer; transition: 0.2s;
        }
        .qr-btn:hover { background: var(--accent-green); color: var(--bg-dark); border-color: var(--accent-green); }
        
        .chat-form { display: flex; gap: 10px; }
        .chat-form input {
          flex: 1; background: var(--bg-dark); border: 1px solid var(--border-color);
          color: white; padding: 0 15px; border-radius: 20px; font-family: inherit; font-size: 1.1rem; outline: none;
        }
        .chat-form input:focus { border-color: var(--accent-green); box-shadow: 0 0 10px rgba(57,255,20,0.1); }
        .chat-submit {
          background: var(--accent-green); color: var(--bg-dark); border: none; width: 40px; height: 40px;
          border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;
        }
        .chat-submit:hover { transform: scale(1.1); box-shadow: 0 0 15px var(--accent-green-glow); }

        .typing-indicator { font-size: 0.9rem; color: var(--accent-green); font-style: italic; padding: 0 1rem; animation: blink 1s infinite; }

        /* RESPONSIVE */
        @media (max-width: 768px) { 
          .pskpitx-app { height: auto; min-height: 100dvh; overflow: visible; }
          .pskpitx-header.mobile-header { height: auto; padding: 0 10px; flex-direction: column; }
          .pskpitx-layout { gap: 10px; padding: 8px; flex-direction: column; overflow-y: visible; }
          .panel { padding: 12px; }
          .post { padding: 0; }
          .post-header { padding: 10px; gap: 8px; }
          .post-avatar { width: 35px; height: 35px; font-size: 1.2rem; }
          .post-author { font-size: 1rem; }
          .post-time { font-size: 0.8rem; }
          .post-body { padding: 10px; font-size: 13px; }
          .post-footer { padding: 10px; flex-direction: column; gap: 10px; align-items: stretch; }
          .reactions { overflow-x: auto; padding-bottom: 5px; }
          .reactions::-webkit-scrollbar { height: 0; }
          .reaction-btn { font-size: 0.8rem; padding: 4px 10px; white-space: nowrap; }
          .create-post textarea { height: 80px; }
          .post-actions { flex-wrap: wrap; }
          .post-actions .btn-primary { flex: 1; width: 100%; }
          .sponsors-list { display: flex; flex-direction: column; gap: 10px; }
          .sponsor-card { padding: 12px; }
          .sponsor-header { font-size: 12px; }
          .sponsor-links { flex-wrap: wrap; justify-content: flex-start; }
          .panel-header { font-size: 14px; }
          .sidebar-left { width: 100%; }
          .feed-container { overflow-y: visible; }
          .chat-modal { width: 100%; right: 0; bottom: 0; border-radius: 12px 12px 0 0; height: 60%; }
          .floating-chat-btn { bottom: 20px; right: 20px; }
        }
      `}} />

      {/* HEADER */}
      <header className={`pskpitx-header ${isMobile ? 'mobile-header' : ''}`}>
        {isMobile ? (
          <div style={{display: 'flex', flexDirection: 'column', width: '100%', padding: '10px 0'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <div style={{ width: '24px' }}></div> {/* Spacer para equilibrar el avatar de la derecha */}
              </div>
              <div className="header-user" style={{ padding: 0 }}>
                <div className="user-badge" style={{padding: '4px 8px'}}>
                  <span className="user-number font-display" style={{ background: 'var(--accent-green)', fontSize: '1rem' }}>{currentUser.number}</span>
                  <span style={{ fontWeight: 600, letterSpacing: '1px', marginLeft: '5px', fontSize: '0.9rem' }}>{currentUser.name}</span>
                </div>
              </div>
            </div>
            <div className="font-display" style={{textAlign: 'center', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '2px', color: 'var(--text-main)', textShadow: '0 0 10px rgba(57,255,20,0.4)'}}>
              🏁 PSKPITX
            </div>
            <div className="font-display" style={{textAlign: 'center', fontSize: '11px', color: 'var(--accent-green)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', marginTop: '5px', marginBottom: '8px'}}>
              <div className="live-dot" style={{width: '6px', height: '6px'}}></div>
              COPA STUNT F2R • NITROX 2026
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center' }}>
              <a href="https://facebook.com/copastuntcolombia" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="22" height="22"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/><path fill="#fff" d="M16.671 15.542l.532-3.469h-3.328V9.822c0-.949.465-1.874 1.956-1.874h1.514V5.006s-1.375-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.633H7.078v3.469h3.047v8.385a12.09 12.09 0 003.875 0v-8.385h2.671z"/></svg></a>
              <a href="https://instagram.com/copastuntcolombia" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="22" height="22"><defs><linearGradient id="ig-grad-header-m" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path fill="url(#ig-grad-header-m)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
            </div>
          </div>
        ) : (
          <>
            <div className="header-logo font-display">
              <span>🏁</span> PSKPITX
            </div>
            
            <div className="live-indicator font-display">
              <div className="live-dot"></div>
              COPA STUNT F2R • NITROX 2026 MEDELLÍN
            </div>

            <div className="header-user">
              <div style={{ display: 'flex', gap: '15px', marginRight: '15px', alignItems: 'center' }}>
                <a href="https://facebook.com/copastuntcolombia" target="_blank" rel="noopener noreferrer" style={{ transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  <svg viewBox="0 0 24 24" width="28" height="28">
                    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    <path fill="#fff" d="M16.671 15.542l.532-3.469h-3.328V9.822c0-.949.465-1.874 1.956-1.874h1.514V5.006s-1.375-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.633H7.078v3.469h3.047v8.385a12.09 12.09 0 003.875 0v-8.385h2.671z"/>
                  </svg>
                </a>
                <a href="https://instagram.com/copastuntcolombia" target="_blank" rel="noopener noreferrer" style={{ transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  <svg viewBox="0 0 24 24" width="28" height="28">
                    <defs>
                      <linearGradient id="ig-grad-header" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#ig-grad-header)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </a>
              </div>
              <div className="user-badge">
                <span className="user-number font-display" style={{ background: 'var(--accent-green)' }}>{currentUser.number}</span>
                <span style={{ fontWeight: 600, letterSpacing: '1px', marginRight: '5px' }}>{currentUser.name}</span>
              </div>
            </div>
          </>
        )}
      </header>

      {/* MAIN LAYOUT (2 COLUMNS) */}
      <div className="pskpitx-layout">
        
        {/* LEFT SIDEBAR */}
        <aside className="sidebar-left" style={{ display: isMobile ? 'contents' : 'flex' }}>
          
          <div className="panel" style={{ flexShrink: 0, order: isMobile ? -1 : 0 }}>
            <div className="panel-header font-display" style={{ color: 'var(--accent-green)' }}>
              ⏱️ TRACK STATUS
            </div>
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>
                {getEventStatus()}
              </div>
              
              {/* Contained Countdown */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="font-display" style={{ fontSize: isMobile ? '2.8rem' : '2rem', fontWeight: 900, color: 'var(--accent-green)', textShadow: '0 0 10px rgba(57,255,20,0.3)', lineHeight: 1 }}>{String(timeLeft.days).padStart(2, '0')}</span>
                  <span style={{ fontSize: isMobile ? '10px' : '0.7rem', color: 'var(--text-muted)' }}>DÍAS</span>
                </div>
                <span className="font-display" style={{ fontSize: isMobile ? '2rem' : '1.8rem', color: 'var(--text-muted)', transform: isMobile ? 'translateY(5px)' : 'none' }}>:</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="font-display" style={{ fontSize: isMobile ? '2.8rem' : '2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span style={{ fontSize: isMobile ? '10px' : '0.7rem', color: 'var(--text-muted)' }}>HRS</span>
                </div>
                <span className="font-display" style={{ fontSize: isMobile ? '2rem' : '1.8rem', color: 'var(--text-muted)', transform: isMobile ? 'translateY(5px)' : 'none' }}>:</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="font-display" style={{ fontSize: isMobile ? '2.8rem' : '2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span style={{ fontSize: isMobile ? '10px' : '0.7rem', color: 'var(--text-muted)' }}>MIN</span>
                </div>
                <span className="font-display" style={{ fontSize: isMobile ? '2rem' : '1.8rem', color: 'var(--text-muted)', transform: isMobile ? 'translateY(5px)' : 'none' }}>:</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="font-display" style={{ fontSize: isMobile ? '2.8rem' : '2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span style={{ fontSize: isMobile ? '10px' : '0.7rem', color: 'var(--text-muted)' }}>SEG</span>
                </div>
              </div>
              
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '1px', borderTop: '1px solid #333', paddingTop: '8px' }}>
                📍 PLAZA MAYOR MEDELLÍN
              </div>
              
              <div className="telemetry-bar"><div className="telemetry-fill"></div></div>
            </div>
          </div>

          {/* SPONSORS PANEL */}
          <div className="panel" style={{ flexShrink: 0, order: isMobile ? 5 : 0 }}>
            <div className="panel-header font-display" style={{ color: 'var(--accent-green)' }}>
              ⚡ SPONSORS & REDES
            </div>
            <div className="sponsors-list">
              {SPONSORS.map((sponsor, idx) => (
                <div key={idx} className="sponsor-card">
                  <div className="sponsor-header">
                    <span style={{ fontSize: '14px' }}>{sponsor.emoji}</span>
                    <span className="sponsor-name font-display">{sponsor.name}</span>
                  </div>
                  <div className="sponsor-badge" style={{ color: sponsor.badgeColor, border: `1px solid ${sponsor.badgeColor}` }}>
                    {sponsor.badge}
                  </div>
                  <div className="sponsor-links">
                    {sponsor.links.ig && <a href={sponsor.links.ig} data-tooltip={sponsor.links.ig.replace('https://instagram.com/','@')} target="_blank" rel="noopener noreferrer" className="sponsor-link"><IgIcon /></a>}
                    {sponsor.links.yt && <a href={sponsor.links.yt} data-tooltip="YouTube" target="_blank" rel="noopener noreferrer" className="sponsor-link"><YtIcon /></a>}
                    {sponsor.links.tk && <a href={sponsor.links.tk} data-tooltip={sponsor.links.tk.replace('https://tiktok.com/','')} target="_blank" rel="noopener noreferrer" className="sponsor-link"><TkIcon /></a>}
                    {sponsor.links.fb && <a href={sponsor.links.fb} data-tooltip="Facebook" target="_blank" rel="noopener noreferrer" className="sponsor-link"><FbIcon /></a>}
                    {sponsor.links.web && <a href={sponsor.links.web} data-tooltip="Sitio Web" target="_blank" rel="noopener noreferrer" className="sponsor-link"><WebIcon /></a>}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </aside>

        {/* CENTER FEED (FLEX-GROW) */}
        <main className="feed-container" style={{ display: isMobile ? 'contents' : 'block' }}>
          
          {/* Create Post */}
          <div className="panel create-post" style={{ order: isMobile ? 1 : 0 }}>
            <form onSubmit={handlePostSubmit}>
              <textarea 
                rows={3} 
                placeholder="¿Qué está pasando en los preparativos? Comparte comentarios..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
              />
              <div className="post-actions">
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn">📸 FOTO</button>
                  <button type="button" className="btn">⚠️ ALERTA</button>
                </div>
                <button type="submit" className="btn btn-primary">PUBLICAR</button>
              </div>
            </form>
          </div>

          <div className="feed-tabs" style={{ order: isMobile ? 2 : 0, overflowX: isMobile ? 'auto' : 'visible', whiteSpace: isMobile ? 'nowrap' : 'normal' }}>
            <button className={`tab ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>TODO EL FEED</button>
            <button className={`tab ${activeTab === 'OFFICIAL' ? 'active' : ''}`} onClick={() => setActiveTab('OFFICIAL')}>OFICIAL / ALERTAS</button>
            <button className={`tab ${activeTab === 'MINE' ? 'active' : ''}`} onClick={() => setActiveTab('MINE')}>MIS POSTS</button>
          </div>

          {/* Posts List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', order: isMobile ? 3 : 0, width: '100%' }}>
            {filteredPosts.map(post => (
              <article key={post.id} className={`post ${post.type}`}>
                <div className="post-header">
                  <div className="post-avatar">{post.authorAvatar}</div>
                  <div className="post-meta">
                    <div className="post-author">
                      {post.authorName}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>#{post.authorNumber}</span>
                      {post.type === 'OFFICIAL' && <span className="post-badge badge-official">OFICIAL</span>}
                      {post.type === 'ALERT' && <span className="post-badge badge-alert">URGENTE</span>}
                    </div>
                    <div className="post-time font-display">{post.timestamp}</div>
                  </div>
                </div>
                
                <div className="post-body">
                  {post.content}
                </div>
                
                {post.image && (
                  <img src={post.image} alt="Post Attachment" className="post-image" />
                )}

                <div className="post-footer">
                  <div className="reactions">
                    <button className={`reaction-btn ${post.userReacted === 'fast' ? 'active' : ''}`} onClick={() => handleReaction(post.id, 'fast')}>
                      🏎️ {post.reactions.fast}
                    </button>
                    <button className={`reaction-btn ${post.userReacted === 'champ' ? 'active' : ''}`} onClick={() => handleReaction(post.id, 'champ')}>
                      🏁 {post.reactions.champ}
                    </button>
                    <button className={`reaction-btn ${post.userReacted === 'fire' ? 'active' : ''}`} onClick={() => handleReaction(post.id, 'fire')}>
                      🔥 {post.reactions.fire}
                    </button>
                    <button className={`reaction-btn ${post.userReacted === 'eyes' ? 'active' : ''}`} onClick={() => handleReaction(post.id, 'eyes')}>
                      👀 {post.reactions.eyes}
                    </button>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                    {post.comments.length} COMENTARIOS
                  </div>
                </div>

                <div className="comments-section">
                  {post.comments.length > 0 && (
                    <div className="comments-list">
                      {post.comments.map(comment => (
                        <div key={comment.id} className="comment">
                          <span className="comment-author">{comment.author} <span style={{color: '#666'}}>#{comment.number}</span></span>
                          {comment.text}
                        </div>
                      ))}
                    </div>
                  )}
                  <form className="comment-form" onSubmit={(e) => handleCommentSubmit(post.id, e)}>
                    <input 
                      type="text" 
                      placeholder="Escribe un comentario..." 
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})}
                    />
                    <button type="submit" className="comment-submit">ENVIAR</button>
                  </form>
                </div>
              </article>
            ))}
          </div>

        </main>
      </div>

      {/* FLOATING CHAT BUTTON */}
      <button className="floating-chat-btn" onClick={() => setIsChatOpen(true)}>
        🎙️
        <span className="chat-badge">34</span>
      </button>

      {/* FLOATING CHAT MODAL */}
      {isChatOpen && (
        <>
          <div className="chat-modal-overlay"></div>
          <div className="chat-modal" ref={chatModalRef}>
            <div className="panel-header font-display" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🎙️ ZONA NITROX CHAT</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div className="live-dot" style={{ width: '6px', height: '6px' }}></div>
                  34 ONLINE
                </span>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="chat-container">
              <div className="chat-messages">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`chat-bubble-wrapper ${msg.isMine ? 'mine' : ''}`}>
                    {!msg.isMine && <div className="chat-avatar">{msg.authorAvatar}</div>}
                    <div className="chat-bubble">
                      <div className="chat-meta">
                        <strong style={{ color: msg.isMine ? 'var(--accent-green)' : 'var(--text-main)' }}>
                          {msg.authorName} #{msg.authorNumber}
                        </strong>
                        <span className="font-display">{msg.timestamp}</span>
                      </div>
                      <div className="chat-text">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isTyping && <div className="typing-indicator">Race Control está escribiendo...</div>}
                <div ref={chatEndRef} />
              </div>

              <div className="chat-input-area">
                <div className="quick-replies">
                  {QUICK_REPLIES.map(qr => (
                    <button key={qr} className="qr-btn" onClick={() => handleChatSubmit(null, qr)}>
                      {qr}
                    </button>
                  ))}
                </div>
                <form className="chat-form" onSubmit={handleChatSubmit}>
                  <input 
                    type="text" 
                    placeholder="Mensaje a la organización..." 
                    value={newChatText}
                    onChange={(e) => setNewChatText(e.target.value)}
                  />
                  <button type="submit" className="chat-submit font-display">
                    {'>'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
