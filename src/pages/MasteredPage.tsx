/**
 * Mastered Page - Showcase mastered words with quick actions
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useErrorStore } from '@/store/errorStore';
import { Button, Card } from '@/components/common';
import { VSTCard } from '@/components/review';
import { formatRelativeTime } from '@/utils/formatters';

const MasteredPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    loadErrorLog,
    errorLog,
    markAsUnmastered,
  } = useErrorStore();

  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadErrorLog();
  }, [loadErrorLog]);

  const masteredEntries = useMemo(
    () => Object.values(errorLog.entries).filter((entry) => entry.mastered),
    [errorLog.entries],
  );

  const sortedEntries = useMemo(
    () => [...masteredEntries].sort((a, b) => b.lastErrorDate - a.lastErrorDate),
    [masteredEntries],
  );

  const filteredEntries = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return sortedEntries;
    return sortedEntries.filter((entry) => {
      const word = entry.word.word.toLowerCase();
      const chinese = entry.word.chinese.toLowerCase();
      return word.includes(keyword) || chinese.includes(keyword);
    });
  }, [query, sortedEntries]);

  const selectedError = selectedWordId
    ? errorLog.entries[selectedWordId]
    : null;

  const totalMastered = masteredEntries.length;
  const totalErrors = masteredEntries.reduce((sum, entry) => sum + entry.errorCount, 0);
  const averageErrors = totalMastered > 0 ? (totalErrors / totalMastered).toFixed(1) : '0';
  const latestErrorDate = masteredEntries.reduce(
    (latest, entry) => Math.max(latest, entry.lastErrorDate),
    0,
  );

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/error-log');
  };

  const handleRestore = async (wordId: string) => {
    await markAsUnmastered(wordId);
    if (selectedWordId === wordId) {
      setSelectedWordId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-green-400 mb-2">Mastered Archive</h1>
            <p className="text-slate-400">
              Your mastered words, ready for quick review
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleBack}>
              返回错误日志
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">
                {totalMastered}
              </div>
              <div className="text-sm text-slate-400">Mastered Words</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">
                {averageErrors}
              </div>
              <div className="text-sm text-slate-400">Avg Errors</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-lg font-medium text-slate-300">
                {latestErrorDate > 0 ? formatRelativeTime(latestErrorDate) : 'No data'}
              </div>
              <div className="text-sm text-slate-400">Latest Error</div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Mastered Words</h2>
              <p className="text-sm text-slate-500">Search by English or Chinese</p>
            </div>
            <div className="relative w-full md:w-72">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search words..."
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/60"
              />
            </div>
          </div>
        </Card>

        {/* Mastered list */}
        {filteredEntries.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-slate-400 text-lg">No mastered words yet</div>
            <p className="text-slate-500 mt-2">
              Mark words as mastered to build your archive.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.word.id} className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-cyan-500/5" />
                <div className="relative space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-2xl font-bold text-slate-100">
                        {entry.word.word}
                      </div>
                      <div className="text-sm text-slate-400 font-mono">
                        {entry.word.phonetic}
                      </div>
                      <div className="text-green-400 mt-1">
                        {entry.word.chinese}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-900/40 text-green-300 text-xs font-medium">
                      Mastered
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400/70" />
                      {entry.errorCount} errors
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400/70" />
                      {formatRelativeTime(entry.lastErrorDate)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedWordId(entry.word.id)}
                    >
                      查看卡片
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(entry.word.id)}
                    >
                      重新练习
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedError && (
          <VSTCard
            errorEntry={selectedError}
            onMaster={() => {}}
            onClose={() => setSelectedWordId(null)}
          />
        )}
      </div>
    </div>
  );
};

export default MasteredPage;
