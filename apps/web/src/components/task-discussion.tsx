import { MessageSquare, Pencil, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useCreateComment, useDeleteComment, useTaskComments, useUpdateComment } from "../hooks/use-collaboration";
import { userInitials } from "../lib/task-display";
import type { Comment } from "../types/collaboration";

export const TaskDiscussion = ({ taskId, projectId, currentUserId }: { taskId: string; projectId: string; currentUserId: string }) => {
  const commentsQuery = useTaskComments(taskId);
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const [content, setContent] = useState("");
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedContent = content.trim();
    if (!normalizedContent) return;
    createComment.mutate({ taskId, projectId, content: normalizedContent }, {
      onSuccess: () => setContent(""),
    });
  };

  const beginEditing = (comment: Comment) => {
    setEditingComment(comment);
    setEditingContent(comment.content);
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingComment || !editingContent.trim()) return;
    updateComment.mutate({
      commentId: editingComment.id,
      taskId,
      projectId,
      content: editingContent.trim(),
    }, { onSuccess: () => setEditingComment(null) });
  };

  const handleDelete = (comment: Comment) => {
    if (!window.confirm("Delete this comment?")) return;
    deleteComment.mutate({ commentId: comment.id, taskId, projectId });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="discussion-heading">
      <div className="flex items-center gap-2"><MessageSquare className="text-slate-400" aria-hidden="true" size={19} /><h2 className="font-bold text-slate-950" id="discussion-heading">Discussion</h2></div>

      <form className="mt-5" onSubmit={handleCreate}>
        <label className="text-sm font-semibold text-slate-700" htmlFor="new-comment">Add a comment</label>
        <textarea className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="new-comment" value={content} onChange={(event) => setContent(event.target.value)} maxLength={5000} placeholder="Share an update or ask a question." required />
        {createComment.isError ? <p className="mt-2 text-sm text-red-700" role="alert">{createComment.error.message}</p> : null}
        <button className="mt-3 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60" type="submit" disabled={createComment.isPending || !content.trim()}>{createComment.isPending ? "Posting..." : "Post comment"}</button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-5">
        {commentsQuery.isPending ? <p className="text-sm text-slate-500" role="status">Loading comments...</p> : null}
        {commentsQuery.isError ? <p className="text-sm text-red-700" role="alert">Could not load comments. <button className="font-bold underline" type="button" onClick={() => void commentsQuery.refetch()}>Try again</button></p> : null}
        {commentsQuery.isSuccess && commentsQuery.data.length === 0 ? <p className="text-sm text-slate-500">No comments yet. Start the discussion.</p> : null}
        {commentsQuery.data?.length ? (
          <ul className="space-y-5" aria-label="Task comments">
            {commentsQuery.data.map((comment) => (
              <li className="flex gap-3" key={comment.id}>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600" aria-hidden="true">{userInitials(comment.user.name)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><span className="text-sm font-bold text-slate-900">{comment.user.name}</span><time className="ml-2 text-xs text-slate-400" dateTime={comment.createdAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(comment.createdAt))}</time></div>
                    {comment.userId === currentUserId ? (
                      <div className="flex gap-1">
                        <button className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-brand-600" type="button" aria-label={`Edit comment by ${comment.user.name}`} onClick={() => beginEditing(comment)}><Pencil aria-hidden="true" size={14} /></button>
                        <button className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-600" type="button" aria-label={`Delete comment by ${comment.user.name}`} onClick={() => handleDelete(comment)} disabled={deleteComment.isPending}><Trash2 aria-hidden="true" size={14} /></button>
                      </div>
                    ) : null}
                  </div>
                  {editingComment?.id === comment.id ? (
                    <form className="mt-2" onSubmit={handleUpdate}>
                      <label className="sr-only" htmlFor={`edit-comment-${comment.id}`}>Edit comment</label>
                      <textarea className="min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id={`edit-comment-${comment.id}`} value={editingContent} onChange={(event) => setEditingContent(event.target.value)} maxLength={5000} required />
                      {updateComment.isError ? <p className="mt-2 text-sm text-red-700" role="alert">{updateComment.error.message}</p> : null}
                      <div className="mt-2 flex gap-2"><button className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60" type="submit" disabled={updateComment.isPending || !editingContent.trim()}>Save</button><button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600" type="button" onClick={() => setEditingComment(null)}>Cancel</button></div>
                    </form>
                  ) : <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{comment.content}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {deleteComment.isError ? <p className="mt-3 text-sm text-red-700" role="alert">{deleteComment.error.message}</p> : null}
      </div>
    </section>
  );
};
