import React, { useState, useRef } from 'react';
import {
  CloseIcon as X,
  CodeFileIcon as FileText,
  ProblemStatementIcon as BookOpen,
  AskAQuestionIcon as HelpCircle,
  TrophyIcon as Trophy,
  CodingBracketsIcon as Code2,
  LearningRoadmapIcon as Video,
  UploadIcon as Upload,
  ExternalLinkIcon as Link,
  CodingBracketsIcon as Code,
  ProblemTagsIcon as Tag,
  LoadingStatusIcon as Loader2,
  CheckCircleIcon as CheckCircle2,
} from '../icons';
import { Community } from '../../services/communityClient';
import { PostContentType, socialFeedClient } from '../../services/socialFeedClient';
import { r2StorageClient, UploadProgressEvent } from '../../services/r2StorageClient';
import { MarkdownRenderer } from './MarkdownRenderer';

export interface PostComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  communities: Community[];
  initialCommunitySlug?: string;
  initialContentType?: PostContentType;
  initialTitle?: string;
  initialContent?: string;
  initialCodeSnippet?: string;
  initialProblemUrl?: string;
  initialTags?: string[];
}

export const PostComposerModal: React.FC<PostComposerModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  communities,
  initialCommunitySlug,
  initialContentType = 'general',
  initialTitle,
  initialContent,
  initialCodeSnippet,
  initialProblemUrl,
  initialTags,
}) => {
  if (!isOpen) return null;

  const [contentType, setContentType] = useState<PostContentType>(initialContentType);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(() => {
    if (initialCommunitySlug) {
      const comm = communities.find((c) => c.slug === initialCommunitySlug);
      if (comm) return comm.id;
    }
    return '';
  });

  const [title, setTitle] = useState(initialTitle || '');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState(initialContent || '');
  const [problemUrl, setProblemUrl] = useState(initialProblemUrl || '');
  const [codeSnippet, setCodeSnippet] = useState(initialCodeSnippet || '');
  const [programmingLanguage, setProgrammingLanguage] = useState('cpp20');
  const [milestoneCategory, setMilestoneCategory] = useState('Codeforces Rating');
  const [milestoneMetric, setMilestoneMetric] = useState('Reached 1600 (Expert)');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialTags && initialTags.length > 0 ? initialTags : ['algorithms']);
  const [showCode, setShowCode] = useState(!!initialCodeSnippet);
  const [previewMode, setPreviewMode] = useState(false);

  // File attachments and R2 upload states
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(0);
    setErrorMsg(null);

    try {
      const result = await r2StorageClient.uploadFile(
        file,
        'posts',
        (prog: UploadProgressEvent) => {
          setUploadProgress(prog.percent);
        }
      );

      setAttachments((prev) => [
        ...prev,
        {
          fileType: result.fileType,
          fileName: result.fileName,
          fileSize: result.fileSize,
          mimeType: result.mimeType,
          r2Key: result.fileKey,
          url: result.publicUrl,
        },
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || 'File upload failed. Check your network or file size.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await socialFeedClient.createPost({
        communityId: selectedCommunityId || null,
        contentType,
        title: title.trim() || null,
        subtitle: subtitle.trim() || null,
        content: content.trim(),
        problemUrl: problemUrl.trim() || null,
        codeSnippet: codeSnippet.trim() || null,
        programmingLanguage: showCode ? programmingLanguage : null,
        milestoneCategory: contentType === 'milestone' ? milestoneCategory : null,
        milestoneMetric: contentType === 'milestone' ? milestoneMetric : null,
        tags,
        attachments,
      });

      onPostCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contentTypes: Array<{ type: PostContentType; label: string; icon: React.ReactNode }> = [
    { type: 'general', label: 'Post', icon: <FileText className="w-3.5 h-3.5" /> },
    { type: 'question', label: 'Question', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { type: 'help_request', label: 'Help Request', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { type: 'blog', label: 'Blog / Article', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { type: 'milestone', label: 'Milestone', icon: <Trophy className="w-3.5 h-3.5" /> },
    { type: 'solution', label: 'Solution', icon: <Code2 className="w-3.5 h-3.5" /> },
    { type: 'video', label: 'Video', icon: <Video className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Create Content & Discussion
            </h2>
            <p className="text-xs text-slate-500">
              Publish insights, ask for debugging help, or celebrate milestones with fellow programmers.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Type Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Content Type
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {contentTypes.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setContentType(t.type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    contentType === t.type
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Community Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Target Community
              </label>
              <select
                value={selectedCommunityId}
                onChange={(e) => setSelectedCommunityId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Global Public Feed (No specific community)</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.is_system ? '★' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Problem URL (for questions, solutions, help requests) */}
            {(contentType === 'question' ||
              contentType === 'help_request' ||
              contentType === 'solution' ||
              contentType === 'general') && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Link className="w-3 h-3 text-indigo-500" />
                  <span>Problem URL (Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://codeforces.com/contest/..."
                  value={problemUrl}
                  onChange={(e) => setProblemUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Title (Mandatory for blogs, questions, help requests) */}
          {(contentType === 'blog' ||
            contentType === 'question' ||
            contentType === 'help_request' ||
            contentType === 'milestone' ||
            contentType === 'solution') && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Title
              </label>
              <input
                type="text"
                placeholder={
                  contentType === 'blog'
                    ? 'Captivating article title...'
                    : contentType === 'question' || contentType === 'help_request'
                    ? 'Specific question (e.g. Why does my Dijkstra implementation TLE on test 14?)'
                    : 'Milestone or Solution headline'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required={contentType === 'blog' || contentType === 'question'}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Milestone Fields */}
          {contentType === 'milestone' && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Category
                </label>
                <input
                  type="text"
                  value={milestoneCategory}
                  onChange={(e) => setMilestoneCategory(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Metric / Result
                </label>
                <input
                  type="text"
                  value={milestoneMetric}
                  onChange={(e) => setMilestoneMetric(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* Markdown Content & Preview Toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Content (Markdown Supported)
              </label>
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {previewMode ? 'Edit Raw' : 'Live Preview'}
              </button>
            </div>

            {previewMode ? (
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 min-h-[140px] max-h-60 overflow-y-auto">
                <MarkdownRenderer content={content || '*Nothing written yet...*'} />
              </div>
            ) : (
              <textarea
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts, explain the algorithmic approach, or detail where you are stuck..."
                required
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none font-mono"
              />
            )}
          </div>

          {/* Code Snippet Box */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{showCode ? 'Remove Code Block' : '+ Attach Code Snippet'}</span>
            </button>

            {showCode && (
              <div className="space-y-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">Language:</span>
                  <select
                    value={programmingLanguage}
                    onChange={(e) => setProgrammingLanguage(e.target.value)}
                    className="p-1 px-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200"
                  >
                    <option value="cpp20">C++ (GCC 20)</option>
                    <option value="python">Python 3</option>
                    <option value="java">Java 17</option>
                  </select>
                </div>
                <textarea
                  rows={5}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="// Paste complete or partial solution code..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Cloudflare R2 File Uploads */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Media & Attachments (Cloudflare R2)</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,video/*,application/pdf,text/*"
                className="hidden"
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>Uploading {uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image / Video / PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* Upload progress bar */}
            {isUploading && (
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Attachments preview list */}
            {attachments.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate max-w-[140px]">{att.fileName}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>Tags (Press Enter or Comma to Add)</span>
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-600 dark:text-indigo-400"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="p-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 w-28"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Publish Post</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
