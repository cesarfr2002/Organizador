import dbConnect from '../../../lib/dbConnect';
import Subject from '../../../models/Subject';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  const { id } = req.query;
  
  // Cambiar getSession por getServerSession para API Routes
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  
  // Verificar que la asignatura existe y pertenece al usuario
  const subject = await Subject.findOne({ 
    _id: id,
    userId: session.user.id
  });
  
  if (!subject) {
    return res.status(404).json({ error: 'Asignatura no encontrada' });
  }
  
  // GET - Obtener una asignatura específica
  if (req.method === 'GET') {
    return res.status(200).json(subject);
  }
  
  // PUT o PATCH - Actualizar una asignatura
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const { name, code, color, professor, professorContact, credits, schedule, notes } = req.body;
      
      // Actualizar solo los campos proporcionados
      if (name !== undefined) subject.name = name;
      if (code !== undefined) subject.code = code;
      if (color !== undefined) subject.color = color;
      if (professor !== undefined) subject.professor = professor;
      if (professorContact !== undefined) subject.professorContact = professorContact;
      if (credits !== undefined) subject.credits = credits;
      if (schedule !== undefined) subject.schedule = schedule;
      if (notes !== undefined) subject.notes = notes;
      
      await subject.save();
      return res.status(200).json(subject);
    } catch (error) {
      console.error('Error updating subject:', error);
      return res.status(500).json({ error: 'Error al actualizar la asignatura' });
    }
  }
  
  // DELETE - Eliminar una asignatura
  if (req.method === 'DELETE') {
    try {
      await Subject.deleteOne({ _id: id });
      return res.status(200).json({ message: 'Asignatura eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting subject:', error);
      return res.status(500).json({ error: 'Error al eliminar la asignatura' });
    }
  }
  
  // Si el método no está permitido
  return res.status(405).json({ error: 'Método no permitido' });
}
