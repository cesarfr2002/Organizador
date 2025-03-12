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
    
    // Get today's date and set it to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get date 14 days from today
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);
    
    // Find upcoming tasks (due dates in the next 14 days)
    const tasks = await Task.find({
      userId: session.user.id,
      dueDate: { $gte: today, $lte: twoWeeksLater },
      completed: false
    }).populate('subject').sort({ dueDate: 1 }).limit(5);
    
    // Get class sessions happening today
    const subjects = await Subject.find({ userId: session.user.id });
    
    // Transform tasks and classes into events format
    const events = [
      // Add tasks as events
      ...tasks.map(task => ({
        title: task.title,
        date: task.dueDate,
        type: task.type || 'Tarea',
        subject: task.subject ? {
          name: task.subject.name,
          color: task.subject.color
        } : null,
        location: task.examDetails?.location || ''
      })),
      
      // Add today's classes as events
      ...subjects.flatMap(subject => {
        // Get today's day of week (1-7, Monday=1)
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
        
        return (subject.schedule || [])
          .filter(slot => slot.day === dayOfWeek)
          .map(slot => ({
            title: `Clase de ${subject.name}`,
            date: today,
            time: `${slot.startTime} - ${slot.endTime}`,
            type: 'Clase',
            subject: {
              name: subject.name,
              color: subject.color
            },
            location: slot.location ? {
              campus: slot.location.campus || '',
              building: slot.location.building || '',
              floor: slot.location.floor || '',
              room: slot.location.room || ''
            } : ''
          }));
      })
    ];
    
    return res.status(200).json(events);
  } catch (error) {
    console.error('Dashboard events error:', error);
    return res.status(500).json({ error: 'Error fetching dashboard events' });
  }
}
