import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChatSession } from '../schemas/sessionSchema';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  darkMode: boolean;
  onSessionLoad: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionRename?: (sessionId: string, newTitle: string) => void;
  onSessionPin?: (sessionId: string, pinned: boolean) => void;
  onDeleteAll: () => void;
  onCreateNew: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  /** Whether sidebar is collapsed (desktop only) */
  collapsed?: boolean;
  /** Callback to toggle collapse state */
  onToggleCollapse?: () => void;
  /** Whether to show sidebar on desktop (default: true) */
  showOnDesktop?: boolean;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  darkMode,
  onSessionLoad,
  onSessionDelete,
  onSessionRename,
  onSessionPin,
  onDeleteAll,
  onCreateNew,
  mobileOpen = false,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
  showOnDesktop = true
}: SidebarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Group sessions by date and sort pinned first
  const todaySessions = sessions
    .filter(s => {
      const d = new Date(s.timestamp);
      const today = new Date();
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    })
    .sort((a, b) => {
      // Pinned sessions first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

  const previousSessions = sessions
    .filter(s => {
      const d = new Date(s.timestamp);
      const today = new Date();
      return d.getDate() !== today.getDate() || d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear();
    })
    .sort((a, b) => {
      // Pinned sessions first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openMenu]);

  // Determine visibility classes
  const visibilityClass = mobileOpen
    ? 'fixed inset-y-0 left-0 z-[100] flex shadow-2xl animate-slide-in-left w-[280px]'
    : (showOnDesktop ? 'hidden md:flex relative' : 'hidden');

  // Logic: In mobile mode, Sidebar should ALWAYS be expanded (full width with text).
  // We only respect 'collapsed' prop on desktop mode (!mobileOpen).
  const isCollapsed = !mobileOpen && collapsed;

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-sm animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside 
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? "true" : undefined}
        className={`flex-shrink-0 flex-col border-border bg-background md:bg-background/50 backdrop-blur-xl transition-all duration-300 h-full text-secondary overscroll-contain
        ${visibilityClass}
        ${isCollapsed ? 'w-[68px]' : 'w-[280px]'}
      `}>

        {/* Action Buttons */}
        <div className={`px-3 py-4 space-y-2 ${isCollapsed ? 'px-2' : ''}`}>
          <Link
            to="/chat"
            onClick={() => {
              onCreateNew();
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-2 text-sm font-medium text-foreground bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl transition-all duration-200 group hover-lift
              ${isCollapsed ? 'justify-center p-2.5' : 'justify-center px-4 py-2.5'}
            `}
            title={isCollapsed ? 'New Chat' : undefined}
          >
            <span className="material-symbols-outlined text-[18px] text-indigo-400 group-hover:text-indigo-300 transition-colors">add_circle</span>
            {!isCollapsed && <span>New Chat</span>}
          </Link>



        </div>



        {/* Session List - hidden when collapsed */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40 scrollbar-track-transparent">
            {sessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-symbols-outlined text-[32px] text-tertiary/50 mb-2">forum</span>
                <p className="text-xs text-tertiary">No conversations yet</p>
              </div>
            )}

            {todaySessions.length > 0 && (
              <div className="flex items-center gap-2 px-2 py-3">
                <div className="h-px flex-1 bg-border"></div>
                <span className="text-[10px] font-medium text-tertiary uppercase tracking-wider">Today</span>
                <div className="h-px flex-1 bg-border"></div>
              </div>
            )}

            {todaySessions.map((session) => (
              <div key={session.id} className="relative group">
                <div
                  onClick={() => {
                    onSessionLoad(session.id);
                    navigate('/chat');
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center gap-3 cursor-pointer ${session.pinned
                    ? currentSessionId === session.id
                      ? 'bg-foreground text-background shadow-md border-transparent'
                      : 'bg-amber-500/5 border border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/40 text-secondary'
                    : currentSessionId === session.id
                      ? 'bg-foreground text-background shadow-md border-transparent'
                      : 'hover:bg-surface-hover/50 text-tertiary hover:text-primary'
                    }`}
                >
                  <span className={`material-symbols-outlined text-[18px] ${session.pinned
                    ? 'text-amber-500'
                    : currentSessionId === session.id
                      ? 'text-accent'
                      : 'text-tertiary group-hover:text-accent/70'
                    }`}>chat_bubble</span>

                  {renaming === session.id ? (
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="flex-1 min-w-0 bg-transparent border-b border-indigo-500 focus:outline-none text-sm text-primary"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onSessionRename?.(session.id, newTitle);
                          setRenaming(null);
                          setOpenMenu(null);
                        }
                      }}
                      onBlur={() => setRenaming(null)}
                    />
                  ) : (
                    <span className={`truncate flex-1 font-medium ${isCollapsed ? 'hidden' : ''}`}>{session.title}</span>
                  )}

                  {/* Pin indicator - always visible when pinned */}
                  {session.pinned && !renaming && (
                    <span className="material-symbols-outlined text-[14px] text-amber-500 flex-shrink-0" title="Pinned">
                      push_pin
                    </span>
                  )}

                  {!isCollapsed && !renaming && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(openMenu === session.id ? null : session.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-all flex-shrink-0 ${openMenu === session.id ? 'opacity-100' : ''}`}
                    >
                      <span className="material-symbols-outlined text-[18px] text-tertiary hover:text-primary">more_vert</span>
                    </button>
                  )}
                </div>

                {openMenu === session.id && !isCollapsed && (
                  <div ref={menuRef} className="absolute right-2 top-8 w-40 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in p-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenaming(session.id);
                        setNewTitle(session.title);
                        setOpenMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-surface-hover rounded-lg flex items-center gap-2 text-secondary"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span> Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionPin?.(session.id, !session.pinned);
                        setOpenMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-surface-hover rounded-lg flex items-center gap-2 text-secondary"
                    >
                      <span className="material-symbols-outlined text-[16px]">{session.pinned ? 'push_pin' : 'push_pin'}</span> {session.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <div className="h-px bg-border/50 my-1"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionDelete(session.id);
                        setOpenMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}

            {previousSessions.length > 0 && (
              <div className="flex items-center gap-2 px-2 py-3 mt-2">
                <div className="h-px flex-1 bg-border"></div>
                {!isCollapsed && <span className="text-[10px] font-medium text-tertiary uppercase tracking-wider">Previous</span>}
                <div className="h-px flex-1 bg-border"></div>
              </div>
            )}

            {previousSessions.map((session) => (
              <div key={session.id} className="relative group">
                <div
                  onClick={() => {
                    onSessionLoad(session.id);
                    navigate('/chat');
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center gap-3 cursor-pointer ${session.pinned
                    ? currentSessionId === session.id
                      ? 'bg-foreground text-background shadow-md border-transparent'
                      : 'bg-amber-500/5 border border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/40 text-secondary'
                    : currentSessionId === session.id
                      ? 'bg-foreground text-background shadow-md border-transparent'
                      : 'hover:bg-surface-hover/50 text-tertiary hover:text-primary'
                    }`}
                >
                  <span className={`material-symbols-outlined text-[18px] ${session.pinned
                    ? 'text-amber-500'
                    : currentSessionId === session.id
                      ? 'text-accent'
                      : 'text-tertiary group-hover:text-accent/70'
                    }`}>chat_bubble_outline</span>

                  <span className={`truncate flex-1 font-medium ${isCollapsed ? 'hidden' : ''}`}>{session.title}</span>

                  {/* Pin indicator - always visible when pinned */}
                  {session.pinned && (
                    <span className="material-symbols-outlined text-[14px] text-amber-500 flex-shrink-0" title="Pinned">
                      push_pin
                    </span>
                  )}

                  {!isCollapsed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(openMenu === session.id ? null : session.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-all flex-shrink-0 ${openMenu === session.id ? 'opacity-100' : ''}`}
                    >
                      <span className="material-symbols-outlined text-[18px] text-tertiary hover:text-primary">more_vert</span>
                    </button>
                  )}
                </div>

                {openMenu === session.id && !isCollapsed && (
                  <div ref={menuRef} className="absolute right-2 top-8 w-40 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in p-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenaming(session.id);
                        setNewTitle(session.title);
                        setOpenMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-surface-hover rounded-lg flex items-center gap-2 text-secondary"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span> Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionPin?.(session.id, !session.pinned);
                        setOpenMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-surface-hover rounded-lg flex items-center gap-2 text-secondary"
                    >
                      <span className="material-symbols-outlined text-[16px]">{session.pinned ? 'push_pin' : 'push_pin'}</span> {session.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <div className="h-px bg-border/50 my-1"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionDelete(session.id);
                        setOpenMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

        )}



        {/* Footer */}
        <div className={`pb-4 pt-3 border-t border-border/50 space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <Link
            to="/docs"
            onClick={onCloseMobile}
            className={`w-full flex items-center gap-3 text-sm rounded-xl transition-all duration-200 group ${location.pathname.startsWith('/docs')
              ? 'bg-surface-hover text-primary'
              : 'text-tertiary hover:text-primary hover:bg-surface-hover/50'
              } ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}`}
            title={isCollapsed ? 'Documentation' : undefined}
          >
            <span className="material-symbols-outlined text-[18px] text-tertiary group-hover:text-accent transition-colors">menu_book</span>
            {!isCollapsed && <span className="font-medium">Documentation</span>}
          </Link>

          {/* Collapse Toggle Button (desktop only) */}
          <button
            onClick={onToggleCollapse}
            className={`hidden md:flex items-center gap-3 w-full text-sm rounded-xl transition-all duration-200 group text-tertiary hover:text-primary hover:bg-surface-hover/50
              ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-symbols-outlined text-[18px] transition-colors">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
            {!isCollapsed && <span className="font-medium">Collapse Sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
