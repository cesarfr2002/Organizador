import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';
import Subject from '../../../models/Subject';

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
    
    // Get all subjects for the user
    const subjects = await Subject.find({ userId: session.user.id });
    
    // For each subject, calculate progress
    const progress = [];
    const labels = [];
    const colors = [];
    
    await Promise.all(subjects.map(async (subject) => {
      // Get total tasks for the subject
      const totalTasks = await Task.countDocuments({
        userId: session.user.id,
        subject: subject._id
      });
      
      // Skip subjects with no tasks
      if (totalTasks === 0) return;
      
      // Get completed tasks for the subject
      const completedTasks = await Task.countDocuments({
        userId: session.user.id,
        subject: subject._id,
        completed: true
      });
      
      // Calculate progress percentage
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      labels.push(subject.name);
      progress.push(progressPercentage);
      colors.push(subject.color);
    }));
    
    return res.status(200).json({
      labels,
      progress,
      colors
    });
  } catch (error) {
    console.error('Error fetching subject progress data:', error);
    return res.status(500).json({ error: 'Failed to fetch subject progress data' });
  }
}
