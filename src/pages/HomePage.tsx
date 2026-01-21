/**
 * Home Page - Main Diagnosis Interface
 * This is a placeholder that will be implemented in Phase 2
 */

const HomePage = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="card-cyber text-center animate-slide-up">
        <h2 className="text-3xl mb-4">Welcome to English AI Agent</h2>
        <p className="text-cyber-secondary mb-6">
          Your intelligent companion for vocabulary mastery
        </p>

        <div className="bg-cyber-bg rounded-lg p-8 mb-6">
          <div className="text-6xl mb-4 animate-pulse-glow">🎯</div>
          <p className="text-lg text-cyber-primary">
            Diagnosis Engine Coming Soon
          </p>
        </div>

        <button className="btn-cyber">
          Start Diagnosis
        </button>

        <div className="mt-8 text-sm text-cyber-secondary">
          <p>Phase 2: Core Diagnosis Engine will be implemented next</p>
          <p className="mt-2">Features: 5-word test, Speech input, LLM judgment</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
