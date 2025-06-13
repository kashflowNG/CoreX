
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Bell, CheckCheck, Filter, Search, Trash2, Bitcoin, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function Notifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'success' | 'error' | 'info'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', user?.id],
    enabled: !!user?.id,
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notifications/${user?.id}/mark-all-read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "All notifications marked as read",
        description: "Your notification center is now up to date.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', user?.id, 'unread-count'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', user?.id, 'unread-count'] });
    },
  });

  if (!user) {
    setLocation('/login');
    return null;
  }

  // Filter and search notifications
  const filteredNotifications = notifications?.filter(notification => {
    // Apply filter
    if (filter === 'unread' && notification.isRead) return false;
    if (filter !== 'all' && filter !== 'unread' && notification.type !== filter) return false;
    
    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return notification.title.toLowerCase().includes(searchLower) || 
             notification.message.toLowerCase().includes(searchLower);
    }
    
    return true;
  }) || [];

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-500/20 bg-green-500/5';
      case 'error':
        return 'border-red-500/20 bg-red-500/5';
      case 'warning':
        return 'border-orange-500/20 bg-orange-500/5';
      default:
        return 'border-blue-500/20 bg-blue-500/5';
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b dark-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation('/')}
                className="rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Bell className="w-5 h-5 text-bitcoin" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge className="bg-bitcoin text-black text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </h1>
                <p className="text-xs text-muted-foreground">Stay updated with your account</p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 pb-20 space-y-4">
        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'All', count: notifications?.length || 0 },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'success', label: 'Success', count: notifications?.filter(n => n.type === 'success').length || 0 },
              { key: 'error', label: 'Errors', count: notifications?.filter(n => n.type === 'error').length || 0 },
              { key: 'info', label: 'Info', count: notifications?.filter(n => n.type === 'info').length || 0 },
            ].map(({ key, label, count }) => (
              <Button
                key={key}
                variant={filter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(key as any)}
                className="whitespace-nowrap"
              >
                {label} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </Button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="dark-card dark-border animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 bg-muted rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`dark-card dark-border cursor-pointer transition-all hover:shadow-md ${
                  !notification.isRead ? 'ring-2 ring-bitcoin/20' : ''
                } ${getNotificationColor(notification.type)}`}
                onClick={() => {
                  if (!notification.isRead) {
                    markReadMutation.mutate(notification.id);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`font-semibold text-sm ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-bitcoin rounded-full"></div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                        {notification.message}
                      </p>
                      <Badge 
                        variant="outline" 
                        className="mt-2 text-xs capitalize"
                      >
                        {notification.type}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {filter === 'all' 
                ? 'When you start using CoreX, important updates and transaction notifications will appear here.'
                : `No notifications match the "${filter}" filter.`
              }
            </p>
          </div>
        )}

        {/* Summary Stats */}
        {notifications && notifications.length > 0 && (
          <Card className="dark-card dark-border">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-foreground text-sm">Notification Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{notifications.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unread</span>
                    <span className="font-medium text-bitcoin">{unreadCount}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Success</span>
                    <span className="font-medium text-green-400">
                      {notifications.filter(n => n.type === 'success').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Errors</span>
                    <span className="font-medium text-red-400">
                      {notifications.filter(n => n.type === 'error').length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
