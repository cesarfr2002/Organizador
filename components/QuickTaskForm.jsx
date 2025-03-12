import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';

// Registrar el locale español
registerLocale('es', es);

export default function QuickTaskForm({ onSuccess }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    dueDate: '',
    priority: 2, // Prioridad media por defecto
  });

  // Cargar asignaturas cuando se monta el componente
  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubjects();
    }
  }, [status]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      } else {
        console.error('Error fetching subjects:', await res.text());
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      dueDate: date
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('El título de la tarea es obligatorio');
      return;
    }
    
    setLoading(true);
    
    try {
      // Asegurar que tenemos una sesión válida antes de enviar la solicitud
      if (!session || status !== 'authenticated') {
        throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Incluir explícitamente el token de autorización si es necesario
          // 'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al guardar la tarea');
      }
      
      toast.success('Tarea creada correctamente');
      
      // Resetear el formulario
      setFormData({
        title: '',
        subject: '',
        dueDate: '',
        priority: 2,
      });
      
      // Ejecutar callback de éxito si se proporciona
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Error saving task:', error);
      
      // Mensaje específico para error 401
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        // Opcionalmente redirigir al login
        setTimeout(() => router.push('/login'), 2000);
      } else {
        toast.error('Error al guardar la tarea: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">Crear Tarea Rápida</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Campos mínimos */}
        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
              placeholder="Título de la tarea"
              autoFocus
            />
          </div>
          
          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Descripción breve..."
            ></textarea>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Asignatura */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asignatura
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">-- Sin asignatura --</option>
                {subjects?.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Fecha de entrega */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha límite
              </label>
              <DatePicker
                selected={formData.dueDate}
                onChange={handleDateChange}
                className="w-full border border-gray-300 rounded-md p-2"
                dateFormat="dd/MM/yyyy"
                locale="es"
                placeholderText="Seleccionar fecha"
                isClearable
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Dificultad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dificultad
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="fácil">Fácil</option>
                <option value="media">Media</option>
                <option value="difícil">Difícil</option>
              </select>
            </div>
            
            {/* Prioridad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 mt-6">
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
            ) : 'Crear Tarea'}
          </button>
        </div>
      </form>
    </div>
  );
}
