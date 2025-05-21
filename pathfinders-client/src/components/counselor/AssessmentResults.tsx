import React, { useState, useEffect } from 'react';
import { assessmentApi } from '@/services/assessment';
import { AssessmentSummary, GiftScore } from '@/types/assessment';

interface AssessmentResultsProps {
  assessmentId: number;
}

const AssessmentResults: React.FC<AssessmentResultsProps> = ({ assessmentId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<AssessmentSummary | null>(null);
  const [addingNotes, setAddingNotes] = useState(false);
  const [counselorNotes, setCounselorNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessmentDetails();
  }, [assessmentId]);

  const fetchAssessmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await assessmentApi.getAssessmentDetails(assessmentId);
      setAssessment(data);
      setCounselorNotes(data.counselor_notes || '');
      
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setAddingNotes(true);
      setError(null);
      setSuccessMessage(null);
      
      await assessmentApi.counselorAddNotes(assessmentId, counselorNotes);
      setSuccessMessage('Notes saved successfully');
      
      // Refresh assessment details
      fetchAssessmentDetails();
    } catch (err: any) {
      setError(err.message || 'Failed to save notes');
      console.error(err);
    } finally {
      setAddingNotes(false);
    }
  };

  if (loading) {
    return <div className="text-center p-6">Loading assessment results...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!assessment || !assessment.results_data) {
    return <div className="text-center p-6">No results found for this assessment</div>;
  }

  const { primary_gift, secondary_gifts, scores } = assessment.results_data;
  
  // Sort gifts by score value (highest to lowest)
  const sortedGiftScores = Object.entries(scores as GiftScore)
    .sort((a, b) => b[1] - a[1]);
  
  // Convert decimal scores to percentages with higher precision
  const giftPercentages = sortedGiftScores.map(([gift, score]) => ({
    gift,
    score,
    // Store both rounded and precise percentages
    percentage: Math.round(score * 100),
    exactPercentage: (score * 100).toFixed(2)
  }));
  
  // Find the range of scores to help with visualization
  const highestScore = giftPercentages[0].score;
  const lowestScore = giftPercentages[giftPercentages.length - 1].score;
  const scoreRange = highestScore - lowestScore;
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Identified Gifts</h3>
          
          <div className="mb-4">
            <div className="font-medium">Primary Gift:</div>
            <div className="text-2xl text-blue-700 capitalize">{primary_gift}</div>
            <div className="text-sm text-gray-500">
              (Highest score: {giftPercentages.find(g => g.gift.toUpperCase() === primary_gift.toUpperCase())?.exactPercentage}%)
            </div>
          </div>
          
          {secondary_gifts && secondary_gifts.length > 0 && (
            <div>
              <div className="font-medium">Secondary Gifts:</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {secondary_gifts.map((gift: string) => (
                  <div key={gift} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                    {gift}
                    <span className="text-xs text-gray-500 ml-1">
                      ({giftPercentages.find(g => g.gift.toUpperCase() === gift.toUpperCase())?.exactPercentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-3">Gift Scores</h3>
          <p className="text-sm text-gray-500 mb-3">Showing precise percentages to 2 decimal places</p>
          <div className="space-y-4">
            {giftPercentages.map(({ gift, percentage, exactPercentage }, index) => {
              // Calculate colors - highlight the primary gift and differentiate close scores
              const isPrimary = gift.toUpperCase() === primary_gift.toUpperCase();
              const isSecondary = secondary_gifts.some(g => g.toUpperCase() === gift.toUpperCase());
              let barColor = 'bg-gray-400';
              
              if (isPrimary) barColor = 'bg-blue-600';
              else if (isSecondary) barColor = 'bg-blue-400';
              else if (index < 3) barColor = 'bg-blue-300';
              
              return (
                <div key={gift} className="flex flex-col">
                  <div className="flex justify-between mb-1">
                    <div className="font-medium flex items-center">
                      {gift.toUpperCase()}
                      {isPrimary && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Primary</span>}
                    </div>
                    <span>{exactPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${barColor}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Note: All scores sum to 100%. Very close scores may indicate gifts of almost equal strength.
          </p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-3">Counselor Notes</h3>
        
        <textarea
          value={counselorNotes}
          onChange={(e) => setCounselorNotes(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          placeholder="Add your observations or insights about this assessment..."
        />
        
        <button
          onClick={handleSaveNotes}
          disabled={addingNotes}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {addingNotes ? 'Saving...' : 'Save Notes'}
        </button>
      </div>
    </div>
  );
};

export default AssessmentResults; 