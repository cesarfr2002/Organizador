// Suponiendo que esta es la estructura básica de la página

export default function EditResource() {
  // Código existente...

  // En la función fetchResource, después de obtener los datos del recurso:
  const fetchResource = async () => {
    try {
      const res = await fetch(`/api/resources/${id}`);
      if (res.ok) {
        const data = await res.json();
        setResource(data);
        
        // También cargar las tareas relacionadas si es necesario
        try {
          const tasksRes = await fetch(`/api/resources/${id}/tasks`);
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            // Almacenar las tareas relacionadas en el recurso
            setResource(prev => ({
              ...prev,
              relatedTasks: tasksData.map(task => task._id)
            }));
          }
        } catch (error) {
          console.error('Error fetching related tasks:', error);
        }
      } else {
        throw new Error('Error al cargar el recurso');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('No se pudo cargar el recurso');
      router.push('/resources');
    } finally {
      setLoading(false);
    }
  };

  // Resto del código...

  return (
    <Layout>
      {/* Código existente... */}
      
      <ResourceForm 
        subjects={subjects}
        resource={resource}
        onSuccess={() => router.push('/resources')}
        onCancel={() => router.back()}
      />
    </Layout>
  );
}
