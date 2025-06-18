import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Calendar, Hash, DollarSign, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, Copy } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function TransactionDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const params = useParams();
  const transactionId = parseInt(params.id || "0");

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    queryFn: () => fetch(`/api/transactions/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  const transaction = transactions?.find(t => t.id === transactionId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-500';
      case 'withdrawal':
        return 'text-red-500';
      case 'investment':
        return 'text-bitcoin';
      default:
        return 'text-muted-foreground';
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to your clipboard.`,
    });
  };

  if (!user) {
    return <div>Please log in to view transaction details.</div>;
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

  if (!transaction) {
    return (
      <div className="max-w-sm mx-auto bg-background min-h-screen">
        <header className="px-4 py-6 border-b dark-border">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation('/history')}
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Transaction Not Found</h1>
          </div>
        </header>
        <div className="p-4">
          <p className="text-muted-foreground">The transaction you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="px-4 py-6 border-b dark-border sticky top-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/history')}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Transaction Details</h1>
            <p className="text-xs text-muted-foreground capitalize">
              {transaction.type} • {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          {getStatusIcon(transaction.status)}
        </div>
      </header>

      {/* Content */}
      <div className="p-4 pb-20 space-y-6">
        {/* Status and Amount */}
        <Card className="dark-card dark-border">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Badge variant={getStatusBadgeVariant(transaction.status)} className="capitalize">
                  {transaction.status}
                </Badge>
              </div>
              
              <div>
                <div className={`text-3xl font-bold ${getTypeColor(transaction.type)}`}>
                  {transaction.type === 'withdrawal' ? '-' : '+'}{transaction.amount} BTC
                </div>
                <div className="text-sm text-muted-foreground capitalize mt-1">
                  {transaction.type}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Information */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Transaction Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Transaction ID</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground font-mono">
                    #{transaction.id}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(transaction.id.toString(), "Transaction ID")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-medium text-foreground">
                  {transaction.amount} BTC
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className={`text-sm font-medium capitalize ${getTypeColor(transaction.type)}`}>
                  {transaction.type}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(transaction.status)}
                  <span className="text-sm font-medium text-foreground capitalize">
                    {transaction.status}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        {transaction.address && (
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-start gap-2">
                <span className="text-sm text-muted-foreground">
                  {transaction.type === 'deposit' ? 'From Address' : 'To Address'}
                </span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-sm font-medium text-foreground font-mono text-right break-all">
                    {transaction.address}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={() => copyToClipboard(transaction.address!, "Address")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction Hash */}
        {transaction.transactionHash && (
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Blockchain Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-start gap-2">
                <span className="text-sm text-muted-foreground">Transaction Hash</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-sm font-medium text-foreground font-mono text-right break-all">
                    {transaction.transactionHash}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={() => copyToClipboard(transaction.transactionHash!, "Transaction Hash")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm font-medium text-foreground">
                {format(new Date(transaction.createdAt), 'MMM d, yyyy • h:mm a')}
              </span>
            </div>
            
            {transaction.confirmedAt && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {transaction.status === 'confirmed' ? 'Confirmed' : 'Processed'}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {format(new Date(transaction.confirmedAt), 'MMM d, yyyy • h:mm a')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {transaction.notes && (
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {transaction.notes}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => setLocation('/history')}
            variant="outline" 
            className="w-full"
          >
            Back to History
          </Button>
          
          {transaction.type === 'investment' && (
            <Button 
              onClick={() => setLocation('/investment')}
              className="w-full bg-bitcoin hover:bg-bitcoin/90 text-black font-semibold"
            >
              View Investments
            </Button>
          )}
          
          {(transaction.type === 'deposit' || transaction.type === 'withdrawal') && (
            <Button 
              onClick={() => setLocation('/transactions')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              View All Transactions
            </Button>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}