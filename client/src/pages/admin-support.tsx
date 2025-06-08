
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/bottom-navigation";
import { MessageSquare, Send, User, Clock, CheckCircle, AlertCircle, MessageCircle, Reply, FileImage } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { SupportMessage } from "@shared/schema";

interface SupportMessageWithUser extends SupportMessage {
  userEmail: string;
}

export default function AdminSupport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<SupportMessageWithUser | null>(null);
  const [replyText, setReplyText] = useState("");

  // Fetch support messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin-support-messages"],
    queryFn: () => apiRequest("/api/admin/support/messages"),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Reply to support message
  const replyMutation = useMutation({
    mutationFn: async (data: { messageId: number; reply: string }) => {
      return apiRequest("/api/admin/support/reply", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent to the user.",
      });
      setReplyText("");
      setSelectedMessage(null);
      queryClient.invalidateQueries({ queryKey: ["admin-support-messages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    },
  });

  // Update message status
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { id: number; status: string }) => {
      return apiRequest(`/api/admin/support/status/${data.id}`, {
        method: "PATCH",
        body: { status: data.status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-messages"] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-500/10 text-red-600 border-red-200";
      case "in_progress": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "resolved": return "bg-green-500/10 text-green-600 border-green-200";
      default: return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  if (!user?.isAdmin) {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Support Dashboard</h1>
          <p className="text-muted-foreground">Manage user support requests and messages</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Messages List */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Support Messages ({messages?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto space-y-3">
                {isLoading ? (
                  <div className="text-center text-muted-foreground py-8">Loading messages...</div>
                ) : messages?.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    No support messages yet
                  </div>
                ) : (
                  messages?.map((message: SupportMessageWithUser) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedMessage?.id === message.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{message.userEmail}</span>
                        </div>
                        <Badge className={getStatusColor(message.status)}>
                          {message.status.replace("_", " ")}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-foreground mb-2 line-clamp-2">
                        {message.message}
                      </p>
                      
                      {message.images && message.images.length > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <FileImage className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {message.images.length} attachment(s)
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDate(message.createdAt)}
                      </div>
                      
                      {message.adminReply && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded border-l-2 border-green-500">
                          <p className="text-xs text-green-700 dark:text-green-300">
                            ✓ Replied: {message.adminReply.substring(0, 50)}...
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message Details & Reply */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Reply className="w-5 h-5" />
                {selectedMessage ? "Reply to Message" : "Select a Message"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {selectedMessage ? (
                <div className="flex-1 flex flex-col">
                  {/* Message Details */}
                  <div className="flex-1 bg-muted/30 rounded-lg p-4 mb-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{selectedMessage.userEmail}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(selectedMessage.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: selectedMessage.id, status: "in_progress" })}
                          disabled={selectedMessage.status === "in_progress"}
                        >
                          In Progress
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: selectedMessage.id, status: "resolved" })}
                          disabled={selectedMessage.status === "resolved"}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-background p-3 rounded border">
                      <p className="text-foreground whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>
                    
                    {selectedMessage.images && selectedMessage.images.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Attachments:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedMessage.images.map((image, index) => (
                            <div key={index} className="flex items-center gap-1 p-2 bg-background rounded border">
                              <FileImage className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">Image {index + 1}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedMessage.adminReply && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded border-l-4 border-green-500">
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">Your Previous Reply:</h4>
                        <p className="text-green-700 dark:text-green-300 whitespace-pre-wrap">{selectedMessage.adminReply}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          Sent: {selectedMessage.repliedAt ? formatDate(selectedMessage.repliedAt) : "Unknown"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Reply Form */}
                  <div className="space-y-3">
                    <Label htmlFor="reply">Your Reply</Label>
                    <Textarea
                      id="reply"
                      placeholder="Type your reply here..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="min-h-[100px] resize-none"
                    />
                    <Button
                      onClick={() => {
                        replyMutation.mutate({
                          messageId: selectedMessage.id,
                          reply: replyText,
                        });
                      }}
                      disabled={!replyText.trim() || replyMutation.isPending}
                      className="w-full"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {replyMutation.isPending ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a message from the list to view details and reply</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
