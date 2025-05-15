import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { WorldViewIcon, getWorldViewName } from '@/components/world-view-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
    queryFn: () => apiRequest<ChatSession[]>('/api/chat/sessions'),
  });

  // Query to fetch messages for the current session
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/chat/sessions', sessionId, 'messages'],
    queryFn: () => sessionId 
      ? apiRequest<ChatMessage[]>(`/api/chat/sessions/${sessionId}/messages`) 
      : Promise.resolve([]),
    enabled: !!sessionId,
  });

  // Query to fetch the current session details
  const { data: currentSession } = useQuery({
    queryKey: ['/api/chat/sessions', sessionId],
    queryFn: () => sessionId 
      ? apiRequest<ChatSession>(`/api/chat/sessions/${sessionId}`) 
      : Promise.resolve(null),
    enabled: !!sessionId,
  });

  // Create a new session mutation
  const createSessionMutation = useMutation({
    mutationFn: (newSession: { worldview: string; title: string }) => 
      apiRequest('/api/chat/sessions', {
        method: 'POST',
        body: JSON.stringify(newSession),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: (data: ChatSession) => {
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

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest(`/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
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
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-gray-500">Select or create a chat session to start</p>
          <Button onClick={() => setIsCreatingSession(true)}>New Chat</Button>
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No messages yet. Start the conversation!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {messages.map((msg) => (
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

  return (
    <div className="container max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Chat with Worldview Experts</h1>
      
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
                  {sessions.map((session) => (
                    <Button
                      key={session.id}
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
    </div>
  );
}