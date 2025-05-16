import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { WorldViewIcon, getWorldViewName, getWorldViewColor } from "@/components/world-view-icons";
import { WorldView, type ChatMessage, type ChatSession, AIModel } from "@shared/schema";
import { fetchChatSessions, fetchChatSession, createChatSession, deleteChatSession, fetchChatMessages, sendChatMessage } from "@/lib/api";
import ModelSelector from "@/components/model-selector";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Chat() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);
  const [newSessionWorldview, setNewSessionWorldview] = useState<string>(WorldView.CHRISTIANITY);
  const [selectedWorldviews, setSelectedWorldviews] = useState<string[]>([]);
  const [isGroupChatMode, setIsGroupChatMode] = useState<boolean>(false);
  const [newSessionTitle, setNewSessionTitle] = useState<string>("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(AIModel.GPT_4_O);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // Fetch chat sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['/api/chat/sessions'],
    queryFn: () => fetchChatSessions(),
  });
  
  // Fetch current chat session data
  const { data: currentSession } = useQuery({
    queryKey: ['/api/chat/sessions', sessionId],
    queryFn: () => fetchChatSession(sessionId!),
    enabled: !!sessionId,
  });
  
  // Fetch messages for current session
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/chat/sessions', sessionId, 'messages'],
    queryFn: () => fetchChatMessages(sessionId!),
    enabled: !!sessionId,
  });
  
  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (data: { worldview: string, worldviews?: string[], isGroupChat?: boolean, title: string }) => {
      return createChatSession(data);
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      setSessionId(newSession.id);
      setIsCreatingSession(false);
      setNewSessionTitle("");
      setSelectedWorldviews([]);
      setIsGroupChatMode(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create chat session: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => {
      return sendChatMessage(sessionId!, {
        content,
        model: selectedModel
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions', sessionId, 'messages'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to send message: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: deleteChatSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      
      if (sessionToDelete === sessionId) {
        setSessionId(null);
      }
      
      setSessionToDelete(null);
      toast({
        title: 'Success',
        description: 'Chat session deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete chat session: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle submitting a new message
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !sessionId) return;
    
    sendMessageMutation.mutate(message);
  };

  // Handle creating a new session
  const handleCreateSession = () => {
    if (!newSessionTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title for the chat session.',
        variant: 'destructive',
      });
      return;
    }

    createSessionMutation.mutate({
      worldview: newSessionWorldview,
      title: newSessionTitle,
    });
  };
  
  // Handle session deletion
  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent selecting the session
    setSessionToDelete(sessionId);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = () => {
    if (sessionToDelete) {
      deleteSessionMutation.mutate(sessionToDelete);
      setDeleteConfirmOpen(false);
    }
  };

  // Render messages
  const renderMessages = () => {
    if (isLoadingMessages) {
      return (
        <div className="flex items-center justify-center h-64">
          <p>Loading messages...</p>
        </div>
      );
    }

    if (!sessionId) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-6">
          <div className="text-center">
            <p className="text-gray-500 mb-2">Select a session from the sidebar or start a new chat</p>
            <p className="text-sm text-gray-400">Connect with experts from different worldviews and explore your questions</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[WorldView.CHRISTIANITY, WorldView.BUDDHISM, WorldView.ATHEISM].map((worldview) => (
              <Button 
                key={worldview}
                onClick={() => handleQuickChat(worldview)}
                variant="outline"
                className={`flex items-center gap-2 ${getWorldViewButtonStyle(worldview)}`}
                disabled={createSessionMutation.isPending}
              >
                <WorldViewIcon worldview={worldview} size={16} />
                {getWorldViewName(worldview)}
              </Button>
            ))}
          </div>
          <Button onClick={() => setIsCreatingSession(true)}>Create Custom Chat</Button>
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-center">
            <p className="text-gray-500 mb-2">
              {currentSession?.isGroupChat
                ? `Group conversation with ${
                    Array.isArray(currentSession.worldviews) && currentSession.worldviews.length > 0
                      ? currentSession.worldviews
                          .slice(0, 3)
                          .map(w => getWorldViewName(w as WorldView))
                          .join(", ") + 
                          (currentSession.worldviews.length > 3 ? ` and ${currentSession.worldviews.length - 3} more` : '')
                      : "multiple worldviews"
                  }`
                : `Your conversation with ${currentSession ? getWorldViewName(currentSession.worldview as WorldView) : 'an expert'}`
              }
            </p>
            <p className="text-sm text-gray-400">Ask any questions about life, ethics, spirituality, or philosophy</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 max-w-md">
            <h3 className="text-sm font-medium mb-2">Suggested questions:</h3>
            <ul className="text-sm space-y-2">
              <li>• What happens after death according to your worldview?</li>
              <li>• How does your worldview approach the problem of suffering?</li>
              <li>• What is the meaning of life in your perspective?</li>
              <li>• How should humans treat each other according to your tradition?</li>
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {messages.map((msg: ChatMessage) => (
          <div
            key={msg.id}
            className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.isUser
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {!msg.isUser && currentSession && (
                <>
                  {/* For group chats with worldview prefixes */}
                  {currentSession.isGroupChat && msg.content.startsWith('**') && msg.content.includes(' perspective:**') ? (
                    <>
                      {(() => {
                        // Extract the worldview name from the message
                        const parts = msg.content.split('\n');
                        const worldviewHeader = parts[0]; // "**Christianity perspective:**"
                        const messageContent = parts.slice(1).join('\n');
                        const worldviewName = worldviewHeader.replace('**', '').replace(' perspective:**', '');
                        
                        // Find the matching worldview enum
                        let worldviewEnum: WorldView | null = null;
                        Object.values(WorldView).forEach(wv => {
                          if (getWorldViewName(wv) === worldviewName) {
                            worldviewEnum = wv;
                          }
                        });
                        
                        return (
                          <>
                            <div className="flex items-center mb-1">
                              {worldviewEnum && (
                                <>
                                  <WorldViewIcon
                                    worldview={worldviewEnum}
                                    size={16}
                                    className="mr-1"
                                  />
                                  <span className={`text-xs font-medium ${getWorldViewColor(worldviewEnum)}`}>
                                    {worldviewName} Perspective
                                  </span>
                                </>
                              )}
                              
                              {/* Model badge */}
                              {msg.model && (
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 text-slate-700 flex items-center">
                                  <span className="font-semibold mr-0.5">OpenAI</span>
                                  {msg.model.includes("gpt") && msg.model.replace("gpt-", "GPT-")}
                                </span>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap">{messageContent}</p>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                      {/* Regular single worldview chat */}
                      <div className="flex items-center mb-1">
                        <WorldViewIcon
                          worldview={currentSession.worldview as WorldView}
                          size={16}
                          className="mr-1"
                        />
                        <span className={`text-xs font-medium ${getWorldViewColor(currentSession.worldview as WorldView)}`}>
                          {getWorldViewName(currentSession.worldview as WorldView)}
                        </span>
                        
                        {/* Model badge - only show for AI messages */}
                        {msg.model && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 text-slate-700 flex items-center">
                            <span className="font-semibold mr-0.5">OpenAI</span>
                            {msg.model.includes("gpt") && msg.model.replace("gpt-", "GPT-")}
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </>
                  )}
                </>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  // Handler for quick chat start (single worldview)
  const handleQuickChat = (worldview: WorldView) => {
    const title = `Chat with ${getWorldViewName(worldview)}`;
    createSessionMutation.mutate({
      worldview,
      worldviews: [worldview],
      isGroupChat: false,
      title,
    });
  };
  
  // Handler for creating a group chat with multiple worldviews
  const handleCreateGroupChat = () => {
    if (selectedWorldviews.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one worldview for your group chat',
        variant: 'destructive',
      });
      return;
    }
    
    // Set the primary worldview to the first selected one (for backward compatibility)
    const primaryWorldview = selectedWorldviews[0];
    const title = newSessionTitle || `Group Chat with ${selectedWorldviews.length} Worldviews`;
    
    createSessionMutation.mutate({
      worldview: primaryWorldview,
      worldviews: selectedWorldviews,
      isGroupChat: true,
      title,
    });
  };

  // Get background color for worldview buttons
  const getWorldViewButtonStyle = (worldview: string): string => {
    switch (worldview) {
      case WorldView.CHRISTIANITY:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300';
      case WorldView.ISLAM:
        return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300';
      case WorldView.HINDUISM:
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300';
      case WorldView.BUDDHISM:
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300';
      case WorldView.JUDAISM:
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300';
      case WorldView.ATHEISM:
        return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300';
      case WorldView.AGNOSTICISM:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300';
      case WorldView.SIKHISM:
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300';
      default:
        return 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-300';
    }
  };

  return (
    <div className="container max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Chat with Worldview Experts</h1>
      
      {/* Quick chat buttons */}
      <div className="mb-8">
        <p className="text-sm text-slate-600 mb-3">Start a new conversation with:</p>
        <div className="flex flex-wrap gap-2">
          {Object.values(WorldView).map((worldview) => (
            <Button 
              key={worldview}
              onClick={() => handleQuickChat(worldview as WorldView)}
              variant="outline"
              className={`flex items-center gap-2 ${getWorldViewButtonStyle(worldview)}`}
              disabled={createSessionMutation.isPending}
            >
              <WorldViewIcon worldview={worldview as WorldView} size={16} />
              {getWorldViewName(worldview as WorldView)}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Mobile Tabs for Sessions/Chat */}
      <div className="block md:hidden mb-4">
        <Tabs defaultValue="chat">
          <TabsList className="w-full">
            <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
            <TabsTrigger value="sessions" className="flex-1">Sessions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="border rounded-md p-4">
            <Card>
              <CardHeader className="py-3">
                {currentSession && (
                  <CardTitle className="flex items-center">
                    {currentSession.isGroupChat ? (
                      <>
                        <div className="flex -space-x-2 mr-2">
                          {Array.isArray(currentSession.worldviews) && currentSession.worldviews.slice(0, 3).map((worldview, index) => (
                            <div key={index} className="border-2 border-white rounded-full">
                              <WorldViewIcon
                                worldview={worldview as WorldView}
                                size={20}
                                className="rounded-full"
                              />
                            </div>
                          ))}
                        </div>
                        <span className="text-sm">{currentSession.title || "Group Conversation"}</span>
                        {Array.isArray(currentSession.worldviews) && currentSession.worldviews.length > 3 && (
                          <span className="text-xs text-gray-500 ml-1">
                            +{currentSession.worldviews.length - 3} more
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <WorldViewIcon
                          worldview={currentSession.worldview as WorldView}
                          size={20}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          {getWorldViewName(currentSession.worldview as WorldView)}
                        </span>
                      </>
                    )}
                  </CardTitle>
                )}
              </CardHeader>
              
              <CardContent className="flex-grow overflow-y-auto pb-0 min-h-[400px]">
                {renderMessages()}
              </CardContent>
              
              {sessionId && (
                <CardFooter className="pt-4 flex-col space-y-3">
                  <ModelSelector 
                    selectedModel={selectedModel}
                    onChange={(model) => {
                      setSelectedModel(model);
                    }}
                    disabled={sendMessageMutation.isPending}
                  />
                  <form onSubmit={handleSubmit} className="w-full">
                    <div className="flex gap-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button 
                        type="submit" 
                        disabled={!message.trim() || sendMessageMutation.isPending}
                      >
                        Send
                      </Button>
                    </div>
                  </form>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="sessions">
            <div className="border rounded-md p-4 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Your Conversations</h2>
                <Button 
                  size="sm" 
                  onClick={() => setIsCreatingSession(true)}
                >
                  New Chat
                </Button>
              </div>
              
              {isLoadingSessions ? (
                <p>Loading sessions...</p>
              ) : sessions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No chat sessions yet. Start a new conversation!</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session: ChatSession) => (
                    <div
                      key={session.id}
                      onClick={() => setSessionId(session.id)}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 flex justify-between items-center ${
                        session.id === sessionId ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        <WorldViewIcon
                          worldview={session.worldview as WorldView}
                          size={16}
                          className="mr-2"
                        />
                        <div>
                          <p className="font-medium text-sm">{session.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteClick(e, session.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-4 border rounded-md p-4 h-[calc(100vh-12rem)] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Your Conversations</h2>
            <Button 
              size="sm" 
              onClick={() => setIsCreatingSession(true)}
            >
              New Chat
            </Button>
          </div>
          
          <div className="flex-grow overflow-y-auto space-y-2">
            {isLoadingSessions ? (
              <p>Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No chat sessions yet. Start a new conversation!</p>
            ) : (
              sessions.map((session: ChatSession) => (
                <div
                  key={session.id}
                  onClick={() => setSessionId(session.id)}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 flex justify-between items-center ${
                    session.id === sessionId ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <WorldViewIcon
                      worldview={session.worldview as WorldView}
                      size={16}
                      className="mr-2 flex-shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm truncate">{session.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 flex-shrink-0"
                    onClick={(e) => handleDeleteClick(e, session.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="col-span-8">
          <Card className="h-[calc(100vh-12rem)] flex flex-col">
            <CardHeader className="py-3">
              {currentSession && (
                <CardTitle className="flex items-center">
                  {currentSession.isGroupChat ? (
                    <>
                      {/* Group chat title with multiple icons */}
                      <div className="flex -space-x-2 mr-2">
                        {Array.isArray(currentSession.worldviews) && currentSession.worldviews.slice(0, 3).map((worldview, index) => (
                          <div key={index} className="border-2 border-white rounded-full">
                            <WorldViewIcon
                              worldview={worldview as WorldView}
                              size={20}
                              className="rounded-full"
                            />
                          </div>
                        ))}
                      </div>
                      <span className="ml-2">{currentSession.title}</span>
                      {Array.isArray(currentSession.worldviews) && currentSession.worldviews.length > 3 && (
                        <span className="text-xs text-gray-500 ml-1">
                          +{currentSession.worldviews.length - 3} more
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Single worldview chat title */}
                      <WorldViewIcon
                        worldview={currentSession.worldview as WorldView}
                        size={20}
                        className="mr-2"
                      />
                      <span>{getWorldViewName(currentSession.worldview as WorldView)}</span>
                    </>
                  )}
                </CardTitle>
              )}
            </CardHeader>
            
            <CardContent className="flex-grow overflow-y-auto pb-0">
              {renderMessages()}
            </CardContent>
            
            {sessionId && (
              <CardFooter className="pt-4 flex-col space-y-3">
                <ModelSelector 
                  selectedModel={selectedModel}
                  onChange={(model) => {
                    setSelectedModel(model);
                  }}
                  disabled={sendMessageMutation.isPending}
                />
                <form onSubmit={handleSubmit} className="w-full">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-grow"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button 
                      type="submit" 
                      disabled={!message.trim() || sendMessageMutation.isPending}
                    >
                      Send
                    </Button>
                  </div>
                </form>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
      
      {/* Create Session Dialog */}
      <Dialog open={isCreatingSession} onOpenChange={setIsCreatingSession}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Chat</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="single" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="single" 
                onClick={() => {
                  setIsGroupChatMode(false);
                  setSelectedWorldviews([]);
                }}>
                Single Expert
              </TabsTrigger>
              <TabsTrigger 
                value="group" 
                onClick={() => setIsGroupChatMode(true)}>
                Group Chat
              </TabsTrigger>
            </TabsList>
            
            {/* Single Expert Chat Tab */}
            <TabsContent value="single" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="worldview">Select Worldview Expert</Label>
                <Select
                  value={newSessionWorldview}
                  onValueChange={setNewSessionWorldview}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a worldview" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(WorldView).map((worldview) => (
                      <SelectItem key={worldview} value={worldview}>
                        <div className="flex items-center">
                          <WorldViewIcon 
                            worldview={worldview as WorldView} 
                            size={16} 
                            className="mr-2" 
                          />
                          {getWorldViewName(worldview as WorldView)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Chat Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="E.g., Questions about meditation"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  If left empty, a default title will be generated.
                </p>
              </div>
              <DialogFooter className="px-0">
                <Button
                  onClick={() => {
                    createSessionMutation.mutate({
                      worldview: newSessionWorldview,
                      worldviews: [newSessionWorldview],
                      isGroupChat: false,
                      title: newSessionTitle || `Chat with ${getWorldViewName(newSessionWorldview as WorldView)}`
                    });
                  }}
                  disabled={createSessionMutation.isPending}
                >
                  {createSessionMutation.isPending ? "Creating..." : "Create Chat"}
                </Button>
              </DialogFooter>
            </TabsContent>
            
            {/* Group Chat Tab */}
            <TabsContent value="group" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Multiple Worldview Experts</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {Object.values(WorldView).map((worldview) => {
                    const isSelected = selectedWorldviews.includes(worldview);
                    return (
                      <div 
                        key={worldview}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedWorldviews(selectedWorldviews.filter(w => w !== worldview));
                          } else {
                            setSelectedWorldviews([...selectedWorldviews, worldview]);
                          }
                        }}
                        className={`flex items-center p-2 border rounded-md cursor-pointer ${
                          isSelected ? 'bg-teal-50 border-teal-500' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 mr-2 rounded border accent-teal-500"
                        />
                        <div className="flex flex-col items-start">
                          <div className="flex items-center">
                            <WorldViewIcon worldview={worldview as WorldView} size={14} className="mr-1 flex-shrink-0" />
                            <span className="font-medium text-sm">{getWorldViewName(worldview as WorldView)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select multiple worldviews for a comparative discussion.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-title">Group Chat Title (Optional)</Label>
                <Input
                  id="group-title"
                  placeholder="E.g., Comparing views on consciousness"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  If left empty, a default title will be generated based on selected worldviews.
                </p>
              </div>
              <DialogFooter className="px-0">
                <Button 
                  onClick={handleCreateGroupChat}
                  disabled={selectedWorldviews.length === 0 || createSessionMutation.isPending}
                >
                  {createSessionMutation.isPending ? "Creating..." : "Create Group Chat"}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat session and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}