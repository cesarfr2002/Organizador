import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';
import StudySession from '../../../models/StudySession';
import { startOfWeek, endOfWeek, format, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

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
    
    // Get today's date and set it to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Set range based on period
    let startDate, endDate, labels, studyHours = [], completedTasks = [];
    
    if (period === 'week') {
      // Start from Monday of current week
      startDate = startOfWeek(today, { weekStartsOn: 1 });
      
      // End on Sunday of current week
      endDate = endOfWeek(today, { weekStartsOn: 1 });
      
      // Create labels for each day of the week
      labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      
      // Initialize data arrays
      studyHours = Array(7).fill(0);
      completedTasks = Array(7).fill(0);
      
      try {
        // Get study hours for each day of the week
        const studySessions = await StudySession.find({
          userId: session.user.id,
          date: { $gte: startDate, $lte: endDate }
        });
        
        studySessions.forEach(studySession => {
          const sessionDate = new Date(studySession.date);
          const dayIndex = (sessionDate.getDay() - 1 + 7) % 7; // 0 = Monday
          studyHours[dayIndex] += studySession.duration / 60; // Convert minutes to hours
        });
      } catch (error) {
        console.error('Error fetching study sessions:', error);
        // Continue with empty study hours
      }
      
      try {
        // Get completed tasks for each day of the week
        const tasks = await Task.find({
          userId: session.user.id,
          completed: true,
          completedAt: { $gte: startDate, $lte: endDate }
        });
        
        tasks.forEach(task => {
          const taskDate = new Date(task.completedAt);
          const dayIndex = (taskDate.getDay() - 1 + 7) % 7; // 0 = Monday
          completedTasks[dayIndex]++;
        });
      } catch (error) {
        console.error('Error fetching tasks:', error);
        // Continue with empty completed tasks
      }
    } else if (period === 'month') {
      // For month view, we group by weeks
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // Create labels for each week of the month
      const firstWeekStart = startOfWeek(startDate, { weekStartsOn: 1 });
      labels = [];
      studyHours = [];
      completedTasks = [];
      
      let currentWeekStart = firstWeekStart;
      while (currentWeekStart <= endDate) {
        const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
        labels.push(`${format(currentWeekStart, 'dd', { locale: es })}-${format(weekEnd, 'dd', { locale: es })}`);
        
        try {
          // Get study hours for this week
          const weekHours = await StudySession.aggregate([
            {
              $match: {
                userId: session.user.id.toString(),
                date: { $gte: currentWeekStart, $lte: weekEnd }
              }
            },
            {
              $group: {
                _id: null,
                totalHours: { $sum: '$duration' }
              }
            }
          ]);
          
          studyHours.push(weekHours.length > 0 ? weekHours[0].totalHours / 60 : 0);
        } catch (error) {
          console.error('Error aggregating study sessions:', error);
          studyHours.push(0);
        }
        
        try {
          // Get completed tasks for this week
          const weekTasks = await Task.countDocuments({
            userId: session.user.id,
            completed: true,
            completedAt: { $gte: currentWeekStart, $lte: weekEnd }
          });
          
          completedTasks.push(weekTasks);
        } catch (error) {
          console.error('Error counting tasks:', error);
          completedTasks.push(0);
        }
        
        // Move to next week
        currentWeekStart = addDays(weekEnd, 1);
      }
    } else { // semester
      // Simplified semester view (last 6 months)
      labels = [];
      studyHours = [];
      completedTasks = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
        labels.push(format(monthStart, 'MMM', { locale: es }));
        
        try {
          // Get study hours for this month
          const monthHours = await StudySession.aggregate([
            {
              $match: {
                userId: session.user.id.toString(),
                date: { $gte: monthStart, $lte: monthEnd }
              }
            },
            {
              $group: {
                _id: null,
                totalHours: { $sum: '$duration' }
              }
            }
          ]);
          
          studyHours.push(monthHours.length > 0 ? monthHours[0].totalHours / 60 : 0);
        } catch (error) {
          console.error('Error aggregating monthly study sessions:', error);
          studyHours.push(0);
        }
        
        try {
          // Get completed tasks for this month
          const monthTasks = await Task.countDocuments({
            userId: session.user.id,
            completed: true,
            completedAt: { $gte: monthStart, $lte: monthEnd }
          });
          
          completedTasks.push(monthTasks);
        } catch (error) {
          console.error('Error counting monthly tasks:', error);
          completedTasks.push(0);
        }
      }
    }
    
    return res.status(200).json({
      labels,
      studyHours,
      completedTasks
    });
  } catch (error) {
    console.error('Error fetching productivity data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch productivity data',
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      studyHours: [0, 0, 0, 0, 0, 0, 0],
      completedTasks: [0, 0, 0, 0, 0, 0, 0]
    });
  }
}
