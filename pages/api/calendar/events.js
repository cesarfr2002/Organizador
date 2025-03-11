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
    
    // Generar eventos para el mes actual y el siguiente
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // Primer día del mes actual
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0); // Último día del próximo mes
    
    let events = [];
    
    // Para cada asignatura, generar eventos recurrentes
    subjects.forEach(subject => {
      subject.schedule.forEach(slot => {
        // Clonar la fecha de inicio para no modificarla
        const currentDate = new Date(startDate);
        
        // Ajustar al primer día de la semana que corresponde a la clase
        const currentDayOfWeek = currentDate.getDay(); // 0 es domingo, 1 es lunes, etc.
        const daysToAdd = (slot.day - currentDayOfWeek + 7) % 7;
        
        currentDate.setDate(currentDate.getDate() + daysToAdd);
        
        // Generar todas las ocurrencias hasta la fecha final
        while (currentDate <= endDate) {
          events.push({
            title: subject.name,
            date: new Date(currentDate),
            startTime: slot.startTime,
            endTime: slot.endTime,
            location: slot.location,
            professor: subject.professor,
            color: subject.color,
            type: 'class',
            day: slot.day
          });
          
          // Avanzar a la próxima semana
          currentDate.setDate(currentDate.getDate() + 7);
        }
      });
    });
    
    // Ordenar eventos por fecha
    events.sort((a, b) => a.date - b.date);
    
    return res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return res.status(500).json({ error: 'Error al obtener los eventos del calendario' });
  }
}
