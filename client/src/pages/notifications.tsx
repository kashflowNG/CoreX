
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/hooks/use-auth";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, CheckCircle, Info, AlertTriangle, AlertCircle, MoreVertical, Trash2, Archive, Clock, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@shared/schema';
import { cn } from '@/lib/utils';

export default function Notifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  if (!user) {
    setLocation('/login');
    return null;
  }

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', user?.id],
    queryFn: () => fetch(`/api/notifications/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications', user?.id, 'unread-count'],
    queryFn: () => fetch(`/api/notifications/${user?.id}/unread-count`).then(res => res.json()),
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notifications/${user?.id}/mark-all-read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const getTypeIcon = (type: string) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'success': return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'warning': return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'error': return <AlertCircle className={`${iconClass} text-red-500`} />;
      default: return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getFilteredNotifications = () => {
    if (!notifications) return [];
    switch (filter) {
      case 'unread': return notifications.filter(n => !n.isRead);
      case 'read': return notifications.filter(n => n.isRead);
      default: return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="min-h-screen dark-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b dark-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-8 h-8 text-primary" />
                {unreadCount && unreadCount.count > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount.count}
                  </Badge>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold dark-text">Notifications</h1>
                <p className="text-muted-foreground text-sm">Stay updated with your activities</p>
              </div>
            </div>
            
            {unreadCount && unreadCount.count > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 pb-24">
        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 dark-card dark-border">
            <TabsTrigger value="all" className="gap-2">
              <Filter className="w-4 h-4" />
              All ({notifications?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              <Bell className="w-4 h-4" />
              Unread ({unreadCount?.count || 0})
            </TabsTrigger>
            <TabsTrigger value="read" className="gap-2">
              <Check className="w-4 h-4" />
              Read ({(notifications?.length || 0) - (unreadCount?.count || 0)})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="dark-card dark-border animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-full"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={cn(
                      "dark-card dark-border transition-all duration-200 hover:shadow-lg",
                      !notification.isRead ? "ring-2 ring-primary/20 bg-primary/5" : ""
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={cn(
                          "p-3 rounded-full flex-shrink-0",
                          notification.type === 'success' && "bg-green-500/10",
                          notification.type === 'warning' && "bg-yellow-500/10",
                          notification.type === 'error' && "bg-red-500/10",
                          notification.type === 'info' && "bg-blue-500/10"
                        )}>
                          {getTypeIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-semibold dark-text text-lg leading-tight">
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant={getTypeBadgeVariant(notification.type)} className="text-xs">
                                {notification.type}
                              </Badge>
                              {!notification.isRead && (
                                <Badge variant="default" className="text-xs bg-primary">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-muted-foreground mb-4 leading-relaxed whitespace-pre-line break-words overflow-wrap-anywhere">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {formatDate(new Date(notification.createdAt))}
                            </div>

                            {!notification.isRead && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                disabled={markAsReadMutation.isPending}
                                className="gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="dark-card dark-border">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                    <Bell className="w-10 h-10 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-xl font-semibold dark-text mb-2">
                    {filter === 'unread' ? 'No unread notifications' : 
                     filter === 'read' ? 'No read notifications' : 'No notifications yet'}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {filter === 'unread' 
                      ? "You're all caught up! Check back later for new updates."
                      : filter === 'read'
                      ? "You haven't read any notifications yet."
                      : "We'll notify you when there's something important to share."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}
