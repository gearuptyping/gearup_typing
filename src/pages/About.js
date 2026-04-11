// About.js - About page with game info, features, and citations
import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      <h1>ABOUT GEARUP TYPING</h1>

      <div className="about-content">
        {/* Game Description */}
        <section className="about-section">
          <h2>🏁 What is GearUp Typing?</h2>
          <p>
            GearUp Typing is a competitive multiplayer typing game that combines
            the thrill of racing with the skill of typing. Race against friends,
            improve your speed, and become a typing champion!
          </p>
        </section>

        {/* Game Features */}
        <section className="about-section">
          <h2>🎮 Game Features</h2>
          <ul>
            <li>
              🏁 50 Progressive Levels - From easy pangrams to classic
              literature
            </li>
            <li>🏎️ Real-time Multiplayer Racing - Race against 2-4 players</li>
            <li>🎖️ Badge System - Earn 10 unique badges as you level up</li>
            <li>🚗 Car Collection - Unlock new cars every 5 levels</li>
            <li>
              👑 Weekly Leaderboard - Compete for special golden/silver/bronze
              cars
            </li>
            <li>👥 Friend System - Add friends, chat, and race together</li>
            <li>
              🌤️ Dynamic Weather - Day/night cycles with rain and fog effects
            </li>
          </ul>
        </section>

        {/* How to Play */}
        <section className="about-section">
          <h2>⌨️ How It Works</h2>
          <p>
            Type the displayed paragraph as fast and accurately as possible.
            Your WPM (Words Per Minute) and accuracy determine your progress.
            Complete levels with over 80% accuracy to unlock the next challenge!
          </p>
          <p>
            In multiplayer mode, race against other players in real-time. The
            faster and more accurately you type, the faster your car moves!
          </p>
        </section>

        {/* Literature Citations */}
        <section className="about-section">
          <h2>📚 Literary Credits</h2>
          <p>Levels 46-50 feature excerpts from classic literature:</p>
          <ul>
            <li>
              George Orwell - <em>Nineteen Eighty-Four</em> (1949)
            </li>
            <li>
              William Gibson - <em>Neuromancer</em> (1984)
            </li>
            <li>
              Ray Bradbury - <em>Fahrenheit 451</em> (1953)
            </li>
            <li>
              J.R.R. Tolkien - <em>The Hobbit</em> (1937)
            </li>
            <li>
              J.M. Barrie - <em>Peter Pan</em> (1911)
            </li>
          </ul>
        </section>

        {/* Image Credits - Safe CC0 Attribution */}
        <section className="about-section">
          <h2>🖼️ Image Credits</h2>
          <p>
            Vehicle graphics sourced from public domain libraries including
            Openclipart, ClipSafari, and PublicDomainVectors.org. We appreciate
            the contributors who make free resources available to everyone.
          </p>
        </section>

        {/* Built With */}
        <section className="about-section">
          <h2>⚙️ Built With</h2>
          <p>GearUp Typing is built using modern web technologies:</p>
          <ul>
            <li>⚛️ React 19 - Frontend framework</li>
            <li>🔥 Firebase - Authentication & Realtime Database</li>
            <li>💬 Socket.IO - Real-time multiplayer communication</li>
            <li>🎨 CSS3 - Animations and responsive design</li>
          </ul>
        </section>

        {/* Creator */}
        <section className="about-section">
          <h2>👨‍💻 Created By</h2>
          <p>
            GearUp Typing was created by passionate developers and racing
            enthusiasts who believe learning should be fun and competitive. Race
            your way to typing mastery!
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
