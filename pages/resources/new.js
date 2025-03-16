// Suponiendo que esta es la estructura básica de la página

export default function NewResource() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { subject: subjectId, taskId } = router.query;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchSubjects();
    }
  }, [status, router]);

  // Resto del código...

  return (
    <Layout>
      <Head>
        <title>Nuevo Recurso | UniOrganizer</title>
      </Head>

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Nuevo Recurso</h1>
        <Link href="/resources" className="text-blue-600 hover:text-blue-800 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a la lista
        </Link>
      </div>

      <ResourceForm 
        subjects={subjects}
        subjectId={subjectId} 
        taskId={taskId} // Pasar el ID de la tarea si viene de una tarea
        onSuccess={() => router.push('/resources')}
        onCancel={() => router.back()}
      />
    </Layout>
  );
}
