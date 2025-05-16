import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { WorldViewIcon, getWorldViewName } from '@/components/world-view-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { WorldView, ChatMessage, ChatSession } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchChatSessions,
  fetchChatSession,
  fetchChatMessages,
  createChatSession,
  deleteChatSession,
  sendChatMessage
} from '@/lib/api';

// Get worldview colors for styling
const getWorldViewColor = (worldview: string): string => {
  switch (worldview) {
    case 'christianity': return 'text-blue-600';
    case 'islam': return 'text-green-600';
    case 'hinduism': return 'text-orange-600';
    case 'buddhism': return 'text-yellow-600';
    case 'judaism': return 'text-purple-600';
    case 'atheism': return 'text-red-600';
    case 'agnosticism': return 'text-gray-600';
    default: return 'text-slate-600';
  }
};

export default function Chat() {
  const [location, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionWorldview, setNewSessionWorldview] = useState<string>(WorldView.CHRISTIANITY);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to fetch all sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['/api/chat/sessions'],
    queryFn: () => fetchChatSessions(),
  });

  // Query to fetch messages for the current session
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/chat/sessions', sessionId, 'messages'],
    queryFn: () => sessionId 
      ? fetchChatMessages(sessionId) 
      : Promise.resolve([]),
    enabled: !!sessionId,
  });
  
  // Query to fetch the current session data
  const { data: currentSession } = useQuery({
    queryKey: ['/api/chat/sessions', sessionId],
    queryFn: () => sessionId 
      ? fetchChatSession(sessionId) 
      : Promise.resolve(null),
    enabled: !!sessionId,
  });

  // Create a new session mutation
  const createSessionMutation = useMutation({
    mutationFn: (newSession: { worldview: string; title: string }) => 
      createChatSession(newSession),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      setSessionId(data.id);
      setIsCreatingSession(false);
      toast({
        title: 'Session created',
        description: `Started chat with ${getWorldViewName(data.worldview as WorldView)} expert.`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create chat session. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete chat session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => deleteChatSession(id),
    onSuccess: () => {
      if (sessionId === sessionToDelete) {
        setSessionId(null); // Clear the current session if it was deleted
      }
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      toast({
        title: 'Session deleted',
        description: 'Chat session was deleted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete chat session. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Track the session being deleted for UI purposes
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => 
      sendChatMessage(sessionId as string, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions', sessionId, 'messages'] });
      setMessage('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    },
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
            <p className="text-gray-500 mb-2">Your conversation with {currentSession ? getWorldViewName(currentSession.worldview as WorldView) : 'an expert'}</p>
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
                <div className="flex items-center mb-1">
                  <WorldViewIcon
                    worldview={currentSession.worldview as WorldView}
                    size={16}
                    className="mr-1"
                  />
                  <span className={`text-xs font-medium ${getWorldViewColor(currentSession.worldview)}`}>
                    {getWorldViewName(currentSession.worldview as WorldView)}
                  </span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
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

  // Handler for quick chat start
  const handleQuickChat = (worldview: WorldView) => {
    const title = `Chat with ${getWorldViewName(worldview)}`;
    createSessionMutation.mutate({
      worldview,
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
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sessions Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>Sessions</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingSession(true)}
                >
                  New
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {isLoadingSessions ? (
                <p className="text-center py-4">Loading sessions...</p>
              ) : sessions.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No sessions yet</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session: ChatSession) => (
                    <div key={session.id} className="flex items-center gap-2">
                      <Button
                        variant={sessionId === session.id ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSessionId(session.id)}
                      >
                        <div className="flex items-center">
                          <WorldViewIcon
                            worldview={session.worldview as WorldView}
                            size={20}
                            className="mr-2"
                          />
                          <div className="truncate">{session.title}</div>
                        </div>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => handleDeleteClick(e, session.id)}
                        disabled={deleteSessionMutation.isPending}
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
            </CardContent>
          </Card>
        </div>
        
        {/* Chat Area */}
        <div className="md:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              {currentSession && (
                <CardTitle className="flex items-center">
                  <WorldViewIcon
                    worldview={currentSession.worldview as WorldView}
                    size={24}
                    className="mr-2"
                  />
                  <span>
                    Chat with {getWorldViewName(currentSession.worldview as WorldView)} Expert
                  </span>
                </CardTitle>
              )}
            </CardHeader>
            
            <CardContent className="flex-grow overflow-y-auto pb-0 min-h-[400px] max-h-[600px]">
              {renderMessages()}
            </CardContent>
            
            <CardFooter className="mt-auto pt-4">
              {sessionId && (
                <form onSubmit={handleSubmit} className="w-full flex items-center space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button 
                    type="submit" 
                    disabled={!message.trim() || sendMessageMutation.isPending}
                  >
                    Send
                  </Button>
                </form>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* New Session Dialog */}
      <Dialog open={isCreatingSession} onOpenChange={setIsCreatingSession}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a New Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium">
                Chat Topic
              </label>
              <Input
                id="topic"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                placeholder="Enter a topic or title for this chat"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="worldview" className="text-sm font-medium">
                Worldview Expert
              </label>
              <Select
                value={newSessionWorldview}
                onValueChange={setNewSessionWorldview}
              >
                <SelectTrigger id="worldview">
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
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreatingSession(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSession}
                disabled={!newSessionTitle.trim() || createSessionMutation.isPending}
              >
                Start Chat
              </Button>
            </div>
          </div>
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
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 text-white hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}