/**
 * Home Page - Start test and quick stats
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useErrorStore } from '@/store/errorStore';
import { Button, Card } from '@/components/common';
import { getGradeBookForGrade, getGradeBookLabel } from '@/types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const config = useAppStore((state) => state.config);
  const { loadErrorLog, getTotalErrorCount, getUnmasteredCount } = useErrorStore();

  const totalErrors = getTotalErrorCount();
  const unmasteredErrors = getUnmasteredCount();
  const fallbackGradeBook = getGradeBookForGrade(config.gradeLevel || 5);
  const activeGradeBook = config.gradeBook ?? fallbackGradeBook;
  const gradeLabel = getGradeBookLabel(activeGradeBook);

  // Load error log on mount
  useEffect(() => {
    loadErrorLog();
  }, [loadErrorLog]);

  const handleStartTest = () => {
    navigate('/test');
  };

  const isConfigured = config.apiKey && config.apiKey.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-cyan-400 mb-4">
            English AI Agent
          </h1>
          <p className="text-xl text-slate-300">
            Your intelligent companion for vocabulary mastery
          </p>
        </div>

        {/* Configuration warning */}
        {!isConfigured && (
          <Card className="bg-yellow-900/20 border-yellow-700">
            <div className="flex items-start gap-4">
              <svg
                className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-yellow-400 mb-2">
                  Setup Required
                </h3>
                <p className="text-slate-300 mb-4">
                  Please configure your LLM API key in settings before starting a test.
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/settings')}
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Start test card */}
        <Card className="text-center py-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-cyan-500/20 text-cyan-400 mb-4">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-200 mb-2">
              Ready to Practice?
            </h2>
            <p className="text-slate-400">
              Test your vocabulary with all words up to {gradeLabel}
            </p>
          </div>

          <Button
            onClick={handleStartTest}
            disabled={!isConfigured}
            variant="primary"
            size="lg"
            className="px-12"
          >
            Start Test
          </Button>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card hoverable onClick={() => navigate('/error-log')}>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400 mb-2">
                {totalErrors}
              </div>
              <div className="text-sm text-slate-400">Total Error Words</div>
            </div>
          </Card>

          <Card hoverable onClick={() => navigate('/error-log')}>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {unmasteredErrors}
              </div>
              <div className="text-sm text-slate-400">To Practice</div>
            </div>
          </Card>

          <Card hoverable onClick={() => navigate('/settings')}>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">
                {gradeLabel}
              </div>
              <div className="text-sm text-slate-400">Current Grade</div>
            </div>
          </Card>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-slate-200 mb-1">Voice Input</h3>
                <p className="text-sm text-slate-400">
                  Speak your answers in Chinese using speech recognition
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-slate-200 mb-1">AI Judgment</h3>
                <p className="text-sm text-slate-400">
                  Get instant feedback from advanced language models
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-slate-200 mb-1">Smart Tracking</h3>
                <p className="text-sm text-slate-400">
                  Automatically tracks errors and prioritizes practice
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-slate-200 mb-1">VST Review</h3>
                <p className="text-sm text-slate-400">
                  Visual-Sound-Text learning cards for better retention
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
