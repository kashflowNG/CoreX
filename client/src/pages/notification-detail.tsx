import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Bell, CheckCheck, Calendar, Info, TrendingUp, AlertTriangle, Bitcoin } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useEffect } from "react";

export default function NotificationDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams();
  const notificationId = parseInt(params.id || "0");

  const { data: notification, isLoading } = useQuery<Notification | undefined>({
    queryKey: ['/api/notifications', notificationId],
    queryFn: () => fetch(`/api/notifications/${user?.id}`).then(res => res.json()).then((notifications: Notification[]) => 
      notifications.find(n => n.id === notificationId)
    ),
    enabled: !!user?.id && !!notificationId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCheck className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-bitcoin" />;
    }
  };

  const getTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'info':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!user) {
    return <div>Please log in to view notifications.</div>;
  }

  if (isLoading) {
    return (
      <div className="max-w-sm mx-auto bg-background min-h-screen">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="max-w-sm mx-auto bg-background min-h-screen">
        <header className="px-4 py-6 border-b dark-border">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation('/notifications')}
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Notification Not Found</h1>
          </div>
        </header>
        <div className="p-4">
          <p className="text-muted-foreground">The notification you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Mark as read when viewing if it's unread
  useEffect(() => {
    if (!notification.isRead) {
      markAsReadMutation.mutate();
    }
  }, [notification, markAsReadMutation]);

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="px-4 py-6 border-b dark-border sticky top-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/notifications')}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Notification</h1>
            <p className="text-xs text-muted-foreground">
              {format(new Date(notification.createdAt), 'MMM d, yyyy • h:mm a')}
            </p>
          </div>
          {getTypeIcon(notification.type)}
        </div>
      </header>

      {/* Content */}
      <div className="p-4 pb-20 space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge variant={getTypeBadgeVariant(notification.type)} className="capitalize">
            {notification.type}
          </Badge>
          {!notification.isRead && (
            <Badge variant="secondary" className="text-xs">
              New
            </Badge>
          )}
        </div>

        {/* Title */}
        <Card className="dark-card dark-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              {getTypeIcon(notification.type)}
              {notification.title}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Message Content */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
              <Info className="w-4 h-4" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                {notification.message}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Received</span>
              <span className="text-sm font-medium text-foreground">
                {format(new Date(notification.createdAt), 'MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Time</span>
              <span className="text-sm font-medium text-foreground">
                {format(new Date(notification.createdAt), 'h:mm a')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm font-medium text-foreground capitalize">
                {notification.isRead ? 'Read' : 'Unread'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="text-sm font-medium text-foreground capitalize">
                {notification.type}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => setLocation('/notifications')}
            variant="outline" 
            className="w-full"
          >
            Back to Notifications
          </Button>

          {notification.type === 'success' && notification.message.includes('investment') && (
            <Button 
              onClick={() => setLocation('/investment')}
              className="w-full bg-bitcoin hover:bg-bitcoin/90 text-black font-semibold"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Investments
            </Button>
          )}

          {notification.message.includes('wallet') && (
            <Button 
              onClick={() => setLocation('/deposit')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Bitcoin className="w-4 h-4 mr-2" />
              Go to Wallet
            </Button>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}