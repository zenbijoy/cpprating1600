import React, { useState, useEffect } from 'react';
import { Navbar, TabId } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CurriculumView } from './components/CurriculumView';
import { ProblemArenaView } from './components/ProblemArenaView';
import { ContestsView } from './components/ContestsView';
import { AICoachView } from './components/AICoachView';
import { ProgressView } from './components/ProgressView';
import { MistakeNotebookView } from './components/MistakeNotebookView';
import { SettingsView } from './components/SettingsView';
import { OnboardingModal } from './components/OnboardingModal';
import { ProblemWorkspaceModal } from './components/ProblemWorkspaceModal';
import { AntiProcrastinationModal } from './components/AntiProcrastinationModal';
import { storageService, defaultGoal, defaultProfile } from './services/storage';
import { CFProblem, DailyPlan, DailyTask, MistakeRecord, ProblemAttempt, UserGoal, UserProfile } from './types';
import { generateDailyPlan, getTopicForDay } from './utils/roadmap';

export default function App() {
  // Check URL query parameters (e.g. ?autostart=1 to skip onboarding for verification)
  const urlParams = new URLSearchParams(window.location.search);
  const autostart = urlParams.get('autostart') === '1';

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [profile, setProfile] = useState<UserProfile>(() => storageService.getProfile());
  const [goal, setGoal] = useState<UserGoal>(() => storageService.getGoal());
  const [attempts, setAttempts] = useState<ProblemAttempt[]>(() => storageService.getAttempts());
  const [mistakes, setMistakes] = useState<MistakeRecord[]>(() => storageService.getMistakes());

  // Active Daily Plan
  const [dailyPlan, setDailyPlan] = useState<DailyPlan>(() => {
    const plans = storageService.getDailyPlans();
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = plans.find((p) => p.date === todayStr);
    if (existing) return existing;
    const newPlan = generateDailyPlan(storageService.getGoal().currentDay, 'standard', storageService.getGoal().dailyMinutes);
    storageService.saveDailyPlan(newPlan);
    return newPlan;
  });

  // Modals state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (autostart) return false;
    return !storageService.getProfile().onboardingCompleted;
  });

  const [activeProblem, setActiveProblem] = useState<CFProblem | null>(null);
  const [showAntiProcrastination, setShowAntiProcrastination] = useState<boolean>(false);
  const [curriculumSelectedTopicId, setCurriculumSelectedTopicId] = useState<string | undefined>(undefined);

  // Sync state to storage
  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
    storageService.saveProfile(updated);
  };

  const handleUpdateGoal = (updated: UserGoal) => {
    setGoal(updated);
    storageService.saveGoal(updated);
  };

  const handleUpdateDailyPlan = (updated: DailyPlan) => {
    setDailyPlan(updated);
    storageService.saveDailyPlan(updated);
  };

  const handleAttemptLogged = (attempt: ProblemAttempt) => {
    setAttempts(storageService.getAttempts());
  };

  const handleSaveMistake = (mistake: MistakeRecord) => {
    storageService.saveMistake(mistake);
    setMistakes(storageService.getMistakes());
  };

  const handleDeleteMistake = (id: string) => {
    storageService.deleteMistake(id);
    setMistakes(storageService.getMistakes());
  };

  const handleResetAllData = () => {
    storageService.resetAll();
    setProfile(defaultProfile);
    setGoal(defaultGoal);
    setAttempts([]);
    setMistakes([]);
    setShowOnboarding(true);
    setActiveTab('dashboard');
  };

  // Start today's mission directly from navbar or button
  const handleStartTodayMission = () => {
    const currentTopic = getTopicForDay(goal.currentDay);
    const prob = currentTopic.recommendedProblems[0];
    if (prob) {
      setActiveProblem(prob);
    } else {
      setActiveTab('learn');
    }
  };

  const handleStartRecoveryTask = (task: DailyTask, durationMinutes: number) => {
    const updatedPlan: DailyPlan = {
      ...dailyPlan,
      mode: 'minimum',
      targetMinutes: durationMinutes,
      tasks: [task, ...dailyPlan.tasks],
    };
    handleUpdateDailyPlan(updatedPlan);
  };

  const handleOpenCurriculumTopic = (topicId: string) => {
    setCurriculumSelectedTopicId(topicId);
    setActiveTab('learn');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        goal={goal}
        onOpenAntiProcrastination={() => setShowAntiProcrastination(true)}
        onStartTodayMission={handleStartTodayMission}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            goal={goal}
            profile={profile}
            dailyPlan={dailyPlan}
            onUpdateDailyPlan={handleUpdateDailyPlan}
            onSelectProblem={(prob) => setActiveProblem(prob)}
            onOpenAntiProcrastination={() => setShowAntiProcrastination(true)}
            onOpenCurriculumTopic={handleOpenCurriculumTopic}
            recentAttempts={attempts}
          />
        )}

        {activeTab === 'learn' && (
          <CurriculumView
            currentDay={goal.currentDay}
            onSelectProblem={(prob) => setActiveProblem(prob)}
            selectedTopicId={curriculumSelectedTopicId}
          />
        )}

        {activeTab === 'problems' && (
          <ProblemArenaView
            onSelectProblem={(prob) => setActiveProblem(prob)}
            attempts={attempts}
            currentRating={profile.verifiedCfRating}
          />
        )}

        {activeTab === 'contests' && (
          <ContestsView
            onSelectProblem={(prob) => setActiveProblem(prob)}
          />
        )}

        {activeTab === 'coach' && (
          <AICoachView
            goal={goal}
            profile={profile}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            goal={goal}
            profile={profile}
            attempts={attempts}
            mistakes={mistakes}
          />
        )}

        {activeTab === 'mistakes' && (
          <MistakeNotebookView
            mistakes={mistakes}
            onSaveMistake={handleSaveMistake}
            onDeleteMistake={handleDeleteMistake}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            goal={goal}
            profile={profile}
            onUpdateGoal={handleUpdateGoal}
            onUpdateProfile={handleUpdateProfile}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <OnboardingModal
          initialGoal={goal}
          initialProfile={profile}
          onComplete={(newGoal, newProfile) => {
            handleUpdateGoal(newGoal);
            handleUpdateProfile(newProfile);
            setShowOnboarding(false);
          }}
          onSkip={() => {
            handleUpdateProfile({ ...profile, onboardingCompleted: true });
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Problem Solving Workspace Modal */}
      {activeProblem && (
        <ProblemWorkspaceModal
          problem={activeProblem}
          onClose={() => setActiveProblem(null)}
          onAttemptLogged={handleAttemptLogged}
          preferredLanguage={profile.preferredLanguage}
        />
      )}

      {/* Anti-Procrastination Modal */}
      {showAntiProcrastination && (
        <AntiProcrastinationModal
          onClose={() => setShowAntiProcrastination(false)}
          currentTopicTitle={getTopicForDay(goal.currentDay).title}
          onStartTask={handleStartRecoveryTask}
        />
      )}
    </div>
  );
}
