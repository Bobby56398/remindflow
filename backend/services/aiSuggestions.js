import { allQuery, getQuery } from '../db.js';

export const analyzeOptimalTimes = async (userId, reminderId = null) => {
  try {
    const completions = await allQuery(
      `SELECT 
        strftime('%H', completed_at) as hour,
        COUNT(*) as count,
        reminder_id
       FROM reminder_completions
       WHERE user_id = ? AND status = 'completed'
       ${reminderId ? 'AND reminder_id = ?' : ''}
       GROUP BY hour, reminder_id
       ORDER BY count DESC`,
      reminderId ? [userId, reminderId] : [userId]
    );

    if (completions.length === 0) {
      return {
        suggestedTimes: ['09:00', '14:00', '19:00'],
        reason: 'Default times based on productivity research',
        confidence: 'low'
      };
    }

    const hourCounts = {};
    completions.forEach(c => {
      const hour = parseInt(c.hour);
      hourCounts[hour] = (hourCounts[hour] || 0) + c.count;
    });

    const sortedHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour.padStart(2, '0')}:00`);

    return {
      suggestedTimes: sortedHours,
      reason: 'Based on your completion history',
      confidence: 'high',
      completionData: hourCounts
    };
  } catch (error) {
    console.error('Error analyzing optimal times:', error);
    return {
      suggestedTimes: ['09:00', '14:00', '19:00'],
      reason: 'Error analyzing data, using defaults',
      confidence: 'low'
    };
  }
};

export const analyzeMissedPatterns = async (userId, reminderId) => {
  try {
    const missedCompletions = await allQuery(
      `SELECT 
        strftime('%H', scheduled_time) as hour,
        strftime('%w', scheduled_time) as day_of_week,
        COUNT(*) as count
       FROM reminder_completions
       WHERE user_id = ? AND reminder_id = ? AND status = 'missed'
       GROUP BY hour, day_of_week`,
      [userId, reminderId]
    );

    const completedCompletions = await allQuery(
      `SELECT 
        strftime('%H', completed_at) as hour,
        strftime('%w', completed_at) as day_of_week,
        COUNT(*) as count
       FROM reminder_completions
       WHERE user_id = ? AND reminder_id = ? AND status = 'completed'
       GROUP BY hour, day_of_week`,
      [userId, reminderId]
    );

    const missedHours = missedCompletions.map(m => parseInt(m.hour));
    const completedHours = completedCompletions.map(c => parseInt(c.hour));

    const problematicHours = missedHours.filter(hour => 
      missedHours.filter(h => h === hour).length > 2
    );

    const bestHours = completedHours.filter(hour => 
      !problematicHours.includes(hour)
    );

    return {
      problematicHours: [...new Set(problematicHours)],
      bestHours: [...new Set(bestHours)],
      totalMissed: missedCompletions.reduce((sum, m) => sum + m.count, 0),
      totalCompleted: completedCompletions.reduce((sum, c) => sum + c.count, 0)
    };
  } catch (error) {
    console.error('Error analyzing missed patterns:', error);
    return null;
  }
};

export const generateSmartReschedule = async (userId, reminderId, currentTime) => {
  try {
    const reminder = await getQuery(
      'SELECT * FROM reminders WHERE id = ? AND user_id = ?',
      [reminderId, userId]
    );

    if (!reminder) return null;

    const patterns = await analyzeMissedPatterns(userId, reminderId);
    if (!patterns) return null;

    const completionRate = patterns.totalCompleted / (patterns.totalCompleted + patterns.totalMissed);

    if (completionRate < 0.5 && patterns.totalMissed > 3) {
      const currentHour = parseInt(currentTime.split(':')[0]);
      
      if (patterns.problematicHours.includes(currentHour)) {
        const optimalTimes = await analyzeOptimalTimes(userId, reminderId);
        const suggestedTime = optimalTimes.suggestedTimes[0];

        return {
          shouldReschedule: true,
          suggestedTime,
          reason: `You've missed this reminder ${patterns.totalMissed} times at ${currentTime}. Try ${suggestedTime} instead?`,
          confidence: optimalTimes.confidence,
          completionRate: (completionRate * 100).toFixed(1)
        };
      }
    }

    return {
      shouldReschedule: false,
      completionRate: (completionRate * 100).toFixed(1)
    };
  } catch (error) {
    console.error('Error generating smart reschedule:', error);
    return null;
  }
};

export const analyzeProductivityPatterns = async (userId) => {
  try {
    const weeklyPatterns = await allQuery(
      `SELECT 
        strftime('%w', completed_at) as day_of_week,
        strftime('%H', completed_at) as hour,
        COUNT(*) as completions
       FROM reminder_completions
       WHERE user_id = ? AND status = 'completed'
       GROUP BY day_of_week, hour
       ORDER BY completions DESC
       LIMIT 10`,
      [userId]
    );

    const bestDays = [...new Set(weeklyPatterns.map(p => parseInt(p.day_of_week)))].slice(0, 3);
    const bestHours = [...new Set(weeklyPatterns.map(p => parseInt(p.hour)))].slice(0, 3);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      bestDays: bestDays.map(d => dayNames[d]),
      bestHours: bestHours.map(h => `${h.toString().padStart(2, '0')}:00`),
      patterns: weeklyPatterns
    };
  } catch (error) {
    console.error('Error analyzing productivity patterns:', error);
    return null;
  }
};