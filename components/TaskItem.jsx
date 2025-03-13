// ...existing code...

// Función para actualizar el estado de una tarea
const toggleTaskStatus = async (taskId, currentStatus) => {
  if (!taskId) {
    console.error('Error: ID de tarea no válido');
    return;
  }
  
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        completed: !currentStatus
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar la tarea');
    }
    
    // Manejar la respuesta exitosa
    const updatedTask = await response.json();
    // Actualizar el estado o ejecutar callback
    
  } catch (error) {
    console.error('Error updating task:', error);
    // Mostrar mensaje de error al usuario
  }
};

// ...existing code...