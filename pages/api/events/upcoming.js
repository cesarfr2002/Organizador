import dbConnect from '../../../lib/dbConnect';
import Subject from '../../../models/Subject';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  try {
    await dbConnect();
    
    // Obtener todas las asignaturas del usuario
    const subjects = await Subject.find({ userId: session.user.id });
    
    // Transformar horarios de asignaturas en eventos
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 es domingo, 1 es lunes, etc.
    
    let events = [];
    
    // Procesar las clases de hoy y los próximos días
    subjects.forEach(subject => {
      subject.schedule.forEach(slot => {
        // Determinar cuántos días faltan para la próxima ocurrencia de esta clase
        let daysUntil = (slot.day - dayOfWeek + 7) % 7;
        if (daysUntil === 0) {
          // Si es hoy, verificar si la hora ya pasó
          const [hour, minute] = slot.startTime.split(':').map(Number);
          const classTime = new Date();
          classTime.setHours(hour, minute, 0);
          
          if (classTime < today) {
            daysUntil = 7; // La clase de hoy ya pasó, mostrar la de la próxima semana
          }
        }
        
        const nextOccurrence = new Date();
        nextOccurrence.setDate(today.getDate() + daysUntil);
        
        events.push({
          name: subject.name,
          professor: subject.professor,
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: slot.location,
          color: subject.color,
          day: slot.day,
          date: nextOccurrence
        });
      });
    });
    
    // Ordenar eventos por fecha y hora
    events.sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) {
        return a.date.getTime() - b.date.getTime();
      }
      return a.startTime.localeCompare(b.startTime);
    });
    
    // Limitar a los próximos 5 eventos
    events = events.slice(0, 5);
    
    return res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return res.status(500).json({ error: 'Error al obtener los eventos' });
  }
}
