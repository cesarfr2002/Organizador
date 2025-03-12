import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';
import Subject from '../../../models/Subject';
import { startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    await dbConnect();
    
    // Get period from query params with default to 'week'
    const period = req.query.period || 'week';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Set range based on period
    let startDate, endDate;
    
    if (period === 'week') {
      // Start from Monday of current week
      startDate = startOfWeek(today, { weekStartsOn: 1 });
      // End on Sunday of current week
      endDate = endOfWeek(today, { weekStartsOn: 1 });
    } else if (period === 'month') {
      // Start from first day of current month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      // End on last day of current month
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else { // semester
      // Approximately 6 months
      startDate = subDays(today, 180);
      endDate = today;
    }
    
    // Get stats
    const stats = {
      tasksCompleted: 0,
      tasksPending: 0,
      upcomingExams: 0,
      totalSubjects: 0,
      currentStreak: 0,
      weeklyProgress: 0,
      studyGoals: { achieved: 0, total: 5 } // Default value
    };
    
    // Get tasks completed in the period
    const completedTasks = await Task.countDocuments({
      userId: session.user.id,
      completed: true,
      completedAt: { $gte: startDate, $lte: endDate }
    });
    
    stats.tasksCompleted = completedTasks;
    
    // Get pending tasks
    const pendingTasks = await Task.countDocuments({
      userId: session.user.id,
      completed: false,
      dueDate: { $gte: today }
    });
    
    stats.tasksPending = pendingTasks;
    
    // Get upcoming exams
    const upcomingExams = await Task.countDocuments({
      userId: session.user.id,
      type: 'examen',
      completed: false,
      dueDate: { $gte: today }
    });
    
    stats.upcomingExams = upcomingExams;
    
    // Get total subjects
    const totalSubjects = await Subject.countDocuments({
      userId: session.user.id
    });
    
    stats.totalSubjects = totalSubjects;
    
    // Calculate weekly progress based on completed vs total tasks for the period
    const totalTasks = await Task.countDocuments({
      userId: session.user.id,
      dueDate: { $gte: startDate, $lte: endDate }
    });
    
    if (totalTasks > 0) {
      stats.weeklyProgress = Math.round((completedTasks / totalTasks) * 100);
    }
    
    // Study goals simplified calculation
    // This would ideally come from a user goals collection
    stats.studyGoals.achieved = Math.min(completedTasks, stats.studyGoals.total);
    
    // Calculate streak (simplified version - in a real app this would be more complex)
    // Here we just set it to a value based on completed tasks
    stats.currentStreak = Math.min(completedTasks, 7);
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      tasksCompleted: 0,
      tasksPending: 0,
      upcomingExams: 0,
      totalSubjects: 0,
      currentStreak: 0,
      weeklyProgress: 0,
      studyGoals: { achieved: 0, total: 5 }
    });
  }
}
