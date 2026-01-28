import "./Welcome.css";

function Welcome() {
  return (
    <div className="welcome">
      <div className="welcome-icon">
        <img src="/assets/icons/icon128.png" alt="MarkMind" width={64} height={64} />
      </div>
      <h1 className="welcome-title">Welcome to MarkMind</h1>
      <p className="welcome-subtitle">
        Transform your chaotic bookmarks into organized bliss with AI
      </p>
      <p className="welcome-description">
        Before you start organizing, please set up your API key to connect with
        an AI provider.
      </p>
      <button className="welcome-btn">Get Started</button>
    </div>
  );
}

export default Welcome;
