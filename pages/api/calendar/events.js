import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "../../../utils/dbConnect";
import Event from "../../../models/Event";
import Subject from "../../../models/Subject";
import { format as dateFnsFormat } from 'date-fns';

export default async function handler(req, res) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    
    // Connect to database
    await dbConnect();
    
    // GET request: Retrieve events
    if (req.method === 'GET') {
      // Get query parameters for date range
      const { start, end } = req.query;
      
      // Default to current month if no dates provided
      const today = new Date();
      const startDate = start ? new Date(start) : new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = end ? new Date(end) : new Date(today.getFullYear(), today.getMonth() + 2, 0);
      
      // First, get all user's stored events within date range
      const storedEvents = await Event.find({
        userId: session.user.id,
        $or: [
          { startTime: { $lte: endDate }, endTime: { $gte: startDate } }, // Events that overlap with the range
          { isAutoScheduled: true } // Include all auto-scheduled events regardless of date
        ]
      }).populate('subjectId').populate('taskId');
      
      // Then get subjects to generate class schedule events
      const subjects = await Subject.find({ userId: session.user.id });
      
      // Generate class schedule events
      let classEvents = [];
      
      // For each subject, generate recurring class events
      subjects.forEach(subject => {
        subject.schedule.forEach(slot => {
          // Clone the date of start to avoid modifying it
          const currentDate = new Date(startDate);
          
          // Adjust to the first occurrence of this weekday
          const currentDayOfWeek = currentDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
          const daysToAdd = (slot.day - currentDayOfWeek + 7) % 7;
          
          currentDate.setDate(currentDate.getDate() + daysToAdd);
          
          // Generate all occurrences until the end date
          while (currentDate <= endDate) {
            classEvents.push({
              title: subject.name,
              date: new Date(currentDate),
              startTime: slot.startTime,
              endTime: slot.endTime,
              location: slot.location || '',
              professor: subject.professor || '',
              color: subject.color || '#3788d8',
              type: 'class',
              day: slot.day,
              subject: {
                _id: subject._id,
                name: subject.name
              }
            });
            
            // Move to next week
            currentDate.setDate(currentDate.getDate() + 7);
          }
        });
      });
      
      // Combine both stored events and generated class events
      // Convert stored events to the same format as class events
      const formattedStoredEvents = storedEvents.map(event => {
        // Get a date object for the event
        const startDateTime = new Date(event.startTime);
        const endDateTime = new Date(event.endTime);
        
        return {
          _id: event._id,
          title: event.title,
          date: startDateTime,
          startTime: formatTimeString(startDateTime),
          endTime: formatTimeString(endDateTime),
          startDateTime: startDateTime, // Add full date objects
          endDateTime: endDateTime,     // Add full date objects
          location: event.location || '',
          description: event.description || '',
          color: event.color || '#3788d8',
          type: event.type,
          isAutoScheduled: event.isAutoScheduled || false,
          taskId: event.taskId?._id || event.taskId, // Handle populated and non-populated
          subjectId: event.subjectId?._id || event.subjectId // Handle populated and non-populated
        };
      });
      
      const allEvents = [...formattedStoredEvents, ...classEvents];
      
      // Sort events by date and time
      allEvents.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });
      
      return res.status(200).json(allEvents);
      
    // POST request: Create a new event
    } else if (req.method === 'POST') {
      const { title, startTime, endTime, type, description, location, alert, taskId, subjectId, color, isAutoScheduled } = req.body;
      
      // Validate required fields
      if (!title || !startTime || !endTime) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }
      
      try {
        // Create new event
        const newEvent = new Event({
          title,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          type: type || 'other',
          description: description || '',
          location: location || '',
          alert: alert !== undefined ? alert : 30, // Default 30 min alert
          userId: session.user.id,
          taskId: taskId || null,
          subjectId: subjectId || null,
          color: color || '#3788d8',
          isAutoScheduled: isAutoScheduled || false
        });
        
        const savedEvent = await newEvent.save();
        return res.status(201).json(savedEvent);
      } catch (err) {
        console.error('Error saving event:', err);
        return res.status(500).json({ error: 'Error al guardar el evento', details: err.message });
      }
    // Handle other methods
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error handling calendar events:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud', details: error.message });
  }
}

// Helper function to format time
function formatTimeString(date) {
  if (!date) return '';
  const dateObj = new Date(date);
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
