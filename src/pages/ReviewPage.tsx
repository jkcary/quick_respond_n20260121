/**
 * Review Page - Error Log & VST Mode
 * This is a placeholder that will be implemented in Phase 3
 */

import { useAppStore } from '@/store/useAppStore';

const ReviewPage = () => {
  const errorLog = useAppStore((state) => state.errorLog);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card-cyber animate-slide-up">
        <h2 className="text-3xl mb-4">Review Error Log</h2>
        <p className="text-cyber-secondary mb-6">
          Master your mistakes with VST mode
        </p>

        {errorLog.length === 0 ? (
          <div className="bg-cyber-bg rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">✨</div>
            <p className="text-lg text-cyber-primary">
              No errors yet! Start a diagnosis session.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-cyber-secondary">
                Total errors: <span className="text-cyber-primary font-bold">{errorLog.length}</span>
              </span>
              <button className="btn-cyber-outline text-sm">
                Start VST Review
              </button>
            </div>

            {errorLog.map((error) => (
              <div
                key={error.wordId}
                className="bg-cyber-bg rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <span className="text-cyber-primary font-bold text-lg">
                    {error.word}
                  </span>
                  <span className="ml-4 text-sm text-cyber-secondary">
                    Errors: {error.errorCount}
                  </span>
                </div>
                {error.mastered && (
                  <span className="badge-cyber">Mastered</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-sm text-cyber-secondary text-center">
          <p>Phase 3: VST Mode will be implemented next</p>
          <p className="mt-2">Features: Visual, Sound, Text review modes</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
