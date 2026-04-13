// About.js - About page with game info, features, and citations (UPDATED: 24 levels, 7 cars, NO badges)
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

        {/* Game Features - UPDATED */}
        <section className="about-section">
          <h2>🎮 Game Features</h2>
          <ul>
            <li>
              🏁 24 Progressive Levels - From easy pangrams to classic
              literature excerpts
            </li>
            <li>🏎️ Real-time Multiplayer Racing - Race against 2-4 players</li>
            <li>🚗 Car Collection - Unlock 7 unique cars every 3 levels</li>
            <li>
              🏆 Weekly Special Cars - Earn golden, silver, and bronze cars as
              weekly rewards
            </li>
            <li>
              👑 Weekly Leaderboard - Compete for top positions and exclusive
              rewards
            </li>
            <li>👥 Friend System - Add friends, chat, and race together</li>
            <li>
              🌤️ Dynamic Weather - Day/night cycles with dynamic environmental
              effects
            </li>
            <li>
              ⚡ Boost System - Type with &gt;95% accuracy and &gt;40 WPM to
              activate speed boost
            </li>
          </ul>
        </section>

        {/* Car Unlock System - NEW SECTION */}
        <section className="about-section">
          <h2>🚗 Car Unlock System</h2>
          <ul>
            <li>🚗 ROOKIE - Unlock at Level 3</li>
            <li>🏎️ SPRINTER - Unlock at Level 6</li>
            <li>🏁 RACER - Unlock at Level 9</li>
            <li>⚡ PRODIGY - Unlock at Level 12</li>
            <li>💫 ELITE - Unlock at Level 15</li>
            <li>👑 MASTER - Unlock at Level 18</li>
            <li>🌟 LEGEND - Unlock at Level 24</li>
          </ul>
          <p>
            Plus special weekly reward cars for top 3 players on the
            leaderboard!
          </p>
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
            Activate boost mode by maintaining high speed and accuracy.
          </p>
        </section>

        {/* Level Difficulty Progression - UPDATED */}
        <section className="about-section">
          <h2>📈 Level Progression</h2>
          <ul>
            <li>📖 Levels 1-4: Pangrams & Proverbs (Beginner)</li>
            <li>🔍 Levels 5-8: Interesting Facts (Easy)</li>
            <li>🔬 Levels 9-12: Science Facts (Easy-Medium)</li>
            <li>🏛️ Levels 13-16: History & Nature (Medium)</li>
            <li>⚛️ Levels 17-20: Scientific Explanations (Hard)</li>
            <li>📚 Levels 21-24: Classic Literature Excerpts (Expert)</li>
          </ul>
        </section>

        {/* Literature Citations - UPDATED for levels 21-24 */}
        <section className="about-section">
          <h2>📚 Literary Credits</h2>
          <p>Levels 21-24 feature excerpts from classic literature:</p>
          <ul>
            <li>
              George Orwell - <em>Nineteen Eighty-Four</em> (1949) - Level 21
            </li>
            <li>
              Ray Bradbury - <em>Fahrenheit 451</em> (1953) - Level 22
            </li>
            <li>
              J.R.R. Tolkien - <em>The Hobbit</em> (1937) - Level 23
            </li>
            <li>
              J.M. Barrie - <em>Peter Pan</em> (1911) - Level 24
            </li>
          </ul>
        </section>

        {/* Image Credits */}
        <section className="about-section">
          <h2>🖼️ Image Credits</h2>
          <p>
            Vehicle graphics sourced from public domain libraries including
            Openclipart, ClipSafari, and PublicDomainVectors.org. We appreciate
            the contributors who make free resources available to everyone.
          </p>
        </section>

        {/* Built With - UPDATED (removed Socket.IO) */}
        <section className="about-section">
          <h2>⚙️ Built With</h2>
          <p>GearUp Typing is built using modern web technologies:</p>
          <ul>
            <li>⚛️ React 19 - Frontend framework</li>
            <li>🔥 Firebase - Authentication & Realtime Database</li>
            <li>🎨 CSS3 - Animations and responsive design</li>
            <li>⚡ Vite - Fast build tool and development server</li>
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
