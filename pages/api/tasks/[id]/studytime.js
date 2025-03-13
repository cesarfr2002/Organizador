import { getSession } from "next-auth/react";
import connectDB from "../../../../lib/mongodb";
import Task from "../../../../models/Task";

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: "No autenticado" });
  }

  const { id } = req.query;

  await connectDB();

  if (req.method === 'PATCH') {
    try {
      // Verificar que la tarea existe y pertenece al usuario
      const task = await Task.findOne({
        _id: id,
        user: session.user.id,
      });

      if (!task) {
        return res.status(404).json({ error: "Tarea no encontrada" });
      }

      // Obtener los minutos del cuerpo de la solicitud
      const { minutes } = req.body;
      
      if (!minutes || typeof minutes !== 'number' || minutes <= 0) {
        return res.status(400).json({ error: "Minutos inválidos" });
      }

      // Actualizar el tiempo total de estudio para la tarea
      task.studyTime = (task.studyTime || 0) + minutes;
      
      // Si hay un registro de sesiones de estudio, añadir una nueva
      if (!task.studySessions) {
        task.studySessions = [];
      }
      
      task.studySessions.push({
        date: new Date(),
        minutes: minutes
      });

      // Guardar la tarea actualizada
      await task.save();

      return res.status(200).json({ success: true, task });
    } catch (error) {
      console.error("Error actualizando tiempo de estudio:", error);
      return res.status(500).json({ error: "Error al actualizar el tiempo de estudio" });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
