import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatIcon as MessageSquare,
  SendMessageIcon as Send,
  CodingBracketsIcon as Code,
  UploadIcon as Upload,
  SearchIcon as Search,
  CheckIcon as Check,
  CheckCircleIcon as CheckCheck,
  CloseIcon as X,
  AddIcon as Plus,
  LoadingStatusIcon as Loader2,
  CodeFileIcon as FileText,
  UserIcon,
  InformationStatusIcon as Volume2,
  InformationStatusIcon as VolumeX,
  WarningStatusIcon as Circle,
  ShieldAlertIcon as ShieldAlert,
  ArrowLeftIcon,
} from './icons';
import { ChatMessage, Conversation, chatClient } from '../services/chatClient';
import { r2StorageClient, UploadProgressEvent } from '../services/r2StorageClient';

interface DirectMessagesViewProps {
  currentUserId?: string;
  initialTargetUserId?: string;
  onOpenAuthModal?: () => void;
  onOpenWorkspaceWithCode?: (code: string, problemNameOrId?: string) => void;
}

export const DirectMessagesView: React.FC<DirectMessagesViewProps> = ({
  currentUserId,
  initialTargetUserId,
  onOpenAuthModal,
  onOpenWorkspaceWithCode,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [messageText, setMessageText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // File upload state
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time states
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const lastTypingSignalRef = useRef<number>(0);

  // New Chat Search Modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherUserTyping]);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    try {
      const list = await chatClient.listConversations();
      setConversations(list);

      // If initial target user is provided, open or create conversation
      if (initialTargetUserId && (!activeConversationId || list.length === 0)) {
        const existing = list.find((c) => c.otherUser.id === initialTargetUserId);
        if (existing) {
          setActiveConversationId(existing.id);
          setMobileView('chat');
        } else {
          const newConv = await chatClient.getOrCreateConversation(initialTargetUserId);
          setConversations((prev) => [newConv, ...prev]);
          setActiveConversationId(newConv.id);
          setMobileView('chat');
        }
      } else if (!activeConversationId && list.length > 0) {
        setActiveConversationId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  }, [initialTargetUserId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Handle dynamic switching of target user
  useEffect(() => {
    if (!initialTargetUserId || !currentUserId) return;
    const switchToUser = async () => {
      try {
        const existing = conversations.find((c) => c.otherUser.id === initialTargetUserId);
        if (existing) {
          setActiveConversationId(existing.id);
          setMobileView('chat');
        } else {
          const newConv = await chatClient.getOrCreateConversation(initialTargetUserId);
          setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
          setActiveConversationId(newConv.id);
          setMobileView('chat');
        }
      } catch (err) {
        console.error('Failed to switch conversation to target user:', err);
      }
    };
    switchToUser();
  }, [initialTargetUserId, currentUserId]);

  // Start presence tracking
  useEffect(() => {
    if (!currentUserId) return;
    const cleanup = chatClient.startPresence(currentUserId, () => {
      // Trigger re-render of online indicators
      setConversations((prev) => [...prev]);
    });
    return cleanup;
  }, [currentUserId]);

  // Load messages and subscribe to active conversation channel
  useEffect(() => {
    if (!activeConversationId) return;

    setLoadingMessages(true);
    setIsOtherUserTyping(false);

    // 1. Fetch persistent history from Supabase
    chatClient
      .getMessages(activeConversationId)
      .then((data) => {
        setMessages(data.messages);
      })
      .catch((err) => console.error('Failed to load messages:', err))
      .finally(() => setLoadingMessages(false));

    // 2. Mark conversation as read
    chatClient.markAsRead(activeConversationId).catch(() => {});
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
    );

    // 3. Subscribe to Realtime messages and typing broadcast
    const unsubscribe = chatClient.subscribeToConversation(
      activeConversationId,
      (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        chatClient.markAsRead(activeConversationId).catch(() => {});
      },
      ({ userId, isTyping }) => {
        if (userId !== currentUserId) {
          setIsOtherUserTyping(isTyping);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsOtherUserTyping(false);
            }, 3000);
          }
        }
      }
    );

    return () => {
      unsubscribe();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeConversationId, currentUserId]);

  // Handle typing indicator broadcast
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    if (!activeConversationId || !currentUserId) return;

    const now = Date.now();
    if (now - lastTypingSignalRef.current > 1500) {
      chatClient.sendTypingIndicator(activeConversationId, currentUserId, true);
      lastTypingSignalRef.current = now;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !codeSnippet.trim() && attachments.length === 0) || isSending || !activeConversationId) {
      return;
    }

    setIsSending(true);
    const textToSend = messageText.trim();
    const codeToSend = codeSnippet.trim();
    const attachmentsToSend = [...attachments];

    // Clear local inputs
    setMessageText('');
    setCodeSnippet('');
    setShowCodeInput(false);
    setAttachments([]);

    // Clear typing broadcast
    if (currentUserId) {
      chatClient.sendTypingIndicator(activeConversationId, currentUserId, false);
    }

    try {
      const sent = await chatClient.sendMessage({
        conversationId: activeConversationId,
        content: textToSend || (codeToSend ? 'Shared a code snippet' : 'Shared attachment'),
        codeSnippet: codeToSend || null,
        attachments: attachmentsToSend,
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });

      // Update conversation in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                lastMessage: {
                  text: sent.content,
                  timestamp: sent.created_at,
                  senderId: sent.sender_id,
                },
                updatedAt: sent.created_at,
              }
            : c
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
      setMessageText(textToSend);
      setCodeSnippet(codeToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await r2StorageClient.uploadFile(
        file,
        'messages',
        (prog: UploadProgressEvent) => {
          setUploadProgress(prog.percent);
        }
      );

      setAttachments((prev) => [
        ...prev,
        {
          fileType: result.fileType,
          fileName: result.fileName,
          fileSize: result.fileSize,
          mimeType: result.mimeType,
          r2Key: result.fileKey,
          url: result.publicUrl,
        },
      ]);
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // User search for new chat
  const handleSearchUsers = async (q: string) => {
    setUserSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=users`);
      const data = await res.json();
      setSearchResults(data.results?.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleStartChatWithUser = async (targetUser: any) => {
    try {
      const conv = await chatClient.getOrCreateConversation(targetUser.id);
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
      setActiveConversationId(conv.id);
      setMobileView('chat');
      setShowNewChatModal(false);
      setUserSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      alert(err.message || 'Failed to start conversation');
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  if (!currentUserId) {
    return (
      <div className="h-[calc(100vh-140px)] max-h-[820px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
              Direct Peer Messaging
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Connect directly with other competitive programmers, share algorithms, discuss contest problems, and exchange C++ code snippets in real time.
            </p>
          </div>
          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Sign In with Google to Chat</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] max-h-[820px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col md:flex-row">
      {/* Left Sidebar: Conversation List */}
      <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 bg-slate-50/50 dark:bg-slate-950/40 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Messages
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowNewChatModal(true)}
            className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
            title="Start new direct message"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation List Stream */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {loadingConvs ? (
            <div className="p-4 text-xs text-slate-400">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <MessageSquare className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">No conversations yet.</p>
              <button
                type="button"
                onClick={() => setShowNewChatModal(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                + Start a direct chat
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isOnline = chatClient.isUserOnline(conv.otherUser.id);
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setMobileView('chat');
                  }}
                  className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Avatar + Online Indicator */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs overflow-hidden border border-indigo-500/20">
                      {conv.otherUser.avatar_url ? (
                        <img src={conv.otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        conv.otherUser.display_name.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {conv.otherUser.display_name}
                      </span>
                      {conv.lastMessage?.timestamp && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                        {conv.lastMessage?.text || 'No messages yet'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Main Pane: Active Conversation */}
      <div className={`flex-1 flex-col h-full bg-white dark:bg-slate-900 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {activeConv ? (
          <>
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="md:hidden -ml-1 p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Back to messages list"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </button>

                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs overflow-hidden">
                    {activeConv.otherUser.avatar_url ? (
                      <img src={activeConv.otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      activeConv.otherUser.display_name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  {chatClient.isUserOnline(activeConv.otherUser.id) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {activeConv.otherUser.display_name}
                  </h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    {chatClient.isUserOnline(activeConv.otherUser.id) ? (
                      <span className="text-emerald-500 font-semibold">Active now</span>
                    ) : (
                      <span>Offline</span>
                    )}
                  </p>
                </div>
              </div>

              {/* No call buttons here! Strictly text messaging */}
              <div className="flex items-center gap-2 text-slate-400">
                <button
                  type="button"
                  onClick={() => alert('Conversation notifications muted')}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Mute conversation"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading history...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <p className="text-xs text-slate-400">
                    This is the start of your direct conversation with {activeConv.otherUser.display_name}.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Ask doubts, share solution algorithms, and exchange code snippets safely.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl p-3 text-xs space-y-1.5 shadow-sm ${
                          isMine
                            ? 'bg-indigo-600 text-white rounded-br-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs'
                        }`}
                      >
                        {/* Message text */}
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                        {/* Code snippet if attached */}
                        {msg.code_snippet && (
                          <div className="rounded-xl overflow-hidden bg-slate-950 p-2.5 border border-slate-800 text-[11px] font-mono text-emerald-300 shadow-inner">
                            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px] text-slate-400">
                              <span>Code Snippet</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(msg.code_snippet!);
                                    alert('Code copied to clipboard!');
                                  }}
                                  className="hover:text-emerald-400 transition-colors cursor-pointer text-[10px]"
                                >
                                  Copy
                                </button>
                                {onOpenWorkspaceWithCode && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenWorkspaceWithCode(msg.code_snippet!);
                                    }}
                                    className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                                  >
                                    <Code className="w-3 h-3" />
                                    <span>Open in IDE</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <pre className="overflow-x-auto">
                              <code>{msg.code_snippet}</code>
                            </pre>
                          </div>
                        )}

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {msg.attachments.map((att, i) => (
                              <a
                                key={i}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[11px] underline"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{att.fileName}</span>
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Timestamp & Status */}
                        <div
                          className={`flex items-center justify-end gap-1 text-[9px] ${
                            isMine ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMine && <CheckCheck className="w-3 h-3 text-indigo-300" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isOtherUserTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-[11px] text-slate-500">{activeConv.otherUser.display_name} is typing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2 shrink-0">
              {showCodeInput && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Code Snippet:</span>
                    <button
                      type="button"
                      onClick={() => setShowCodeInput(false)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      ✕
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    placeholder="// Paste code snippet..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Attachments preview */}
              {attachments.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {attachments.map((att, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                    >
                      <FileText className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{att.fileName}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                        className="hover:text-rose-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2.5 rounded-xl bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
                  title="Upload attachment (Cloudflare R2)"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCodeInput(!showCodeInput)}
                  className={`p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                    showCodeInput
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  title="Attach code snippet"
                >
                  <Code className="w-4 h-4" />
                </button>

                <textarea
                  rows={1}
                  value={messageText}
                  onChange={handleTextChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Type a message... (Press Enter to send)"
                  className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
                />

                <button
                  type="submit"
                  disabled={isSending || (!messageText.trim() && !codeSnippet.trim() && attachments.length === 0)}
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Direct Messages
            </h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Select an existing conversation from the left or start a new chat with any programmer.
            </p>
            <button
              type="button"
              onClick={() => setShowNewChatModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start New Conversation</span>
            </button>
          </div>
        )}
      </div>

      {/* New Chat Search Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Start New Direct Message
              </h3>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search coder by name or @username..."
                value={userSearchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
              {isSearchingUsers ? (
                <p className="text-xs text-slate-400 py-3 text-center">Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  {userSearchQuery ? 'No programmers found.' : 'Type a name to search members.'}
                </p>
              ) : (
                searchResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleStartChatWithUser(u)}
                    className="w-full p-2.5 flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs overflow-hidden">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          u.display_name.slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {u.display_name}
                        </p>
                        {u.username && <p className="text-[10px] text-slate-400">@{u.username}</p>}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      Message
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
