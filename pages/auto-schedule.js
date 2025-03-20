import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useAutoSchedule } from '../context/AutoScheduleContext';
import TimePreferenceSelector from '../components/autoSchedule/TimePreferenceSelector';
import TaskPriorityList from '../components/autoSchedule/TaskPriorityList';
import SchedulePreview from '../components/autoSchedule/SchedulePreview';
import Head from 'next/head';

export default function AutoSchedule() {
  const { user } = useAuth();
  const { 
    incompleteTasks, 
    scheduledEvents,
    timePreferences,
    setTimePreferences,
    updateTaskPriority,
    generateSchedule,
    saveSchedule
  } = useAutoSchedule();
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);
  
  const handleGenerateSchedule = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await generateSchedule();
      setActiveStep(3);
      setSuccessMessage('¡Horario generado con éxito!');
    } catch (error) {
      setErrorMessage('Error al generar el horario: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveSchedule = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await saveSchedule();
      setSuccessMessage('¡Horario guardado con éxito!');
    } catch (error) {
      setErrorMessage('Error al guardar el horario: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const steps = [
    { id: 1, name: 'Preferencias de tiempo', description: 'Establece tus horarios preferidos' },
    { id: 2, name: 'Tareas pendientes', description: 'Ajusta prioridades de tus tareas' },
    { id: 3, name: 'Vista previa', description: 'Revisa tu horario generado' },
  ];
  
  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>Programación Automática | UniOrganizer</title>
        </Head>
        
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
            Programación Automática de Tareas
          </h1>
          
          {/* Mensajes de error/éxito */}
          {errorMessage && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
              <p>{errorMessage}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
              <p>{successMessage}</p>
            </div>
          )}
          
          {/* Pasos */}
          <div className="mb-8">
            <nav aria-label="Progress">
              <ol className="flex items-center">
                {steps.map((step, stepIdx) => (
                  <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} ${stepIdx !== 0 ? 'pl-8 sm:pl-20' : ''}`}>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className={`h-0.5 w-full ${step.id < activeStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    </div>
                    <button
                      onClick={() => setActiveStep(step.id)}
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                        step.id < activeStep
                          ? 'bg-blue-600 hover:bg-blue-800'
                          : step.id === activeStep
                          ? 'bg-blue-600'
                          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                      } ${step.id <= activeStep ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      disabled={step.id > activeStep}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${step.id <= activeStep ? 'bg-white' : 'bg-gray-400 dark:bg-gray-500'}`} aria-hidden="true" />
                      <span className="sr-only">{step.name}</span>
                    </button>
                    <div className="hidden sm:block absolute bottom-8 transform -translate-x-1/2 whitespace-nowrap">
                      <span className={`text-sm font-medium ${step.id <= activeStep ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
                        {step.name}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          
          {/* Contenido de cada paso */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {activeStep === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                  Establece tus preferencias de tiempo
                </h2>
                <TimePreferenceSelector 
                  preferences={timePreferences} 
                  onChange={setTimePreferences} 
                />
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
            
            {activeStep === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                  Ajusta las prioridades de tus tareas
                </h2>
                {incompleteTasks.length > 0 ? (
                  <>
                    <TaskPriorityList 
                      tasks={incompleteTasks} 
                      onUpdatePriority={updateTaskPriority} 
                    />
                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => setActiveStep(1)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={handleGenerateSchedule}
                        disabled={isLoading}
                        className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isLoading ? 'Generando...' : 'Generar horario'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No tienes tareas pendientes para programar. Añade nuevas tareas primero.
                    </p>
                    <button
                      onClick={() => setActiveStep(1)}
                      className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                    >
                      Anterior
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {activeStep === 3 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                  Vista previa de tu horario
                </h2>
                {scheduledEvents.length > 0 ? (
                  <>
                    <SchedulePreview events={scheduledEvents} />
                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => setActiveStep(2)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={handleSaveSchedule}
                        disabled={isLoading}
                        className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isLoading ? 'Guardando...' : 'Guardar horario'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No se ha generado ningún horario aún. Vuelve al paso anterior e intenta de nuevo.
                    </p>
                    <button
                      onClick={() => setActiveStep(2)}
                      className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                    >
                      Anterior
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
