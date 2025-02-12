import { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const FeedbackForm = ({ sessionId }) => {
  const [rating, setRating] = useState(1);
  const [feedbackText, setFeedbackText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/feedback', {
        sessionId,
        rating,
        feedbackText,
      });
      alert('Feedback submitted successfully!');
      // Reset form
      setRating(1);
      setFeedbackText('');
    } catch (error) {
      alert('Error submitting feedback: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Feedback Form</h2>
      <label>
        Rating:
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
        </select>
      </label>
      <label>
        Feedback:
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          required
        />
      </label>
      <button type="submit">Submit Feedback</button>
    </form>
  );
};

FeedbackForm.propTypes = {
  sessionId: PropTypes.string.isRequired,
};

export default FeedbackForm;
