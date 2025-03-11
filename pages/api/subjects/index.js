import dbConnect from '../../../lib/dbConnect';
import Subject from '../../../models/Subject';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  
  const { method } = req;
  const userId = session.user.id;
  
  switch (method) {
    // Obtener todas las asignaturas del usuario
    case 'GET':
      try {
        const subjects = await Subject.find({ userId });
        res.status(200).json(subjects);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    // Crear una nueva asignatura
    case 'POST':
      try {
        // Si no se especifica un color, generar uno aleatorio
        if (!req.body.color) {
          const colors = [
            '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', 
            '#4caf50', '#8bc34a', '#cddc39', '#ffc107', '#ff9800',
            '#ff5722', '#795548', '#607d8b', '#e91e63', '#9c27b0'
          ];
          req.body.color = colors[Math.floor(Math.random() * colors.length)];
        }
        
        const subject = await Subject.create({
          ...req.body,
          userId
        });
        res.status(201).json(subject);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
