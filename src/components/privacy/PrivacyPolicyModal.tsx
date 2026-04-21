/**
 * Privacy Policy Modal Component
 * Phase 4 - Privacy Controls
 *
 * Displays comprehensive privacy policy information.
 * Follows SettingsModal patterns with standalone CSS.
 */

import React from 'react';
import { X, Shield, Database, Eye, Lock, Globe } from 'lucide-react';
import './PrivacyPolicyModal.css';

export interface PrivacyPolicyModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content privacy-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Privacy Policy"
      >
        <div className="modal-header">
          <div className="header-title">
            <Shield className="icon-accent" size={20} />
            <h2>Privacy Policy</h2>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body privacy-policy-content">
          {/* Introduction */}
          <section className="policy-section">
            <h3>Introduction</h3>
            <p>
              At App Builder Pro, we take your privacy seriously. This Privacy Policy explains how
              we collect, use, disclose, and safeguard your information when you use our
              application.
            </p>
          </section>

          {/* Data Collection */}
          <section className="policy-section">
            <div className="section-icon">
              <Database size={18} />
            </div>
            <h3>Information We Collect</h3>
            <h4>Personal Information</h4>
            <ul>
              <li>
                // TODO: Legal review needed - specify what personal data is collected Account
                information (email, name) when you sign up
              </li>
              <li>
                // TODO: Legal review needed - specify what personal data is collected Usage data
                and preferences
              </li>
              <li>
                // TODO: Legal review needed - specify what personal data is collected Project data
                you create with our builder
              </li>
            </ul>

            <h4>Automatically Collected Information</h4>
            <ul>
              <li>Device information (browser type, operating system)</li>
              <li>Usage analytics (pages visited, features used)</li>
              <li>
                // TODO: Legal review needed - clarify cookie usage Cookies and similar tracking
                technologies
              </li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section className="policy-section">
            <div className="section-icon">
              <Eye size={18} />
            </div>
            <h3>How We Use Your Information</h3>
            <ul>
              <li>To provide and maintain our services</li>
              <li>To improve and develop new features</li>
              <li>
                // TODO: Legal review needed - specify communication purposes To communicate with
                you about updates and support
              </li>
              <li>To analyze usage patterns and optimize user experience</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="policy-section">
            <div className="section-icon">
              <Globe size={18} />
            </div>
            <h3>Data Sharing and Disclosure</h3>
            <p>We do NOT sell your personal information. We may share data with:</p>
            <ul>
              <li>Service providers who assist with our operations (e.g., cloud hosting)</li>
              <li>
                // TODO: Legal review needed - specify third-party services Analytical service
                providers
              </li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="policy-section">
            <div className="section-icon">
              <Lock size={18} />
            </div>
            <h3>Data Security</h3>
            <p>
              We implement appropriate technical and organizational security measures to protect
              your information, including encryption, access controls, and regular security
              assessments.
            </p>
          </section>

          {/* Your Rights */}
          <section className="policy-section">
            <h3>Your Rights</h3>
            <p>Under GDPR and similar regulations, you have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Rectify inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p>
              To exercise these rights, please contact us through the app or at // TODO: Legal
              review needed - specify contact email [contact email].
            </p>
          </section>

          {/* Cookies */}
          <section className="policy-section">
            <h3>Cookie Policy</h3>
            <p>
              We use cookies to enhance your experience. You can manage your cookie preferences at
              any time through our consent banner or by clearing your browser cookies.
            </p>
            <ul>
              <li>
                <strong>Essential cookies</strong>: Required for basic functionality
              </li>
              <li>
                <strong>Analytics cookies</strong>: Help us understand how users interact
              </li>
              <li>
                // TODO: Legal review needed - clarify marketing cookie usage
                <strong>Marketing cookies</strong>: Used for targeted advertising
              </li>
            </ul>
          </section>

          {/* Changes to Policy */}
          <section className="policy-section">
            <h3>Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy periodically. We will notify you of any material
              changes by posting the new policy on this page and updating the &quot;Last
              Updated&quot; date.
            </p>
          </section>

          {/* Contact */}
          <section className="policy-section">
            <h3>Contact Us</h3>
            <p>
              If you have questions or concerns about this Privacy Policy, please contact us at:
            </p>
            <p className="contact-info">
              // TODO: Legal review needed - specify contact information
              <strong>Email</strong>: [contact email]
              <br />
              <strong>Address</strong>: [contact address]
            </p>
          </section>

          <p className="last-updated">Last Updated: April 2026</p>
        </div>

        <div className="modal-footer">
          <button className="btn-accent" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
