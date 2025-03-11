import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';
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
    // Obtener todas las tareas del usuario
    case 'GET':
      try {
        const tasks = await Task.find({ userId })
          .populate('subject', 'name color')
          .sort({ dueDate: 1 });
        res.status(200).json(tasks);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    // Crear una nueva tarea
    case 'POST':
      try {
        const task = await Task.create({
          ...req.body,
          userId
        });
        res.status(201).json(task);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
