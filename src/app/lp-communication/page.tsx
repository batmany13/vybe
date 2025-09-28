"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useChannels, useMessages, useChannel, sendMessage, createChannel, addChannelMember, useChannelMembers, useLimitedPartners, deleteMessage } from '@/client-lib/api-client';
import { authClient } from '@/client-lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Hash, Lock, Plus, Users, Send, Search, MoreVertical, UserPlus, Trash2, MoreHorizontal, Circle, ChevronDown, AtSign, Paperclip, Smile, Bold, Italic, Code, Link2, ListOrdered, ListIcon, Quote, GripVertical, Loader2, MessageSquare, ChevronRight, PanelLeftClose, PanelLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, formatDistanceToNow, isToday, isYesterday, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { mutate } from 'swr';

export default function LPCommunicationPage() {
  const { data: session } = process.env.NODE_ENV === 'production' ? authClient.useSession() : 
    { data: {
        user: {
          name: 'Bruce Wang',
          email: 'byyw13@gmail.com',
          image: undefined,
        }
    }};

  const { data: channels, isLoading: channelsLoading } = useChannels();
  const { data: limitedPartners } = useLimitedPartners();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const { data: currentChannel } = useChannel(selectedChannelId || '');
  const { data: messages, mutate: mutateMessages, isLoading: messagesLoading } = useMessages(selectedChannelId || '');
  const { data: channelMembers } = useChannelMembers(selectedChannelId || '');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    description: '',
    is_private: false
  });
  const [selectedLPEmail, setSelectedLPEmail] = useState('');
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastChannelIdRef = useRef<string | null>(null);

  // Sidebar resize state
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const MIN_SIDEBAR_WIDTH = 200;
  const MAX_SIDEBAR_WIDTH = 420;

  // Handle sidebar resize
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resize, stopResizing]);

  // Auto-scroll to bottom when new messages arrive (only if we're near the bottom)
  useEffect(() => {
    if (messages && selectedChannelId === lastChannelIdRef.current) {
      const scrollArea = messagesEndRef.current?.parentElement;
      if (scrollArea) {
        const isNearBottom = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < 100;
        if (isNearBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else if (selectedChannelId !== lastChannelIdRef.current) {
      // Instant scroll on channel change
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      }, 100);
      lastChannelIdRef.current = selectedChannelId;
    }
  }, [messages, selectedChannelId]);

  // Select first channel by default
  useEffect(() => {
    if (channels && channels.length > 0 && !selectedChannelId) {
      const nonDMChannels = channels.filter(ch => !ch.name.startsWith('dm-'));
      if (nonDMChannels.length > 0) {
        setSelectedChannelId(nonDMChannels[0].id);
      }
    }
  }, [channels, selectedChannelId]);

  // Auto-refresh messages every 10 seconds (increased from 5)
  useEffect(() => {
    if (selectedChannelId) {
      const interval = setInterval(() => {
        mutateMessages();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedChannelId, mutateMessages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChannelId || !session?.user || isSending) return;

    const messageContent = messageInput.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic update - immediately add message to UI
    const optimisticMessage = {
      id: tempId,
      channel_id: selectedChannelId,
      user_email: session.user.email,
      user_name: session.user.name,
      content: messageContent,
      created_at: new Date().toISOString(),
      edited: false
    };

    // Clear input immediately
    setMessageInput('');
    setIsSending(true);
    
    // Instantly update the messages without await - this makes it appear immediately
    mutate(
      `/channels/${selectedChannelId}/messages`,
      [...(messages || []), optimisticMessage],
      false
    );

    // Scroll to bottom immediately to show the new message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);

    try {
      // Send message in background
      await sendMessage(selectedChannelId, messageContent);
      
      // Refresh messages after successful send
      setTimeout(() => {
        mutateMessages();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Revert optimistic update on error
      mutateMessages();
      setMessageInput(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelData.name.trim() || !session?.user) return;

    try {
      const channel = await createChannel({
        ...newChannelData,
        created_by: session.user.email
      });
      setIsCreateChannelOpen(false);
      setNewChannelData({ name: '', description: '', is_private: false });
      setSelectedChannelId(channel.id);
      toast.success('Channel created successfully');
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error('Failed to create channel');
    }
  };

  const handleAddMember = async () => {
    if (!selectedLPEmail || !selectedChannelId) return;

    try {
      await addChannelMember(selectedChannelId, selectedLPEmail);
      setIsAddMemberOpen(false);
      setSelectedLPEmail('');
      toast.success('Member added successfully');
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedChannelId || !session?.user) return;

    // Optimistically remove the message
    const updatedMessages = messages?.filter(m => m.id !== messageId) || [];
    await mutate(
      `/channels/${selectedChannelId}/messages`,
      updatedMessages,
      false
    );

    try {
      await deleteMessage(selectedChannelId, messageId);
      toast.success('Message deleted');
      mutateMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
      mutateMessages(); // Revert on error
    }
  };

  const handleDirectMessage = async (targetLP: any) => {
    if (!session?.user) return;

    try {
      // Create a DM channel name using both emails (sorted for consistency)
      const emails = [session.user.email, targetLP.email].sort();
      const dmChannelName = `dm-${emails[0].replace('@', '-at-')}-${emails[1].replace('@', '-at-')}`;
      
      // Check if DM channel already exists
      const existingChannel = channels?.find(ch => ch.name === dmChannelName);
      
      if (existingChannel) {
        // Open existing DM channel
        setSelectedChannelId(existingChannel.id);
      } else {
        // Create new DM channel
        const newDMChannel = await createChannel({
          name: dmChannelName,
          description: `Direct message between ${session.user.name} and ${targetLP.name}`,
          is_private: true,
          created_by: session.user.email
        });
        
        // Add the target LP to the channel
        await addChannelMember(newDMChannel.id, targetLP.email);
        
        // Select the new channel
        setSelectedChannelId(newDMChannel.id);
        toast.success(`Started conversation with ${targetLP.name}`);
      }
    } catch (error) {
      console.error('Error creating DM:', error);
      toast.error('Failed to start direct message');
    }
  };

  // Helper function to check if a channel is a DM
  const isDMChannel = (channel: any) => {
    if (!channel || !channel.name) return false;
    return channel.name.startsWith('dm-');
  };

  // Helper function to get DM partner name from channel
  const getDMPartnerName = (channel: any) => {
    if (!channel || !channel.name) return '';
    if (!isDMChannel(channel) || !session?.user) return channel.name;
    
    // Extract emails from channel name
    const channelParts = channel.name.replace('dm-', '').split('-');
    const email1 = channelParts[0]?.replace('-at-', '@');
    const email2 = channelParts[2]?.replace('-at-', '@');
    
    // Find the other person's email
    const partnerEmail = email1 === session.user.email ? email2 : email1;
    
    // Find the LP with this email
    const partner = limitedPartners?.find(lp => lp.email === partnerEmail);
    return partner?.name || partnerEmail || channel.name;
  };

  // Memoize filtered channels
  const filteredChannels = useMemo(() => 
    channels?.filter(channel => 
      channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [channels, searchQuery]
  );

  // Memoize filtered LPs
  const filteredLPs = useMemo(() => 
    limitedPartners?.filter(lp => {
      if (!dmSearchQuery) return true;
      const searchLower = dmSearchQuery.toLowerCase();
      return lp.name.toLowerCase().includes(searchLower) || 
             lp.company.toLowerCase().includes(searchLower);
    }).sort((a, b) => a.name.localeCompare(b.name)),
    [limitedPartners, dmSearchQuery]
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d at h:mm a');
    }
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d');
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    if (!messages) return null;
    return messages.reduce((groups: any, message: any) => {
      const date = formatMessageDate(message.created_at);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});
  }, [messages]);

  return (
    <div className="h-[calc(100vh-3rem)] flex bg-background">
      {/* Sidebar */}
      <Card 
        ref={sidebarRef}
        style={{ width: sidebarCollapsed ? '60px' : `${sidebarWidth}px` }}
        className="rounded-none border-r border-t-0 border-b-0 border-l-0 flex flex-col relative flex-shrink-0 transition-all duration-200"
      >
        {/* Workspace Header */}
        <CardHeader className="p-3 border-b">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-sm font-bold text-primary">
                  CT
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">Gandhi Capital LPs</div>
                  <div className="flex items-center gap-1">
                    <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                    <span className="text-xs text-muted-foreground">{channelMembers?.length || 0} members</span>
                  </div>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        {!sidebarCollapsed && (
          <>
            {/* Search */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search channels"
                  className="pl-8 h-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Channels Section */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <button className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className="w-3 h-3" />
                    <span>Channels</span>
                  </button>
                  <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5">
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create a channel</DialogTitle>
                        <DialogDescription>
                          Channels are where your team communicates. They're best when organized around a topic.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="channel-name">Name</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-muted-foreground">#</span>
                            <Input
                              id="channel-name"
                              placeholder="e.g. ai-investments"
                              className="pl-8"
                              value={newChannelData.name}
                              onChange={(e) => setNewChannelData({ ...newChannelData, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Names must be lowercase, without spaces or periods</p>
                        </div>
                        <div>
                          <Label htmlFor="channel-description">Description (optional)</Label>
                          <Textarea
                            id="channel-description"
                            placeholder="What's this channel about?"
                            value={newChannelData.description}
                            onChange={(e) => setNewChannelData({ ...newChannelData, description: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="private-channel"
                            checked={newChannelData.is_private}
                            onCheckedChange={(checked) => setNewChannelData({ ...newChannelData, is_private: checked })}
                          />
                          <Label htmlFor="private-channel">Make private</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {newChannelData.is_private 
                            ? "This can't be undone. A private channel cannot be made public later on."
                            : "Anyone in your workspace can view and join this channel."}
                        </p>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateChannelOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateChannel} disabled={!newChannelData.name.trim()}>Create</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-1">
                  {channelsLoading ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
                  ) : filteredChannels?.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">No channels found</div>
                  ) : (
                    filteredChannels
                      ?.filter(channel => !isDMChannel(channel)) // Hide DM channels from regular channels list
                      .map((channel) => (
                        <button
                          key={channel.id}
                          onClick={() => setSelectedChannelId(channel.id)}
                          className={cn(
                            "w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5",
                            selectedChannelId === channel.id 
                              ? 'bg-accent text-accent-foreground' 
                              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                          )}
                        >
                          {channel.is_private ? (
                            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                          ) : (
                            <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                          <span className="truncate">{channel.name}</span>
                          {channel.unread_count && channel.unread_count > 0 && (
                            <Badge variant="destructive" className="ml-auto h-4 px-1.5 text-[10px]">
                              {channel.unread_count}
                            </Badge>
                          )}
                        </button>
                      ))
                  )}
                </div>
              </div>

              {/* Direct Messages Section */}
              <div className="px-3 py-2 flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <button className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className="w-3 h-3" />
                    <span>Direct messages</span>
                  </button>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                
                {/* DM Search */}
                {limitedPartners && limitedPartners.length > 5 && (
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search people"
                      className="w-full pl-7 pr-2 py-1 text-xs bg-muted/50 border-0 rounded text-foreground placeholder:text-muted-foreground focus:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
                      value={dmSearchQuery}
                      onChange={(e) => setDmSearchQuery(e.target.value)}
                    />
                  </div>
                )}
                
                <div className="space-y-1 overflow-y-auto flex-1">
                  {filteredLPs && filteredLPs.length > 0 ? (
                    filteredLPs
                      .map((lp) => {
                        // Check if there's an active DM channel with this person
                        const emails = [session?.user?.email || '', lp.email].sort();
                        const dmChannelName = `dm-${emails[0].replace('@', '-at-')}-${emails[1].replace('@', '-at-')}`;
                        const activeDM = channels?.find(ch => ch.name === dmChannelName);
                        const isSelected = activeDM && selectedChannelId === activeDM.id;
                        
                        return (
                          <button
                            key={lp.id}
                            onClick={() => handleDirectMessage(lp)}
                            className={cn(
                              "w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 group",
                              isSelected 
                                ? 'bg-accent text-accent-foreground' 
                                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                            )}
                            title={`${lp.name} - ${lp.company} (${lp.status})`}
                          >
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={lp.avatar_url} />
                                <AvatarFallback className="text-[10px]">
                                  {getInitials(lp.name)}
                                </AvatarFallback>
                              </Avatar>
                              <Circle 
                                className={cn(
                                  "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-background",
                                  lp.status === 'active' 
                                    ? "fill-green-500 text-green-500" 
                                    : "fill-muted text-muted"
                                )}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={cn("truncate text-xs font-medium", isSelected && "text-accent-foreground")}>{lp.name}</div>
                              <div className={cn(
                                "text-[10px] truncate",
                                isSelected ? "text-accent-foreground/70" : "text-muted-foreground"
                              )}>{lp.company}</div>
                            </div>
                            {activeDM?.unread_count && activeDM.unread_count > 0 && (
                              <Badge variant="destructive" className="ml-auto h-4 px-1.5 text-[10px]">
                                {activeDM.unread_count}
                              </Badge>
                            )}
                          </button>
                        );
                      })
                  ) : dmSearchQuery ? (
                    <div className="text-center py-2 text-muted-foreground text-xs">No results found</div>
                  ) : (
                    <div className="text-center py-2 text-muted-foreground text-xs">No people available</div>
                  )}
                </div>
                
                {limitedPartners && !dmSearchQuery && (
                  <div className="text-center pt-2 pb-1 text-muted-foreground text-xs border-t">
                    {limitedPartners.filter(lp => lp.status === 'active').length} active LPs
                  </div>
                )}
              </div>
            </div>

            {/* Resize Handle */}
            {!sidebarCollapsed && (
              <div
                className={cn(
                  "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors",
                  isResizing && "bg-primary/30"
                )}
                onMouseDown={startResizing}
              />
            )}
          </>
        )}

        {/* Collapsed state - show only icons */}
        {sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto py-2">
            <div className="space-y-2 px-2">
              {filteredChannels
                ?.filter(channel => !isDMChannel(channel))
                .slice(0, 5)
                .map((channel) => (
                  <Button
                    key={channel.id}
                    variant={selectedChannelId === channel.id ? "secondary" : "ghost"}
                    size="icon"
                    className="w-10 h-10"
                    onClick={() => setSelectedChannelId(channel.id)}
                    title={channel.name}
                  >
                    {channel.is_private ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Hash className="w-4 h-4" />
                    )}
                  </Button>
                ))}
              <Separator className="my-2" />
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10"
                title="Direct Messages"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Main Chat Area */}
      {selectedChannelId ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Channel Header */}
          <Card className="rounded-none border-t-0 border-x-0 h-14 flex items-center px-5 flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  {isDMChannel(currentChannel) ? (
                    <>
                      {(() => {
                        const partnerName = getDMPartnerName(currentChannel);
                        const partner = limitedPartners?.find(lp => lp.name === partnerName);
                        return (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarImage 
                                src={partner?.avatar_url} 
                                alt={partnerName}
                                className="object-cover"
                              />
                              <AvatarFallback className="text-[10px]">
                                {getInitials(partnerName)}
                              </AvatarFallback>
                            </Avatar>
                            {partnerName}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                      {currentChannel?.is_private ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Hash className="w-4 h-4 text-muted-foreground" />
                      )}
                      {currentChannel?.name}
                    </>
                  )}
                </h2>
                {!isDMChannel(currentChannel) && currentChannel?.description && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-sm text-muted-foreground truncate">{currentChannel.description}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isDMChannel(currentChannel) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsAddMemberOpen(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add people</span>
                  </Button>
                )}
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {channelMembers?.length || 0}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Messages Area */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {messagesLoading && !messages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : groupedMessages && Object.entries(groupedMessages).map(([date, dateMessages]: [string, any]) => (
                <div key={date}>
                  {/* Date Separator */}
                  <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs font-medium text-muted-foreground px-2">
                      {date}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Messages for this date */}
                  {dateMessages.map((message: any, index: number) => {
                    const isCurrentUser = message.user_email === session?.user?.email;
                    const prevMessage = dateMessages[index - 1];
                    const showAvatar = !prevMessage || prevMessage.user_email !== message.user_email || 
                                     (new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime()) > 300000; // 5 minutes
                    const isOptimistic = message.id.startsWith('temp-');
                    
                    // Find the LP data for this message sender
                    const senderLP = limitedPartners?.find(lp => lp.email === message.user_email);
                    const avatarUrl = senderLP?.avatar_url || session?.user?.image;
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "group flex gap-3 hover:bg-muted/30 px-2 py-0.5 rounded-md transition-colors",
                          !showAvatar && "pl-12",
                          isOptimistic && "opacity-70"
                        )}
                      >
                        {showAvatar ? (
                          <Avatar className="h-8 w-8 mt-0.5">
                            <AvatarImage 
                              src={avatarUrl} 
                              alt={message.user_name}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(message.user_name)}
                            </AvatarFallback>
                          </Avatar>
                        ) : null}
                        
                        <div className="flex-1 min-w-0">
                          {showAvatar && (
                            <div className="flex items-baseline gap-2">
                              <span className="font-medium text-sm">{message.user_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(message.created_at)}
                              </span>
                            </div>
                          )}
                          <div className="text-sm text-foreground break-words">
                            {message.content}
                          </div>
                        </div>

                        {/* Message Actions */}
                        {isCurrentUser && !isOptimistic && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteMessage(message.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete message
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <Card className="rounded-none border-x-0 border-b-0 p-4">
            <div className="max-w-4xl mx-auto">
              <Card>
                {/* Message Input */}
                <CardContent className="p-0">
                  <textarea
                    ref={inputRef}
                    placeholder={isDMChannel(currentChannel) 
                      ? `Message ${getDMPartnerName(currentChannel)}`
                      : `Message #${currentChannel?.name}`
                    }
                    className="w-full px-4 py-3 resize-none bg-transparent focus:outline-none min-h-[80px] max-h-[300px]"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isSending}
                  />
                  
                  {/* Bottom Toolbar */}
                  <div className="flex items-center justify-between px-4 py-2 border-t">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-4 mx-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <AtSign className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!messageInput.trim() || isSending}
                      size="sm"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-1" />
                      )}
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-1">No conversation selected</h3>
            <p className="text-sm text-muted-foreground">Choose a channel or person to start chatting</p>
          </div>
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add people to #{currentChannel?.name}</DialogTitle>
            <DialogDescription>
              Select members to add to this channel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lp-select">Select LP</Label>
              <Select value={selectedLPEmail} onValueChange={setSelectedLPEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an LP to add" />
                </SelectTrigger>
                <SelectContent>
                  {limitedPartners?.map((lp) => (
                    <SelectItem key={lp.id} value={lp.email}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={lp.avatar_url} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(lp.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{lp.name}</div>
                          <div className="text-xs text-muted-foreground">{lp.company}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={!selectedLPEmail}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}