/**
 * Mastered Page - Showcase mastered words with quick actions
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useErrorStore } from '@/store/errorStore';
import { Button, Card } from '@/components/common';
import { VSTCard } from '@/components/review';
import { formatRelativeTime } from '@/utils/formatters';
import { useI18n } from '@/i18n';

const MasteredPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
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
      // Handle chinese as either string array or string
      const chineseText = Array.isArray(entry.word.chinese)
        ? entry.word.chinese.join(' ')
        : (entry.word.chinese || entry.word.zh || '');
      return word.includes(keyword) || chineseText.toLowerCase().includes(keyword);
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
    <div className="min-h-screen bg-bg-primary px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-success mb-2">{t('mastered.title')}</h1>
            <p className="text-text-muted">{t('mastered.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleBack}>
              {t('mastered.backToLog')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-success mb-2">
                {totalMastered}
              </div>
              <div className="text-sm text-text-muted">{t('mastered.statsMastered')}</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">
                {averageErrors}
              </div>
              <div className="text-sm text-text-muted">{t('mastered.statsAvgErrors')}</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-lg font-medium text-text-secondary">
                {latestErrorDate > 0 ? formatRelativeTime(latestErrorDate) : '?'}
              </div>
              <div className="text-sm text-text-muted">{t('mastered.statsLatestError')}</div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{t('mastered.searchTitle')}</h2>
              <p className="text-sm text-text-muted">{t('mastered.searchSubtitle')}</p>
            </div>
            <div className="relative w-full md:w-72">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('mastered.searchPlaceholder')}
                className="w-full rounded-lg bg-bg-tertiary border border-border-primary px-4 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-success/60"
              />
            </div>
          </div>
        </Card>

        {/* Mastered list */}
        {filteredEntries.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-text-secondary text-lg">{t('mastered.emptyTitle')}</div>
            <p className="text-text-muted mt-2">
              {t('mastered.emptySubtitle')}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.word.id} className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-accent/5" />
                <div className="relative space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-2xl font-bold text-word-english">
                        {entry.word.word}
                      </div>
                      <div className="text-sm text-word-phonetic font-mono">
                        {entry.word.phonetic}
                      </div>
                      <div className="text-word-chinese mt-1">
                        {entry.word.chinese}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success-muted text-success text-xs font-medium">
                      {t('mastered.badgeMastered')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-error/70" />
                      {t('mastered.errorsCount', { count: entry.errorCount })}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent/70" />
                      {formatRelativeTime(entry.lastErrorDate)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedWordId(entry.word.id)}
                    >
                      {t('mastered.viewCard')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(entry.word.id)}
                    >
                      {t('mastered.restore')}
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
