import Button from '../components/Button/Button';
import './Welcome.css';

const Welcome = () => {
  const handleGetStarted = () => {
    // TODO: Navigate to API key setup or main app
    console.log('Get Started clicked');
  };

  return (
    <div className="welcome">
      <div className="welcome-icon">
        <img src="/assets/icons/icon128.png" alt="MarkMind" />
      </div>
      <h1 className="welcome-title">Welcome to MarkMind</h1>
      <p className="welcome-subtitle">
        Transform your chaotic bookmarks into organized bliss with AI
      </p>
      <p className="welcome-description">
        Before you start organizing, please set up your API key to connect with
        an AI provider.
      </p>
      <Button onClick={handleGetStarted}>
        Get Started
      </Button>
    </div>
  );
};

export default Welcome;
