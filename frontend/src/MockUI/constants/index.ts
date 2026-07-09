import { LayoutDashboard, UploadCloud, Eye, Activity, CheckCircle2, History, Settings } from 'lucide-react';

export const ROUTES = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/import', label: 'CSV Import', icon: UploadCloud },
  { path: '/preview', label: 'Preview', icon: Eye },
  { path: '/processing', label: 'Processing', icon: Activity },
  { path: '/results', label: 'Results', icon: CheckCircle2 },
  { path: '/history', label: 'History', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const CRM_FIELDS = [
  'First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Job Title', 'Lead Source', 'Status'
];

export const ALLOWED_STATUSES = ['New', 'Contacted', 'Qualified', 'Lost'];
export const ALLOWED_SOURCES = ['Organic Search', 'Paid Social', 'Referral', 'Direct', 'Event'];
