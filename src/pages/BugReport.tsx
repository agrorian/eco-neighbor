import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bug, Camera, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

const SCREENS = [
  'Dashboard', 'Submit Action', 'Mod Queue', 'Wallet / Referrals',
  'Business Directory', 'Leaderboard', 'Maturation Bridge', 'Settings',
  'Admin Panel', 'Login / Signup', 'My History', 'Daily Log',
  'Community Impact', 'Other'
];

const SEVERITY = [
  { value: 'critical', label: '🔴 Critical — App broken / data lost' },
  { value: 'major',    label: '🟠 Major — Feature not working' },
  { value: 'minor',    label: '🟡 Minor — Small issue / cosmetic' },
  { value: 'suggestion', label: '💡 Suggestion — Improvement idea' },
];

export default function BugReport() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screen, setScreen] = useState('');
  const [severity, setSeverity] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dl86obm3b';
      const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'enb_photos';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);
      formData.append('folder', 'bug_reports');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      if (data.secure_url) setScreenshotUrl(data.secure_url);
      else throw new Error('Upload failed');
    } catch {
      setError('Screenshot upload failed. You can still submit without it.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !screen || !severity) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const browserInfo = `${navigator.userAgent.substring(0, 120)}`;
      const { error: dbError } = await supabase.from('bug_reports').insert({
        title: title.trim(),
        description: description.trim(),
        screen,
        severity,
        screenshot_url: screenshotUrl || null,
        email: user?.email || null,
        user_id: user?.id || null,
        browser_info: browserInfo,
        source: 'app',
        status: 'open',
      });
      if (dbError) throw dbError;
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 p-6">
        <div className="w-16 h-16 rounded-full bg-enb-green/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-enb-green" />
        </div>
        <h2 className="text-xl font-bold text-enb-text-primary">Report Submitted</h2>
        <p className="text-enb-text-secondary text-sm max-w-xs">
          Thank you. Your bug report has been logged and will be reviewed by the admin team.
        </p>
        <Button onClick={() => navigate('/more')} className="bg-enb-green text-white mt-2">
          Back to More
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/more')} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" /> Report a Bug
          </h1>
          <p className="text-xs text-enb-text-secondary">Help us improve the app</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-enb-text-primary">
            Bug Title <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="e.g. Photo not uploading on Android"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Screen */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-enb-text-primary">
            Where did this happen? <span className="text-red-500">*</span>
          </label>
          <Select onValueChange={setScreen}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select screen / page" />
            </SelectTrigger>
            <SelectContent>
              {SCREENS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Severity */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-enb-text-primary">
            Severity <span className="text-red-500">*</span>
          </label>
          <Select onValueChange={setSeverity}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="How serious is it?" />
            </SelectTrigger>
            <SelectContent>
              {SEVERITY.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-enb-text-primary">
            Description <span className="text-red-500">*</span>
          </label>
          <Textarea
            placeholder="Describe exactly what happened. What did you do? What did you expect? What actually happened?"
            className="h-32 resize-none"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <p className="text-xs text-gray-400">{description.length}/1000</p>
        </div>

        {/* Screenshot */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-enb-text-primary">
            Screenshot <span className="text-gray-400 font-normal text-xs">(Optional)</span>
          </label>
          {screenshotUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              <img src={screenshotUrl} alt="Screenshot" className="w-full max-h-48 object-cover" />
              <button
                onClick={() => setScreenshotUrl('')}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-2 left-2 bg-enb-green text-white text-xs px-2 py-0.5 rounded-full">
                ✓ Uploaded
              </div>
            </div>
          ) : (
            <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              {uploading
                ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                : <Camera className="w-5 h-5 text-gray-400" />
              }
              <span className="text-sm text-gray-500">
                {uploading ? 'Uploading...' : 'Attach a screenshot (tap to select)'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleScreenshot}
                disabled={uploading}
              />
            </label>
          )}
          <p className="text-xs text-gray-400">Gallery uploads allowed for screenshots</p>
        </div>

        {/* Logged in as */}
        {user?.email && (
          <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
            Submitting as <strong>{user.email}</strong> · Your user ID will be attached automatically.
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!title || !description || !screen || !severity || submitting || uploading}
          className="w-full h-12 bg-enb-green text-white hover:bg-enb-green/90"
        >
          {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : 'Submit Bug Report'}
        </Button>
      </div>
    </div>
  );
}
