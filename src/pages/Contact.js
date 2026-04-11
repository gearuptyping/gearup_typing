// Contact.js - Contact page with support email and Discord community link
import React from "react";
import "./Contact.css";

const Contact = () => {
  return (
    <div className="contact-container">
      <h1>CONTACT US</h1>

      <div className="contact-content">
        <p>Have questions or suggestions? We'd love to hear from you!</p>

        <div className="contact-info">
          <p>📧 Email: gearuptypingofficial@gmail.com</p>
          <p>
            💬 Discord:{" "}
            <a
              href="https://discord.gg/BU8XRt6C8e"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join our Discord community
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
