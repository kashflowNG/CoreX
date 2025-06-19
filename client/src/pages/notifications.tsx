import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/bottom-navigation";
import { formatDate } from "@/lib/utils";
import { Bell, ArrowLeft, Check, Trash2, AlertCircle, TrendingUp, Bitcoin, Shield, Star } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import type { Notification } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: () => fetch(`/api/notifications/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "Notification has been deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const getNotificationIcon = (title: string) => {
    if (title.includes("Investment")) return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (title.includes("Bitcoin")) return <Bitcoin className="w-5 h-5 text-bitcoin" />;
    if (title.includes("Security")) return <Shield className="w-5 h-5 text-red-400" />;
    if (title.includes("Welcome")) return <Star className="w-5 h-5 text-blue-400" />;
    return <Bell className="w-5 h-5 text-gray-400" />;
  };

  const getNotificationColor = (title: string) => {
    if (title.includes("Investment")) return "border-green-500/20 bg-green-500/5";
    if (title.includes("Bitcoin")) return "border-bitcoin/20 bg-bitcoin/5";
    if (title.includes("Security")) return "border-red-500/20 bg-red-500/5";
    if (title.includes("Welcome")) return "border-blue-500/20 bg-blue-500/5";
    return "border-gray-500/20 bg-gray-500/5";
  };

  if (!user) {
    return <div>Please log in to view notifications</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Notifications</h1>
              <p className="text-sm text-gray-300">Stay updated with your account</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6 pb-24">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-gray-900/50 border border-gray-700/50">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2 bg-gray-700" />
                  <Skeleton className="h-3 w-1/2 mb-2 bg-gray-700" />
                  <Skeleton className="h-3 w-1/4 bg-gray-700" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`${getNotificationColor(notification.title)} backdrop-blur-sm border ${
                  !notification.isRead ? 'ring-1 ring-bitcoin/20' : ''
                } transition-all duration-300 hover:shadow-lg`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.title)}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-white text-base mb-1">
                          {notification.title}
                        </CardTitle>
                        {!notification.isRead && (
                          <Badge className="bg-bitcoin/20 text-bitcoin border-bitcoin/30 text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          className="text-gray-400 hover:text-white h-8 w-8 p-0"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                        className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-gray-300 text-sm leading-relaxed">
                      {/* Filter out address information from message */}
                      {notification.message
                        .replace(/Address: [a-zA-Z0-9]+/g, '')
                        .replace(/Wallet Address: [a-zA-Z0-9]+/g, '')
                        .replace(/From address: [a-zA-Z0-9]+/g, '')
                        .replace(/To address: [a-zA-Z0-9]+/g, '')
                        .replace(/\s+/g, ' ')
                        .trim()
                      }
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        {formatDate(new Date(notification.createdAt))}
                      </span>
                      {notification.isRead && (
                        <Badge variant="outline" className="border-gray-600 text-gray-400">
                          Read
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Notifications</h3>
              <p className="text-gray-400 mb-6">
                You're all caught up! New notifications will appear here.
              </p>
              <Link href="/">
                <Button className="bg-bitcoin hover:bg-bitcoin/90 text-white">
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}