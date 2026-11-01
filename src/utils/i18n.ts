import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocalizationPreferences } from '../types/settings';

export type LanguageCode = 'en' | 'bn';

export const SUPPORTED_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka (GMT+6)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (GMT+5:30)' },
  { value: 'Europe/London', label: 'Europe/London (GMT+0 / BST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'America/New_York', label: 'America/New York (Eastern Time)' },
  { value: 'America/Chicago', label: 'America/Chicago (Central Time)' },
  { value: 'America/Denver', label: 'America/Denver (Mountain Time)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (Pacific Time)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST GMT+9)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT GMT+8)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST GMT+10)' },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Top-level Navigation & Headings
    'settings.title': 'Settings',
    'settings.description': 'Personalize your CLIMB 1600 experience, appearance, study habits, and integrations.',
    'settings.search_placeholder': 'Search all settings...',
    'settings.no_results': 'No settings found matching your search.',
    'settings.save_changes': 'Save Changes',
    'settings.saving': 'Saving...',
    'settings.saved': 'Preferences Saved!',
    'settings.reset_section': 'Reset Section to Defaults',
    'settings.reset_all': 'Reset All Settings',
    'settings.unsaved_warning': 'You have unsaved changes in this section.',

    // Section Names
    'nav.appearance': 'Appearance & Theme',
    'nav.profile': 'Profile & Information',
    'nav.account': 'Account & Authentication',
    'nav.privacy': 'Privacy & Security',
    'nav.localization': 'Language & Region',
    'nav.accessibility': 'Accessibility & Behavior',
    'nav.cp': 'Competitive Programming',
    'nav.codeforces': 'Codeforces Integration',
    'nav.guardian': 'Guardian & Focus',
    'nav.data': 'Data & Storage',
    'nav.notifications': 'Notifications',
    'nav.app': 'Application Preferences',

    // Appearance
    'appearance.mode': 'Appearance Mode',
    'appearance.mode_desc': 'Choose light, dark, multicolor, orange, purple, or automatically sync with your system theme preference.',
    'appearance.mode_light': 'Light Mode',
    'appearance.mode_dark': 'Dark Mode',
    'appearance.mode_multicolor': 'Multicolor Mode',
    'appearance.mode_orange': 'Orange Mode',
    'appearance.mode_purple': 'Purple Mode',
    'appearance.mode_system': 'System Default',
    'appearance.presets': 'Theme Presets',
    'appearance.presets_desc': 'Cohesive handcrafted color palettes tailored for competitive programmers.',
    'appearance.custom_accent': 'Custom Accent Color',
    'appearance.custom_secondary': 'Custom Highlight Color',
    'appearance.density': 'Interface Density',
    'appearance.density_compact': 'Compact',
    'appearance.density_comfortable': 'Comfortable',
    'appearance.density_spacious': 'Spacious',
    'appearance.radius': 'Border Radius',
    'appearance.radius_compact': 'Sharp (6px)',
    'appearance.radius_standard': 'Standard (12px)',
    'appearance.radius_rounded': 'Rounded (18px)',
    'appearance.font_family': 'Font Family & Typography',
    'appearance.font_family_desc': 'Choose the stylish aesthetic typeface for your whole app interface',
    'appearance.font_size': 'Content Font Scale',
    'appearance.font_size_small': 'Small (15px Base - Compact)',
    'appearance.font_size_standard': 'Standard (17px Base - Comfortable)',
    'appearance.font_size_large': 'Large (19px Base - Clear & Spacious)',
    'appearance.font_size_xlarge': 'Extra Large (21px Base - Maximum Legibility)',
    'appearance.animation': 'Motion & Animation',
    'appearance.animation_full': 'Full Motion',
    'appearance.animation_reduced': 'Reduced Motion',
    'appearance.animation_off': 'Turn Off Animations',
    'appearance.transparency': 'Transparency & Blur Effects',
    'appearance.transparency_normal': 'Normal (Glassmorphism)',
    'appearance.transparency_reduced': 'Reduced (Opaque)',
    'appearance.preview_title': 'Theme Preview',
    'appearance.reset_theme': 'Restore Default CLIMB Theme',

    // Profile
    'profile.display_name': 'Display Name',
    'profile.bio': 'Bio / Problem Solving Philosophy',
    'profile.country': 'Country or Region',
    'profile.preferred_lang': 'Preferred Programming Language',
    'profile.experience': 'Experience Level',
    'profile.exp_beginner': 'Complete Beginner (<1000 rating)',
    'profile.exp_intermediate': 'Intermediate (1000–1400 rating)',
    'profile.exp_experienced': 'Experienced Coder (1400+ rating)',
    'profile.target_rating': 'Target Codeforces Rating',
    'profile.weekly_goal': 'Weekly Practice Goal (Hours)',
    'profile.preferred_topics': 'Preferred Topics & Algorithm Tags',
    'profile.status_verified': 'Verified Codeforces Competitor',
    'profile.status_guest': 'Local Guest Account',

    // Account
    'account.identity': 'Signed-In Account Identity',
    'account.email': 'Email Address',
    'account.status_verified': 'Email Verified',
    'account.status_unverified': 'Email Not Verified',
    'account.google_auth': 'Google Authentication',
    'account.active_session': 'Current Session',
    'account.sign_out': 'Sign Out from This Device',
    'account.sign_out_all': 'Sign Out from All Devices',
    'account.danger_zone': 'Danger Zone: Account Deletion',
    'account.delete_desc': 'Permanently delete your CLIMB 1600 cloud account, practice attempts, and synchronized mistake records. This cannot be undone.',
    'account.delete_btn': 'Delete CLIMB 1600 Account',

    // Privacy & Security
    'privacy.profile_visibility': 'Profile Visibility',
    'privacy.visibility_public': 'Public (Visible to community)',
    'privacy.visibility_private': 'Private (Only you)',
    'privacy.activity_status': 'Show Online Activity Status',
    'privacy.share_achievements': 'Share Milestones & Badges Publicly',
    'privacy.recommendations': 'Personalized AI Problem Recommendations',
    'privacy.telemetry': 'Anonymous Performance & Error Telemetry',

    // Language & Region
    'lang.interface': 'Interface Language',
    'lang.timezone': 'Timezone (IANA)',
    'lang.date_format': 'Date Format',
    'lang.time_format': 'Time Format',
    'lang.week_start': 'Week Starts On',
    'lang.monday': 'Monday',
    'lang.sunday': 'Sunday',
    'lang.saturday': 'Saturday',

    // Accessibility
    'a11y.high_contrast': 'High Contrast Mode',
    'a11y.reduced_motion': 'Reduce Interface Motion',
    'a11y.focus_rings': 'Enhanced Keyboard Focus Indicators',
    'a11y.screen_reader': 'Screen-Reader Optimized Labels',
    'a11y.tooltips': 'Show Contextual Help Tooltips',
    'a11y.confirm_destructive': 'Confirm Before Destructive Actions',

    // CP Preferences
    'cp.default_lang': 'Default Submission Language',
    'cp.rating_range': 'Default Problem Difficulty Range',
    'cp.daily_target': 'Daily Target Minutes',
    'cp.weekly_problems': 'Weekly Target Problems',
    'cp.intensity': 'Training Intensity',
    'cp.intensity_casual': 'Casual (20-30 min/day)',
    'cp.intensity_standard': 'Standard (45-60 min/day)',
    'cp.intensity_intensive': 'Intensive (90+ min/day)',
    'cp.editor_theme': 'Code Editor Theme',
    'cp.editor_font_size': 'Editor Font Size',
    'cp.editor_tab_size': 'Tab Size (Spaces)',
    'cp.editor_line_numbers': 'Show Line Numbers',
    'cp.editor_word_wrap': 'Enable Word Wrap',
    'cp.editor_font_family': 'Editor Font Family',
    'cp.template': 'Custom Code Template',

    // Codeforces
    'cf.title': 'Codeforces Account Synchronization',
    'cf.linked_handle': 'Linked Handle',
    'cf.not_linked': 'No Codeforces account linked',
    'cf.last_sync': 'Last Synchronized',
    'cf.sync_now': 'Synchronize Now',
    'cf.unlink': 'Unlink Account',
    'cf.verify_new': 'Link & Verify New Handle',

    // Guardian
    'guardian.title': 'Android Study Guardian Integration',
    'guardian.focus_duration': 'Focus Session Duration (Minutes)',
    'guardian.break_duration': 'Break Duration (Minutes)',
    'guardian.daily_goal': 'Daily Focus Time Goal (Minutes)',
    'guardian.breathing_delay': 'Impulse Breathing Delay (Seconds)',
    'guardian.strict_mode': 'Strict Blocking Mode (Prevent premature exit)',
    'guardian.permission_guide': 'Android Permission Health & Diagnostic Guide',

    // Data & Storage
    'data.title': 'Data Portability & Storage Management',
    'data.export_json': 'Export Backup (JSON)',
    'data.export_csv': 'Export Practice History (CSV)',
    'data.import_backup': 'Import & Restore Backup',
    'data.clear_cache': 'Clear Local Storage Cache',
    'data.storage_used': 'Estimated Local Storage Used',

    // Application Preferences
    'app.landing_page': 'Default Landing Page After Login',
    'app.remember_filters': 'Remember Last Selected Problem Filters',
    'app.auto_refresh': 'Auto-Refresh Live Contests & Benchmarks',
    'app.confirm_unsaved': 'Warn Before Leaving Unsaved Code Drafts',
    'app.shortcuts': 'Enable Global Keyboard Shortcuts (e.g. Cmd+K)',
    'app.onboarding_tips': 'Show Feature Tips & Guided Walkthroughs',
  },
  bn: {
    // Top-level Navigation & Headings
    'settings.title': 'সেটিংস',
    'settings.description': 'আপনার CLIMB 1600 অভিজ্ঞতা, থিম, পড়াশোনার রুটিন এবং ইন্টিগ্রেশন কাস্টমাইজ করুন।',
    'settings.search_placeholder': 'সব সেটিংস অনুসন্ধান করুন...',
    'settings.no_results': 'আপনার অনুসন্ধানের সাথে মিল রেখে কোনো সেটিংস পাওয়া যায়নি।',
    'settings.save_changes': 'পরিবর্তন সংরক্ষণ করুন',
    'settings.saving': 'সংরক্ষণ হচ্ছে...',
    'settings.saved': 'পছন্দসমূহ সংরক্ষিত হয়েছে!',
    'settings.reset_section': 'এই বিভাগটি ডিফল্টে ফেরত নিন',
    'settings.reset_all': 'সকল সেটিংস রিসেট করুন',
    'settings.unsaved_warning': 'আপনার কাছে অসংরক্ষিত পরিবর্তন রয়েছে।',

    // Section Names
    'nav.appearance': 'রূপ ও থিম (Appearance)',
    'nav.profile': 'প্রোফাইল ও তথ্য (Profile)',
    'nav.account': 'অ্যাকাউন্ট ও নিরাপত্তা (Account)',
    'nav.privacy': 'গোপনীয়তা (Privacy)',
    'nav.localization': 'ভাষা ও অঞ্চল (Language)',
    'nav.accessibility': 'সহজলভ্যতা ও আচরণ (Accessibility)',
    'nav.cp': 'কম্পিটিটিভ প্রোগ্রামিং (CP)',
    'nav.codeforces': 'কোডফোর্সেস ইন্টিগ্রেশন (Codeforces)',
    'nav.guardian': 'স্টাডি গার্ডিয়ান (Guardian)',
    'nav.data': 'ডাটা ও ব্যাকআপ (Data)',
    'nav.notifications': 'বিজ্ঞপ্তি (Notifications)',
    'nav.app': 'অ্যাপ্লিকেশন পছন্দসমূহ (App)',

    // Appearance
    'appearance.mode': 'ডিসপ্লে মোড',
    'appearance.mode_desc': 'লাইট, ডার্ক, মাল্টিকালার, অরেঞ্জ, পার্পল বা সিস্টেম মোড নির্বাচন করুন।',
    'appearance.mode_light': 'লাইট মোড (Light)',
    'appearance.mode_dark': 'ডার্ক মোড (Dark)',
    'appearance.mode_multicolor': 'মাল্টিকালার মোড (Multicolor)',
    'appearance.mode_orange': 'অরেঞ্জ মোড (Orange)',
    'appearance.mode_purple': 'পার্পল মোড (Purple)',
    'appearance.mode_system': 'সিস্টেম ডিফল্ট',
    'appearance.presets': 'থিম প্রিসেটসমূহ',
    'appearance.presets_desc': 'কম্পিটিটিভ প্রোগ্রামারদের জন্য বিশেষভাবে তৈরি কালার প্যালেট।',
    'appearance.custom_accent': 'কাস্টম প্রাইমারি অ্যাকসেন্ট কালার',
    'appearance.custom_secondary': 'কাস্টম সেকেন্ডারি হাইলাইট কালার',
    'appearance.density': 'ইন্টারফেসের ঘনত্ব (Density)',
    'appearance.density_compact': 'কমপ্যাক্ট (Compact)',
    'appearance.density_comfortable': 'স্বাচ্ছন্দ্যময় (Comfortable)',
    'appearance.density_spacious': 'প্রশস্ত (Spacious)',
    'appearance.radius': 'বর্ডার রেডিয়াস',
    'appearance.radius_compact': 'তীক্ষ্ণ (6px)',
    'appearance.radius_standard': 'স্ট্যান্ডার্ড (12px)',
    'appearance.radius_rounded': 'গোলাকার (18px)',
    'appearance.font_family': 'ফন্ট ফ্যামিলি ও টাইপোগ্রাফি',
    'appearance.font_family_desc': 'পুরো অ্যাপ ইন্টারফেসের জন্য পছন্দের স্টাইলিশ ফন্ট বেছে নিন',
    'appearance.font_size': 'কন্টেন্ট ফন্ট সাইজ স্কেল',
    'appearance.font_size_small': 'ছোট (15px বেস - কমপ্যাক্ট)',
    'appearance.font_size_standard': 'স্ট্যান্ডার্ড (17px বেস - স্বাচ্ছন্দ্যময়)',
    'appearance.font_size_large': 'বড় (19px বেস - স্পষ্ট ও বড়)',
    'appearance.font_size_xlarge': 'অতিরিক্ত বড় (21px বেস - সর্বাধিক পাঠযোগ্য)',
    'appearance.animation': 'অ্যানিমেশন তীব্রতা',
    'appearance.animation_full': 'সম্পূর্ণ অ্যানিমেশন',
    'appearance.animation_reduced': 'সীমিত অ্যানিমেশন',
    'appearance.animation_off': 'অ্যানিমেশন বন্ধ',
    'appearance.transparency': 'স্বচ্ছতা ও ব্লার ইফেক্ট',
    'appearance.transparency_normal': 'স্বাভাবিক (গ্লাস ইফেক্ট)',
    'appearance.transparency_reduced': 'অস্বচ্ছ (Opaque)',
    'appearance.preview_title': 'থিম প্রিভিউ',
    'appearance.reset_theme': 'ডিফল্ট CLIMB থিম পুনরুদ্ধার করুন',

    // Profile
    'profile.display_name': 'প্রদর্শনের নাম',
    'profile.bio': 'বায়ো / প্রোগ্রামিং দর্শন',
    'profile.country': 'দেশ বা অঞ্চল',
    'profile.preferred_lang': 'পছন্দের প্রোগ্রামিং ভাষা',
    'profile.experience': 'অভিজ্ঞতার স্তর',
    'profile.exp_beginner': 'একেবারে নতুন (<১০০০ রেটিং)',
    'profile.exp_intermediate': 'মধ্যবর্তী (১০০০–১৪০০ রেটিং)',
    'profile.exp_experienced': 'অভিজ্ঞ কোডার (১৪০০+ রেটিং)',
    'profile.target_rating': 'টার্গেট কোডফোর্সেস রেটিং',
    'profile.weekly_goal': 'সাপ্তাহিক অনুশীলনের লক্ষ্য (ঘণ্টা)',
    'profile.preferred_topics': 'পছন্দের বিষয় ও অ্যালগরিদম ট্যাগ',
    'profile.status_verified': 'যাচাইকৃত কোডফোর্সেস প্রতিযোগী',
    'profile.status_guest': 'স্থানীয় গেস্ট অ্যাকাউন্ট',

    // Account
    'account.identity': 'সাইন-ইন করা অ্যাকাউন্টের পরিচয়',
    'account.email': 'ইমেইল ঠিকানা',
    'account.status_verified': 'ইমেইল যাচাইকৃত',
    'account.status_unverified': 'ইমেইল যাচাই করা হয়নি',
    'account.google_auth': 'গুগল প্রমাণীকরণ (Google Auth)',
    'account.active_session': 'বর্তমান সেশন',
    'account.sign_out': 'এই ডিভাইস থেকে সাইন আউট করুন',
    'account.sign_out_all': 'সকল ডিভাইস থেকে সাইন আউট করুন',
    'account.danger_zone': 'বিপদজনক অঞ্চল: অ্যাকাউন্ট মুছে ফেলা',
    'account.delete_desc': 'স্থায়ীভাবে আপনার CLIMB 1600 ক্লাউড অ্যাকাউন্ট এবং অনুশীলনের ইতিহাস মুছে ফেলুন। এটি পুনরুদ্ধার করা সম্ভব নয়।',
    'account.delete_btn': 'CLIMB 1600 অ্যাকাউন্ট মুছে ফেলুন',

    // Privacy & Security
    'privacy.profile_visibility': 'প্রোফাইল দৃশ্যমানতা',
    'privacy.visibility_public': 'পাবলিক (সবার কাছে দৃশ্যমান)',
    'privacy.visibility_private': 'ব্যক্তিগত (শুধুমাত্র আপনার জন্য)',
    'privacy.activity_status': 'অনলাইন সক্রিয়তার স্ট্যাটাস দেখান',
    'privacy.share_achievements': 'অর্জিত ব্যাজসমূহ প্রকাশ্যে শেয়ার করুন',
    'privacy.recommendations': 'ব্যক্তিগতকৃত এআই প্রবলেম পরামর্শ',
    'privacy.telemetry': 'নামবিহীন পারফরম্যান্স এবং এরর রিপোর্ট',

    // Language & Region
    'lang.interface': 'ইন্টারফেস ভাষা',
    'lang.timezone': 'টাইমজোন (IANA)',
    'lang.date_format': 'তারিখের ফরম্যাট',
    'lang.time_format': 'সময়ের ফরম্যাট',
    'lang.week_start': 'সপ্তাহ শুরুর দিন',
    'lang.monday': 'সোমবার',
    'lang.sunday': 'রবিবার',
    'lang.saturday': 'শনিবার',

    // Accessibility
    'a11y.high_contrast': 'উচ্চ বৈসাদৃশ্য মোড (High Contrast)',
    'a11y.reduced_motion': 'ইন্টারফেসের গতি কমান (Reduced Motion)',
    'a11y.focus_rings': 'কীবোর্ড ফোকাস নির্দেশক স্পষ্টভাবে দেখান',
    'a11y.screen_reader': 'স্ক্রিন রিডার অপ্টিমাইজড লেবেল',
    'a11y.tooltips': 'সাহায্যকারী টুলটিপ দেখান',
    'a11y.confirm_destructive': 'গুরুত্বপূর্ণ কাজের পূর্বে নিশ্চিতকরণ বার্তা চান',

    // CP Preferences
    'cp.default_lang': 'ডিফল্ট সাবমিশন ভাষা',
    'cp.rating_range': 'ডিফল্ট প্রবলেম জটিলতার পরিধি',
    'cp.daily_target': 'দৈনিক লক্ষ্য (মিনিট)',
    'cp.weekly_problems': 'সাপ্তাহিক প্রবলেম সমাধানের লক্ষ্য',
    'cp.intensity': 'অনুশীলনের তীব্রতা',
    'cp.intensity_casual': 'সাধারণ (২০-৩০ মিনিট/দিন)',
    'cp.intensity_standard': 'স্ট্যান্ডার্ড (৪৫-৬০ মিনিট/দিন)',
    'cp.intensity_intensive': 'তীব্র (৯০+ মিনিট/দিন)',
    'cp.editor_theme': 'কোড এডিটর থিম',
    'cp.editor_font_size': 'এডিটর ফন্ট সাইজ',
    'cp.editor_tab_size': 'ট্যাব সাইজ (স্পেস)',
    'cp.editor_line_numbers': 'লাইন নম্বর দেখান',
    'cp.editor_word_wrap': 'ওয়ার্ড র‍্যাপ চালু করুন',
    'cp.editor_font_family': 'এডিটর ফন্ট ফ্যামিলি',
    'cp.template': 'কাস্টম কোড টেমপ্লেট',

    // Codeforces
    'cf.title': 'কোডফোর্সেস অ্যাকাউন্ট সিঙ্ক্রোনাইজেশন',
    'cf.linked_handle': 'সংযুক্ত হ্যান্ডেল',
    'cf.not_linked': 'কোনো অ্যাকাউন্ট যুক্ত নেই',
    'cf.last_sync': 'সর্বশেষ সিঙ্ক হয়েছে',
    'cf.sync_now': 'এখনই সিঙ্ক করুন',
    'cf.unlink': 'অ্যাকাউন্ট সংযোগ বিচ্ছিন্ন করুন',
    'cf.verify_new': 'নতুন হ্যান্ডেল যুক্ত ও যাচাই করুন',

    // Guardian
    'guardian.title': 'অ্যান্ড্রয়েড স্টাডি গার্ডিয়ান ইন্টিগ্রেশন',
    'guardian.focus_duration': 'ফোকাস সেশনের স্থায়িত্ব (মিনিট)',
    'guardian.break_duration': 'বিরতির সময় (মিনিট)',
    'guardian.daily_goal': 'দৈনিক ফোকাস সময় লক্ষ্য (মিনিট)',
    'guardian.breathing_delay': 'মনঃসংযোগ রক্ষার বিলম্ব (সেকেন্ড)',
    'guardian.strict_mode': 'কঠোর ব্লকিং মোড',
    'guardian.permission_guide': 'অ্যান্ড্রয়েড পারমিশন স্বাস্থ্য ও গাইড',

    // Data & Storage
    'data.title': 'ডাটা পোর্টাবিলিটি ও ব্যাকআপ',
    'data.export_json': 'ব্যাকআপ ডাউনলোড করুন (JSON)',
    'data.export_csv': 'অনুশীলন ডাটা এক্সপোর্ট করুন (CSV)',
    'data.import_backup': 'ব্যাকআপ পুনরুদ্ধার করুন',
    'data.clear_cache': 'লোকাল স্টোরেজ ক্যাশ মুছে ফেলুন',
    'data.storage_used': 'ব্যবহৃত লোকাল স্টোরেজ সাইজ',

    // Application Preferences
    'app.landing_page': 'লগইনের পর ডিফল্ট ল্যান্ডিং পেজ',
    'app.remember_filters': 'সর্বশেষ ফিল্টার মনে রাখুন',
    'app.auto_refresh': 'কনটেস্ট তথ্য স্বয়ংক্রিয়ভাবে রিফ্রেশ করুন',
    'app.confirm_unsaved': 'অসংরক্ষিত কোড ত্যাগের পূর্বে সতর্ক করুন',
    'app.shortcuts': 'কীবোর্ড শর্টকাট চালু রাখুন (যেমন Cmd+K)',
    'app.onboarding_tips': 'ফিচার পরিচিতি টিপস প্রদর্শন করুন',
  },
};

export function t(key: string, lang: LanguageCode = 'en'): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}

export function formatDate(
  dateInput: Date | string | number,
  format: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' = 'YYYY-MM-DD'
): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  switch (format) {
    case 'DD/MM/YYYY':
      return `${dd}/${mm}/${yyyy}`;
    case 'MM/DD/YYYY':
      return `${mm}/${dd}/${yyyy}`;
    case 'YYYY-MM-DD':
    default:
      return `${yyyy}-${mm}-${dd}`;
  }
}

export function formatTime(
  dateInput: Date | string | number,
  format: '12h' | '24h' = '12h',
  timezone?: string
): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: format === '12h',
    timeZone: timezone && timezone !== 'UTC' ? timezone : undefined,
  };

  try {
    return new Intl.DateTimeFormat('en-US', options).format(d);
  } catch {
    return new Intl.DateTimeFormat('en-US', { ...options, timeZone: undefined }).format(d);
  }
}

interface TranslationContextType {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

export const TranslationContext = createContext<TranslationContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => t(key, 'en'),
});

export const useTranslation = () => useContext(TranslationContext);
