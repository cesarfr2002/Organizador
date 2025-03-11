import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' }
];

const COLORS = [
  { value: '#3182CE', label: 'Azul' },
  { value: '#E53E3E', label: 'Rojo' },
  { value: '#38A169', label: 'Verde' },
  { value: '#D69E2E', label: 'Amarillo' },
  { value: '#805AD5', label: 'Púrpura' },
  { value: '#DD6B20', label: 'Naranja' },
  { value: '#2C7A7B', label: 'Verde azulado' },
  { value: '#702459', label: 'Rosa' },
];

export default function SubjectForm({ subject, isEditing = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    color: '#3182CE',
    professor: '',
    professorContact: '',
    credits: 0,
    notes: '',
    schedule: []
  });
  const [scheduleItem, setScheduleItem] = useState({
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

  useEffect(() => {
    if (isEditing && subject) {
      setFormData(subject);
    }
  }, [subject, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    setScheduleItem(prev => {
      if (name.startsWith('location.')) {
        const locationField = name.split('.')[1];
        return {
          ...prev,
          location: {
            ...prev.location,
            [locationField]: value
          }
        };
      }
      return {
        ...prev,
        [name]: value
      };
    });
  };
  
  const addScheduleItem = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [...prev.schedule, scheduleItem]
    }));
    
    // Reset form for next item
    setScheduleItem({
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
  };
  
  const removeScheduleItem = (index) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = isEditing ? `/api/subjects/${subject._id}` : '/api/subjects';
      const method = isEditing ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar la asignatura');
      }
      
      toast.success(`Asignatura ${isEditing ? 'actualizada' : 'creada'} con éxito`);
      router.push('/subjects');
    } catch (error) {
      console.error('Error saving subject:', error);
      toast.error(error.message || 'Error al guardar la asignatura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">
        {isEditing ? 'Editar Asignatura' : 'Nueva Asignatura'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Nombre y código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
              placeholder="Nombre de la asignatura"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Código de la asignatura"
            />
          </div>
          
          {/* Color y créditos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex items-center space-x-2">
              <select
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                {COLORS.map(color => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
              <div 
                className="w-8 h-8 rounded-full border"
                style={{ backgroundColor: formData.color }}
              ></div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Créditos
            </label>
            <input
              type="number"
              name="credits"
              value={formData.credits}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              min="0"
            />
          </div>
          
          {/* Profesor e información de contacto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profesor
            </label>
            <input
              type="text"
              name="professor"
              value={formData.professor}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Nombre del profesor"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contacto del profesor
            </label>
            <input
              type="text"
              name="professorContact"
              value={formData.professorContact}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Email o teléfono"
            />
          </div>
        </div>
        
        {/* Notas adicionales */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas adicionales
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="w-full border border-gray-300 rounded-md p-2"
            placeholder="Información adicional relevante..."
          ></textarea>
        </div>
        
        {/* Horario */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Horario</h3>
          </div>
          
          {/* Listado de horarios ya agregados */}
          {formData.schedule.length > 0 && (
            <div className="mb-4">
              <ul className="divide-y divide-gray-200 border rounded-md">
                {formData.schedule.map((slot, index) => (
                  <li key={index} className="p-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {DAYS_OF_WEEK.find(d => d.value === slot.day)?.label} • {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="text-sm text-gray-500">
                        {slot.location.campus && `${slot.location.campus}, `}
                        {slot.location.building && `Edificio ${slot.location.building}, `}
                        {slot.location.floor && `Piso ${slot.location.floor}, `}
                        {slot.location.room && `Sala ${slot.location.room}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeScheduleItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Formulario para agregar nuevo horario */}
          <div className="bg-gray-50 p-4 rounded-md border">
            <h4 className="text-sm font-medium mb-3">Agregar clase al horario</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Día</label>
                <select
                  name="day"
                  value={scheduleItem.day}
                  onChange={handleScheduleChange}
                  className="w-full border border-gray-300 rounded-md p-1 text-sm"
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hora inicio</label>
                <input
                  type="time"
                  name="startTime"
                  value={scheduleItem.startTime}
                  onChange={handleScheduleChange}
                  className="w-full border border-gray-300 rounded-md p-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hora fin</label>
                <input
                  type="time"
                  name="endTime"
                  value={scheduleItem.endTime}
                  onChange={handleScheduleChange}
                  className="w-full border border-gray-300 rounded-md p-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Campus</label>
                <input
                  type="text"
                  name="location.campus"
                  value={scheduleItem.location.campus}
                  onChange={handleScheduleChange}
                  className="w-full border border-gray-300 rounded-md p-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Edificio</label>
                <input
                  type="text"
                  name="location.building"
                  value={scheduleItem.location.building}
                  onChange={handleScheduleChange}
                  className="w-full border border-gray-300 rounded-md p-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Piso</label>
                <input
                  type="text"
                  name="location.floor"
                  value={scheduleItem.location.floor}
                  onChange={handleScheduleChange}
                  className="w-full border border-gray-300 rounded-md p-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sala *</label>
                <input
                  type="text"
                  name="location.room"
                  value={scheduleItem.location.room}
                  onChange={handleScheduleChange}
                  className="w-full border border-gray-300 rounded-md p-1 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Info adicional</label>
                <input
                  type="text"
                  name="location.additionalInfo"
                  value={scheduleItem.location.additionalInfo}
                  onChange={handleScheduleChange}
                  className="w-full border border-gray-300 rounded-md p-1 text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addScheduleItem}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Agregar a horario
            </button>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
              ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : (
              isEditing ? 'Actualizar Asignatura' : 'Crear Asignatura'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
