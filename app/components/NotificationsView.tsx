"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MdDelete, MdCheckCircle } from "react-icons/md";
import { Notification } from "@/app/lib/types";
import { toast } from "react-hot-toast";

export function NotificationsView({
  notifications,
  onDeleteNotif,
  onMarkRead,
  border,
  cardBg,
  shellBg,
  fg,
  muted,
}: {
  notifications: Notification[];
  onDeleteNotif: (id: string) => void;
  onMarkRead: (id: string) => void;
  border: string;
  cardBg: string;
  shellBg: string;
  fg: string;
  muted: string;
}) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className={`text-xl font-semibold ${fg}`}>Notifications {unread > 0 && `(${unread})`}</h2>
        <p className={`text-sm ${muted} mt-1`}>Your alerts and insights.</p>
      </div>

      <div className={`rounded-xl border ${border} ${cardBg} p-4 space-y-2`}>
        {notifications.length === 0 ? (
          <div className={`rounded-lg border ${border} ${shellBg} p-6 text-center`}>
            <p className={`text-sm ${muted}`}>All caught up! No new notifications.</p>
          </div>
        ) : (
          notifications.slice(0, 20).map((notif) => (
            <motion.div key={notif.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-start gap-3 rounded-lg border ${border} ${notif.read ? shellBg : "bg-indigo-500/5"} p-3`}>
              <div className="flex-1">
                <p className={`text-sm font-medium ${fg}`}>{notif.title}</p>
                <p className={`text-xs ${muted} mt-1`}>{notif.message}</p>
              </div>
              <div className="flex gap-1">
                {!notif.read && (
                  <button onClick={() => onMarkRead(notif.id)} title="Mark as read" className={`p-2 rounded hover:bg-[rgb(var(--muted))]`}>
                    <MdCheckCircle size={16} />
                  </button>
                )}
                <button onClick={() => { onDeleteNotif(notif.id); toast.success("Deleted"); }} title="Delete" className={`p-2 rounded hover:bg-red-500/10`}>
                  <MdDelete size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
