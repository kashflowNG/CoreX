import { useAuth } from "@/hooks/use-auth";
import { NotificationsPanel } from "@/components/notifications-panel";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useLocation } from "wouter";

export default function Notifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation('/login');
    return null;
  }

  return (
    <div className="min-h-screen dark-bg">
      <div className="max-w-sm mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold dark-text mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your Bitcoin activities</p>
        </div>

        <NotificationsPanel />
      </div>

      <BottomNavigation />
    </div>
  );
}