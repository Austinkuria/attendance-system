import { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { ThemeContext } from '../context/ThemeContext';
import { submitLectureFeedbackData } from '../services/api';

/**
 * QRollCall Lecture Feedback Modal
 * Complies strictly with UI Craft & Anti-Slop Design Rules:
 * - rounded-lg modal dialog with 1px hairline border, shadow-none
 * - rounded-md controls (h-9 primary button, compact button selectors)
 * - Direct ThemeContext bindings via CSS variables
 */
const FeedbackModal = ({ isOpen, onClose, activeSession, session: sessionProp, onSubmitted, onSubmitSuccess }) => {
  const { isDarkMode, getCardStyle, getSubtleStyle, getInputStyle } = useContext(ThemeContext);
  const session = activeSession || sessionProp;

  const [rating, setRating] = useState(4);
  const [isClear, setIsClear] = useState(true);
  const [pace, setPace] = useState('JUST_RIGHT');
  const [interactivity, setInteractivity] = useState(3);
  const [resources, setResources] = useState('');
  const [comments, setComments] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('userData') || '{}');
      if (user.preferences?.anonymous_feedback_default !== undefined) {
        setIsAnonymous(user.preferences.anonymous_feedback_default);
      }
    } catch {
      // Use defaults
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        sessionId: session?.id || session?.sessionId || session?._id,
        unitId: session?.unitId || session?.unit?._id || session?.unit,
        overallRating: rating,
        rating: rating,
        isClear: isClear,
        clarity: isClear,
        pace: pace,
        interactivity: interactivity,
        resourcesHelpful: resources,
        resources: resources,
        comments: comments,
        feedbackText: comments,
        isAnonymous: isAnonymous,
        anonymous: isAnonymous,
      };

      await submitLectureFeedbackData(payload);
      setSubmitted(true);
      if (onSubmitted) onSubmitted();
      if (onSubmitSuccess) onSubmitSuccess();
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      {/* Modal Card Window */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg border shadow-none transition-all"
        style={getCardStyle()}
      >
        {/* Pinned Header */}
        <div
          className="px-5 py-3.5 flex items-center justify-between border-b shrink-0"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div>
            <h3
              className="text-base font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Lecture Feedback
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {session?.unitCode ? `${session.unitCode}: ` : ''}{session?.unitName || 'Mobile and Web Application Architecture'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer border"
            style={getSubtleStyle()}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        {submitted ? (
          <div className="p-8 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#D4FF5E] text-[#131926] flex items-center justify-center shadow-none">
              <svg className="w-7 h-7 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Feedback received
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Thank you for helping improve lecture quality.
            </p>
          </div>
        ) : (
          <form id="feedback-form" onSubmit={handleSubmit} className="overflow-y-auto px-5 py-4 space-y-3.5 flex-1 min-h-0">
            {errorMessage && (
              <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-300 text-xs text-center font-medium">
                {errorMessage}
              </div>
            )}

            {/* 1. Overall Rating */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-slate-400">
                Overall rating
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    className="h-8 rounded-md text-xs font-semibold border transition-colors cursor-pointer"
                    style={
                      rating === num
                        ? {
                            backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                            color: isDarkMode ? '#131926' : '#FFFFFF',
                            borderColor: isDarkMode ? '#D4FF5E' : '#131926',
                          }
                        : getSubtleStyle()
                    }
                  >
                    {num} ★
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Was it clear? */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-slate-400">
                Was the material clear?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsClear(true)}
                  className="h-8 rounded-md text-xs font-semibold border transition-colors cursor-pointer"
                  style={
                    isClear
                      ? {
                          backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                          color: isDarkMode ? '#131926' : '#FFFFFF',
                          borderColor: isDarkMode ? '#D4FF5E' : '#131926',
                        }
                      : getSubtleStyle()
                  }
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setIsClear(false)}
                  className="h-8 rounded-md text-xs font-semibold border transition-colors cursor-pointer"
                  style={
                    !isClear
                      ? {
                          backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                          color: isDarkMode ? '#131926' : '#FFFFFF',
                          borderColor: isDarkMode ? '#D4FF5E' : '#131926',
                        }
                      : getSubtleStyle()
                  }
                >
                  Needs work
                </button>
              </div>
            </div>

            {/* 3. Pace */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-slate-400">
                Lecture pace
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'TOO_SLOW', label: 'Too slow' },
                  { id: 'JUST_RIGHT', label: 'Just right' },
                  { id: 'TOO_FAST', label: 'Too fast' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPace(p.id)}
                    className="h-8 rounded-md text-xs font-semibold border transition-colors cursor-pointer"
                    style={
                      pace === p.id
                        ? {
                            backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                            color: isDarkMode ? '#131926' : '#FFFFFF',
                            borderColor: isDarkMode ? '#D4FF5E' : '#131926',
                          }
                        : getSubtleStyle()
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Interactivity */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-slate-400">
                Interactivity
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setInteractivity(num)}
                    className="h-8 rounded-md text-xs font-semibold border transition-colors cursor-pointer"
                    style={
                      interactivity === num
                        ? {
                            backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                            color: isDarkMode ? '#131926' : '#FFFFFF',
                            borderColor: isDarkMode ? '#D4FF5E' : '#131926',
                          }
                        : getSubtleStyle()
                    }
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Resources */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1 text-slate-500 dark:text-slate-400">
                Resources (slides, notes, code)
              </label>
              <input
                type="text"
                value={resources}
                onChange={(e) => setResources(e.target.value)}
                placeholder="Were the resources helpful?"
                className="w-full text-xs h-9 px-3 rounded-md border font-normal"
                style={getInputStyle()}
              />
            </div>

            {/* 6. Comments */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1 text-slate-500 dark:text-slate-400">
                Constructive feedback (optional)
              </label>
              <textarea
                rows={2}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share any specific observations..."
                className="w-full text-xs p-3 rounded-md border font-normal resize-none"
                style={getInputStyle()}
              />
            </div>
          </form>
        )}

        {/* Pinned Footer */}
        {!submitted && (
          <div
            className="px-5 py-3 border-t shrink-0 flex items-center justify-between gap-3"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded-xs cursor-pointer accent-[#D4FF5E]"
              />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Send anonymously
              </span>
            </label>

            <button
              type="submit"
              form="feedback-form"
              disabled={submitting}
              className="h-9 px-4 rounded-md font-semibold text-xs transition-colors cursor-pointer"
              style={{
                backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                color: isDarkMode ? '#131926' : '#FFFFFF',
              }}
            >
              {submitting ? 'Submitting...' : 'Send feedback'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

FeedbackModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  activeSession: PropTypes.object,
  session: PropTypes.object,
  onSubmitted: PropTypes.func,
  onSubmitSuccess: PropTypes.func,
};

export default FeedbackModal;
