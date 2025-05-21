import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { assessmentApi } from '@/services/assessment';
import { Question, Answer, AssessmentSummary } from '@/types/assessment';

interface ConductAssessmentProps {
  assessmentId: number;
  onComplete?: () => void;
}

const ConductAssessment: React.FC<ConductAssessmentProps> = ({ 
  assessmentId,
  onComplete 
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentDetails, setAssessmentDetails] = useState<AssessmentSummary | null>(null);
  const [counselorNotes, setCounselorNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, [assessmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch assessment details
      const details = await assessmentApi.getAssessmentDetails(assessmentId);
      setAssessmentDetails(details);
      
      // Fetch questions
      const questionData = await assessmentApi.getQuestions();
      setQuestions(questionData);
      
      // Initialize answers array
      const initialAnswers = questionData.map(q => ({
        question_id: q.id,
        answer: 0,
        gift_correlation: q.gift_correlation
      }));
      setAnswers(initialAnswers);
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex].answer = value;
    setAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate that all questions have been answered
    const unanswered = answers.some(a => a.answer === 0);
    if (unanswered) {
      setError('Please answer all questions before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Submit the assessment
      await assessmentApi.counselorSubmitResponse(
        assessmentId,
        answers,
        counselorNotes
      );
      
      if (onComplete) {
        onComplete();
      } else {
        // Redirect to results page using Next.js App Router
        // We use window.location.href to make sure the page is fully reloaded 
        // with the new assessment data
        window.location.href = `/counselor/assessments/${assessmentId}/results`;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center p-6">Loading assessment...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!assessmentDetails) {
    return <div className="text-center p-6">Assessment not found</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{assessmentDetails.title}</h2>
        {assessmentDetails.description && (
          <p className="text-gray-600">{assessmentDetails.description}</p>
        )}

        <div className="mt-4 bg-gray-200 h-2 rounded-full">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-right text-sm text-gray-600 mt-1">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      {currentQuestion && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-medium mb-4">{currentQuestion.text}</h3>
          
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <div 
                key={value}
                className={`p-3 border rounded-md cursor-pointer ${
                  answers[currentQuestionIndex].answer === value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleAnswerChange(value)}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    answers[currentQuestionIndex].answer === value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200'
                  }`}>
                    {value}
                  </div>
                  <div>
                    {value === 1 && 'Strongly Disagree'}
                    {value === 2 && 'Disagree'}
                    {value === 3 && 'Neutral'}
                    {value === 4 && 'Agree'}
                    {value === 5 && 'Strongly Agree'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentQuestionIndex === questions.length - 1 && (
        <div className="mb-6">
          <label htmlFor="counselor-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Counselor Notes (Optional)
          </label>
          <textarea
            id="counselor-notes"
            value={counselorNotes}
            onChange={(e) => setCounselorNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add your observations or notes about this assessment session..."
          />
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white disabled:opacity-50"
        >
          Previous
        </button>
        
        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={goToNextQuestion}
            disabled={answers[currentQuestionIndex].answer === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || answers.some(a => a.answer === 0)}
            className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Complete Assessment'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ConductAssessment; 