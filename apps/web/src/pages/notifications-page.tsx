import { Bell, Check, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { ContentError, ContentLoader } from "../components/content-state";
import { WorkspaceShell } from "../components/workspace-shell";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/use-notifications";
import type { Notification } from "../types/notification";

const notificationTarget = (notification: Notification) => {
  if (notification.taskId) return { path: `/tasks/${notification.taskId}`, label: "View task" };
  if (notification.projectId) {
    return { path: `/projects/${notification.projectId}`, label: "View project" };
  }
  return null;
};

export const NotificationsPage = () => {
  const notificationsQuery = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <WorkspaceShell>
      {() => (
        <>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-600">Inbox</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Notifications</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Project invitations and updates about work relevant to you.
              </p>
            </div>
            {notificationsQuery.data && notificationsQuery.data.unreadCount > 0 ? (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60"
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <CheckCheck aria-hidden="true" size={18} />
                {markAllRead.isPending ? "Marking..." : "Mark all as read"}
              </button>
            ) : null}
          </header>

          <div className="mt-7">
            {notificationsQuery.isPending ? <ContentLoader /> : null}
            {notificationsQuery.isError ? (
              <ContentError onRetry={() => void notificationsQuery.refetch()} />
            ) : null}

            {notificationsQuery.data?.notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <Bell className="mx-auto text-slate-400" aria-hidden="true" size={30} />
                <h2 className="mt-4 font-bold text-slate-900">No notifications yet</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Project invitations and task updates will appear here.
                </p>
              </div>
            ) : null}

            {notificationsQuery.data && notificationsQuery.data.notifications.length > 0 ? (
              <section aria-labelledby="notification-list-heading">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800" id="notification-list-heading">
                    Recent notifications
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">
                    {notificationsQuery.data.unreadCount} unread
                  </span>
                </div>
                <ul className="space-y-3">
                  {notificationsQuery.data.notifications.map((notification) => {
                    const target = notificationTarget(notification);
                    const isMarking =
                      markRead.isPending && markRead.variables === notification.id;

                    return (
                      <li key={notification.id}>
                        <article
                          className={`rounded-2xl border bg-white p-5 shadow-sm ${
                            notification.isRead ? "border-slate-200" : "border-brand-200"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <span
                              className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl ${
                                notification.isRead
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-brand-50 text-brand-700"
                              }`}
                            >
                              {notification.isRead ? (
                                <Check aria-hidden="true" size={18} />
                              ) : (
                                <Bell aria-hidden="true" size={18} />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="font-bold text-slate-900">{notification.title}</h3>
                                <span className="text-xs font-semibold text-slate-500">
                                  {new Intl.DateTimeFormat(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  }).format(new Date(notification.createdAt))}
                                </span>
                              </div>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {notification.message}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                <span className="text-xs font-bold text-slate-500">
                                  {notification.isRead ? "Read" : "Unread"}
                                </span>
                                {target ? (
                                  <Link
                                    className="text-sm font-semibold text-brand-600 hover:text-brand-700 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                                    to={target.path}
                                    onClick={() => {
                                      if (!notification.isRead) markRead.mutate(notification.id);
                                    }}
                                  >
                                    {target.label}
                                  </Link>
                                ) : null}
                                {!notification.isRead ? (
                                  <button
                                    className="text-sm font-semibold text-slate-600 hover:text-slate-900 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60"
                                    type="button"
                                    onClick={() => markRead.mutate(notification.id)}
                                    disabled={isMarking}
                                  >
                                    {isMarking ? "Marking..." : "Mark as read"}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {markRead.isError || markAllRead.isError ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                We could not update notification status. Please try again.
              </p>
            ) : null}
          </div>
        </>
      )}
    </WorkspaceShell>
  );
};
