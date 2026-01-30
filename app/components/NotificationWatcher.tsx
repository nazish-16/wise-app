"use client";

import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { DashboardContext, detectThresholdCrossings } from "@/lib/insights/engine";
import { Notification as WiseNotification, NotificationPref } from "@/app/lib/types";

export function NotificationWatcher({
  context,
  preferences,
  onNewNotification,
}: {
  context: DashboardContext;
  preferences: NotificationPref;
  onNewNotification: (n: WiseNotification) => void;
}) {
  const prevStateRef = useRef<DashboardContext | null>(null);
  const lastAlertTimeRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!prevStateRef.current) {
      prevStateRef.current = context;
      return;
    }

    // Run threshold check
    const crossings = detectThresholdCrossings(prevStateRef.current, context);
    
    crossings.forEach(event => {
      const now = Date.now();
      const lastTime = lastAlertTimeRef.current[event.title] || 0;
      
      // Debounce: 6 hours = 21,600,000 ms
      if (now - lastTime > 6 * 60 * 60 * 1000) {
        // Trigger notification
        const notif: WiseNotification = {
          id: crypto.randomUUID(),
          type: event.type as any,
          title: event.title,
          message: event.message,
          createdAt: new Date().toISOString(),
          read: false
        };

        onNewNotification(notif);
        lastAlertTimeRef.current[event.title] = now;

        // Browser notification if permitted
        if (preferences.browserNotifications && Notification.permission === "granted") {
          new window.Notification(event.title, { body: event.message });
        } else {
          toast(event.message, { icon: event.type === 'warning' ? '⚠️' : '🔔' });
        }
      }
    });

    prevStateRef.current = context;
  }, [context, preferences, onNewNotification]);

  // Request permission on mount if enabled in settings but not yet granted
  useEffect(() => {
    if (preferences.browserNotifications && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [preferences.browserNotifications]);

  return null; // Silent background component
}
