import dbConnect from '../../../lib/dbConnect';
import Subject from '../../../models/Subject';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  
  // GET - Obtener todas las asignaturas del usuario
  if (req.method === 'GET') {
    try {
      const subjects = await Subject.find({ userId: session.user.id })
                                  .sort({ name: 1 });
      return res.status(200).json(subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return res.status(500).json({ error: 'Error al obtener las asignaturas' });
    }
  }
  
  // POST - Crear una nueva asignatura
  if (req.method === 'POST') {
    try {
      const { name, code, color, professor, professorContact, credits, schedule, notes } = req.body;
      
      // Validación básica
      if (!name) {
        return res.status(400).json({ error: 'El nombre de la asignatura es obligatorio' });
      }

      const newSubject = await Subject.create({
        name,
        code: code || '',
        color: color || '#3182CE',
        professor: professor || '',
        professorContact: professorContact || '',
        credits: credits || 0,
        schedule: schedule || [],
        notes: notes || '',
        userId: session.user.id
      });

      return res.status(201).json(newSubject);
    } catch (error) {
      console.error('Error creating subject:', error);
      return res.status(500).json({ error: 'Error al crear la asignatura' });
    }
  }
  
  // Si el método no está permitido
  return res.status(405).json({ error: 'Método no permitido' });
}
