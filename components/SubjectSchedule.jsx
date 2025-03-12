import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function SubjectSchedule({ subject, onSuccess }) {
  const [schedule, setSchedule] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Estado para un nuevo horario
  const [newSlot, setNewSlot] = useState({
    day: 1, // Lunes por defecto
    startTime: '08:00',
    endTime: '10:00',
    location: {
      campus: '',
      building: '',
      floor: '',
      room: '',
      additionalInfo: ''
    }
  });

  // Días de la semana
  const weekdays = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 7, name: 'Domingo' }
  ];

  // Inicializar horario desde el subject
  useEffect(() => {
    if (subject && subject.schedule) {
      setSchedule(subject.schedule);
    }
  }, [subject]);

  // Manejar cambios en el formulario de slot
  const handleSlotChange = (e) => {
    const { name, value } = e.target;
    
    // Si el nombre tiene notación de punto, maneja el campo de ubicación
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setNewSlot(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewSlot(prev => ({ ...prev, [name]: value }));
    }
  };

  // Configurar edición de un slot existente
  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setNewSlot({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      location: slot.location || {
        campus: '',
        building: '',
        floor: '',
        room: '',
        additionalInfo: ''
      }
    });
    setShowForm(true);
  };

  // Agregar o actualizar un slot de horario
  const handleSubmitSlot = async (e) => {
    e.preventDefault();
    
    // Validar horarios
    if (newSlot.startTime >= newSlot.endTime) {
      toast.error('La hora de inicio debe ser anterior a la hora de finalización');
      return;
    }
    
    try {
      let updatedSchedule;
      
      if (editingSlot) {
        // Actualizar slot existente
        updatedSchedule = schedule.map(slot => 
          slot === editingSlot ? newSlot : slot
        );
      } else {
        // Agregar nuevo slot
        updatedSchedule = [...schedule, newSlot];
      }
      
      // Ordenar por día y hora
      updatedSchedule.sort((a, b) => {
        if (a.day !== b.day) {
          return a.day - b.day;
        }
        return a.startTime.localeCompare(b.startTime);
      });
      
      // Actualizar en la base de datos
      const res = await fetch(`/api/subjects/${subject._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...subject,
          schedule: updatedSchedule
        })
      });
      
      if (!res.ok) {
        throw new Error('Error al actualizar el horario');
      }
      
      const updatedSubject = await res.json();
      
      // Actualizar el estado local
      setSchedule(updatedSchedule);
      toast.success('Horario actualizado correctamente');
      
      // Notificar al componente padre
      if (onSuccess) {
        onSuccess(updatedSubject);
      }
      
      // Limpiar el formulario
      resetForm();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Error al guardar el horario');
    }
  };

  // Eliminar un slot del horario
  const handleDeleteSlot = async (slotToDelete) => {
    if (!confirm('¿Está seguro de que desea eliminar esta sesión del horario?')) {
      return;
    }
    
    try {
      const updatedSchedule = schedule.filter(slot => slot !== slotToDelete);
      
      // Actualizar en la base de datos
      const res = await fetch(`/api/subjects/${subject._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...subject,
          schedule: updatedSchedule
        })
      });
      
      if (!res.ok) {
        throw new Error('Error al actualizar el horario');
      }
      
      const updatedSubject = await res.json();
      
      // Actualizar el estado local
      setSchedule(updatedSchedule);
      toast.success('Sesión eliminada correctamente');
      
      // Notificar al componente padre
      if (onSuccess) {
        onSuccess(updatedSubject);
      }
    } catch (error) {
      console.error('Error deleting schedule slot:', error);
      toast.error('Error al eliminar la sesión');
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setNewSlot({
      day: 1,
      startTime: '08:00',
      endTime: '10:00',
      location: {
        campus: '',
        building: '',
        floor: '',
        room: '',
        additionalInfo: ''
      }
    });
    setEditingSlot(null);
    setShowForm(false);
  };

  // Función auxiliar para formatear la ubicación
  const formatLocation = (location) => {
    if (!location) return 'Sin ubicación especificada';
    
    const parts = [];
    if (location.campus) parts.push(location.campus);
    if (location.building) parts.push(`Edificio ${location.building}`);
    if (location.floor) parts.push(`Piso ${location.floor}`);
    if (location.room) parts.push(`Sala ${location.room}`);
    
    return parts.length > 0 ? parts.join(', ') : 'Sin ubicación especificada';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Horario de clases</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center transition"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m6 0H6" />
          </svg>
          Agregar horario
        </button>
      </div>

      {/* Formulario para agregar/editar horarios */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-medium mb-4">
            {editingSlot ? 'Editar sesión' : 'Agregar nueva sesión'}
          </h3>
          
          <form onSubmit={handleSubmitSlot}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Día de la semana */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Día</label>
                <select 
                  name="day"
                  value={newSlot.day}
                  onChange={handleSlotChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {weekdays.map(day => (
                    <option key={day.id} value={day.id}>{day.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Hora de inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de inicio</label>
                <input
                  type="time"
                  name="startTime"
                  value={newSlot.startTime}
                  onChange={handleSlotChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              {/* Hora de fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de fin</label>
                <input
                  type="time"
                  name="endTime"
                  value={newSlot.endTime}
                  onChange={handleSlotChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            {/* Ubicación */}
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">Ubicación</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Campus */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                  <input
                    type="text"
                    name="location.campus"
                    value={newSlot.location.campus}
                    onChange={handleSlotChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                {/* Edificio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Edificio</label>
                  <input
                    type="text"
                    name="location.building"
                    value={newSlot.location.building}
                    onChange={handleSlotChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                {/* Piso */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Piso</label>
                  <input
                    type="text"
                    name="location.floor"
                    value={newSlot.location.floor}
                    onChange={handleSlotChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                {/* Sala */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sala</label>
                  <input
                    type="text"
                    name="location.room"
                    value={newSlot.location.room}
                    onChange={handleSlotChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Información adicional */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Información adicional</label>
                <textarea
                  name="location.additionalInfo"
                  value={newSlot.location.additionalInfo}
                  onChange={handleSlotChange}
                  rows="2"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Instrucciones para llegar, puntos de referencia, etc."
                ></textarea>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                {editingSlot ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de horarios */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {schedule.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Día</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedule.map((slot, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {weekdays.find(day => day.id === slot.day)?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {slot.startTime} - {slot.endTime}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatLocation(slot.location)}
                      </div>
                      {slot.location?.additionalInfo && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          {slot.location.additionalInfo}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditSlot(slot)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay horarios definidos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza agregando los horarios de clase para esta materia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
