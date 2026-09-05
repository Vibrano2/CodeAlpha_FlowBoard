export interface ProjectTaskEvent {
  projectId: string;
  taskId: string;
}

export interface ProjectCommentEvent extends ProjectTaskEvent {
  commentId: string;
}

export type RealtimeDomainEvent =
  | ({ type: "task:created" | "task:updated" | "task:deleted" } & ProjectTaskEvent)
  | ({ type: "comment:created" | "comment:updated" | "comment:deleted" } & ProjectCommentEvent)
  | { type: "notification:changed"; userIds: string[] }
  | { type: "project:members-changed"; projectId: string }
  | { type: "project:access-revoked"; projectId: string; userId: string };

type RealtimeSubscriber = (event: RealtimeDomainEvent) => void;

const subscribers = new Set<RealtimeSubscriber>();

export const publishRealtimeEvent = (event: RealtimeDomainEvent) => {
  for (const subscriber of subscribers) {
    try {
      subscriber(event);
    } catch (error) {
      console.error("FlowBoard could not publish a real-time event.", error);
    }
  }
};

export const subscribeToRealtimeEvents = (subscriber: RealtimeSubscriber) => {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
};
