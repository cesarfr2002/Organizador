import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import Image from 'next/image';

export default function NoteEditor({ noteId }) {
  const router = useRouter();
  const [note, setNote] = useState({
    title: '',
    content: '',
    subject: '',
    tags: [],
    images: [],
    relatedTasks: [] // Añadimos campo para tareas relacionadas
  });
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]); // Lista de tareas disponibles
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const textAreaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSubjects();
    fetchTasks(); // Cargar tareas disponibles
    
    if (noteId) {
      fetchNote();
    } else if (router.query.taskId) {
      // Si se está creando una nota desde una tarea, pre-seleccionar la tarea
      setNote(prevNote => ({
        ...prevNote,
        relatedTasks: [router.query.taskId]
      }));
    }
  }, [noteId, router.query.taskId]);

  useEffect(() => {
    if (note.content) {
      const words = note.content.trim().split(/\s+/).length;
      const chars = note.content.length;
      setWordCount(words);
      setCharCount(chars);
    } else {
      setWordCount(0);
      setCharCount(0);
    }
  }, [note.content]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      // Obtenemos solo tareas pendientes para relacionar
      const res = await fetch('/api/tasks?completed=false');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchNote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`);
      const data = await res.json();
      setNote(data);
    } catch (error) {
      console.error('Error fetching note:', error);
      toast.error('No se pudo cargar la nota');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNote(prevNote => ({
      ...prevNote,
      [name]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !note.tags.includes(newTag.trim())) {
      setNote(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Función para manejar pegado de imágenes
  const handlePaste = async (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let imageFile = null;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        imageFile = items[i].getAsFile();
        break;
      }
    }

    if (imageFile) {
      await uploadImage(imageFile);
    }
  };

  // Función para manejar la subida de imágenes
  const uploadImage = async (file) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al subir imagen');
      }

      const data = await response.json();
      
      // Añadir la imagen a la lista
      setNote(prev => ({
        ...prev,
        images: [...prev.images, data.imageUrl]
      }));
      
      // Insertar referencia de la imagen en el contenido
      const textarea = textAreaRef.current;
      const imageMarkdown = `![imagen](${data.imageUrl})`;
      const startPos = textarea.selectionStart;
      
      setNote(prev => ({
        ...prev,
        content: 
          prev.content.substring(0, startPos) + 
          imageMarkdown + 
          prev.content.substring(startPos)
      }));

      toast.success('Imagen subida correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadImage(file);
      // Resetear el input de archivo
      e.target.value = null;
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  // Funciones para insertar formato en el texto
  const insertFormat = (format) => {
    const textarea = textAreaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const selectedText = note.content.substring(startPos, endPos);
    let formattedText = '';
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'texto en negrita'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'texto en cursiva'}*`;
        break;
      case 'heading':
        formattedText = `## ${selectedText || 'Encabezado'}`;
        break;
      case 'code':
        formattedText = `\`\`\`\n${selectedText || 'código'}\n\`\`\``;
        break;
      case 'link':
        formattedText = `[${selectedText || 'enlace'}](url)`;
        break;
      case 'list':
        formattedText = `\n- ${selectedText || 'Elemento de lista'}\n- Otro elemento\n`;
        break;
      case 'checklist':
        formattedText = `\n- [ ] ${selectedText || 'Tarea por hacer'}\n- [x] Tarea completada\n`;
        break;
      case 'quote':
        formattedText = `\n> ${selectedText || 'Cita'}\n`;
        break;
      case 'table':
        formattedText = `\n| Columna 1 | Columna 2 |\n| --------- | --------- |\n|           |           |\n`;
        break;
      case 'highlight':
        formattedText = `==${selectedText || 'texto resaltado'}==`;
        break;
      case 'math':
        formattedText = `\n$$\n${selectedText || 'E=mc^2'}\n$$\n`;
        break;
      default:
        formattedText = selectedText;
    }
    
    setNote(prev => ({
      ...prev,
      content: 
        prev.content.substring(0, startPos) + 
        formattedText + 
        prev.content.substring(endPos)
    }));
    
    // Mantener el foco en el textarea después de insertar
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = startPos + formattedText.length;
      textarea.selectionEnd = startPos + formattedText.length;
    }, 0);
  };

  const applyTemplate = (template) => {
    const templates = {
      apuntes: `# Apuntes de Clase \n\n**Fecha:** ${new Date().toLocaleDateString()}\n**Asignatura:** ${
        subjects.find(s => s._id === note.subject)?.name || '[Asignatura]'
      }\n\n## Temas principales\n\n- \n- \n- \n\n## Conceptos clave\n\n- \n\n## Preguntas y dudas\n\n- \n\n## Tareas asignadas\n\n- [ ] \n\n## Bibliografía\n\n- `,
      
      resumen: `# Resumen: [Título]\n\n## Conceptos fundamentales\n\n## Definiciones importantes\n\n## Fórmulas y ecuaciones\n\n## Ideas principales\n\n## Ejemplos\n\n## Conclusiones\n\n`,
      
      tarea: `# Tarea: [Título]\n\n**Fecha de entrega:** [Fecha]\n**Asignatura:** ${
        subjects.find(s => s._id === note.subject)?.name || '[Asignatura]'
      }\n\n## Objetivos\n\n- \n\n## Desarrollo\n\n\n## Conclusiones\n\n## Referencias\n\n- `,
      
      examen: `# Preparación para examen\n\n**Fecha del examen:** [Fecha]\n**Asignatura:** ${
        subjects.find(s => s._id === note.subject)?.name || '[Asignatura]'
      }\n\n## Temas a estudiar\n\n- \n- \n- \n\n## Conceptos clave\n\n- \n\n## Ejercicios de práctica\n\n1. \n\n## Material de referencia\n\n- \n\n## Plan de estudio\n\n- [ ] Día 1: \n- [ ] Día 2: \n- [ ] Día 3: \n`
    };
    
    setNote(prev => ({
      ...prev,
      content: templates[template]
    }));
    
    setShowTemplates(false);
  };

  const saveNote = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = noteId ? `/api/notes/${noteId}` : '/api/notes';
      const method = noteId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(note)
      });
      
      if (res.ok) {
        toast.success('Nota guardada correctamente');
        if (!noteId) {
          router.push('/notes');
        }
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Error al guardar la nota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <form onSubmit={saveNote}>
        {/* Botón para mostrar plantillas */}
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            {showTemplates ? 'Ocultar plantillas' : 'Usar plantilla'}
          </button>
        </div>
        
        {/* Panel de plantillas */}
        {showTemplates && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium mb-2 text-blue-800">Plantillas de notas</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyTemplate('apuntes')}
                className="p-2 bg-white border border-blue-200 rounded hover:bg-blue-100 text-left text-sm"
              >
                <div className="font-medium">Apuntes de clase</div>
                <div className="text-xs text-gray-500">Estructura para tomar apuntes durante una clase</div>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('resumen')}
                className="p-2 bg-white border border-blue-200 rounded hover:bg-blue-100 text-left text-sm"
              >
                <div className="font-medium">Resumen de tema</div>
                <div className="text-xs text-gray-500">Formato para resumir temas clave</div>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('tarea')}
                className="p-2 bg-white border border-blue-200 rounded hover:bg-blue-100 text-left text-sm"
              >
                <div className="font-medium">Tarea o proyecto</div>
                <div className="text-xs text-gray-500">Estructura para desarrollar una tarea</div>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('examen')}
                className="p-2 bg-white border border-blue-200 rounded hover:bg-blue-100 text-left text-sm"
              >
                <div className="font-medium">Preparación para examen</div>
                <div className="text-xs text-gray-500">Plan para estudiar para un examen</div>
              </button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            name="title"
            value={note.title}
            onChange={handleChange}
            placeholder="Título de la nota"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <div className="mb-4">
          <select
            name="subject"
            value={note.subject}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Selecciona una asignatura</option>
            {subjects.map(subject => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex mb-4 gap-2">
          <button
            type="button"
            className={`px-4 py-2 rounded ${!previewMode ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setPreviewMode(false)}
          >
            Editar
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded ${previewMode ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setPreviewMode(true)}
          >
            Vista previa
          </button>
        </div>

        {/* Toolbar de formato */}
        {!previewMode && (
          <div className="flex flex-wrap gap-1 mb-2 p-1 border-b sticky top-0 bg-white z-10">
            <button 
              type="button" 
              onClick={() => insertFormat('bold')}
              className="p-1 hover:bg-gray-100 rounded"
              title="Texto en negrita"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              </svg>
            </button>
            <button 
              type="button" 
              onClick={() => insertFormat('italic')}
              className="p-1 hover:bg-gray-100 rounded"
              title="Texto en cursiva"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="4" x2="10" y2="4"></line>
                <line x1="14" y1="20" x2="5" y2="20"></line>
                <line x1="15" y1="4" x2="9" y2="20"></line>
              </svg>
            </button>
            <button 
              type="button" 
              onClick={() => insertFormat('heading')}
              className="p-1 hover:bg-gray-100 rounded"
              title="Encabezado"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12h16"></path>
                <path d="M4 18h16"></path>
                <path d="M4 6h16"></path>
              </svg>
            </button>
            <button 
              type="button" 
              onClick={() => insertFormat('list')}
              className="p-1 hover:bg-gray-100 rounded"
              title="Lista"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
            <button 
              type="button" 
              onClick={() => insertFormat('checklist')}
              className="p-1 hover:bg-gray-100 rounded"
              title="Lista de verificación"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
            </button>
            <button 
              type="button" 
              onClick={() => insertFormat('code')}
              className="p-1 hover:bg-gray-100 rounded"
              title="Bloque de código"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </button>
            <button 
              type="button" 
              onClick={() => insertFormat('link')}
              className="p-1 hover:bg-gray-100 rounded"
              title="Enlace"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </button>
            <button 
              type="button" 
              onClick={() => insertFormat('quote')}
              className="p-1 hover:bg-gray-100 rounded"
              title="Cita"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
              </svg>
            </button>
            <button 
              type="button" 
              onClick={triggerFileInput}
              className="p-1 hover:bg-gray-100 rounded"
              title="Insertar imagen"
              disabled={uploadingImage}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              {uploadingImage && <span className="ml-1 animate-pulse">...</span>}
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <button 
              type="button" 
              onClick={() => insertFormat('table')}
              className="p-1 hover:bg-gray-100 rounded"
              title="Insertar tabla"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button 
              type="button" 
              onClick={() => insertFormat('highlight')}
              className="p-1 hover:bg-gray-100 rounded"
              title="Texto resaltado"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button 
              type="button" 
              onClick={() => insertFormat('math')}
              className="p-1 hover:bg-gray-100 rounded"
              title="Ecuación matemática"
            >
              <span className="font-bold">∑</span>
            </button>
          </div>
        )}

        {!previewMode ? (
          <textarea
            ref={textAreaRef}
            name="content"
            value={note.content}
            onChange={handleChange}
            onPaste={handlePaste}
            placeholder="Contenido de la nota (soporta Markdown). Puedes pegar imágenes directamente."
            className="w-full h-64 px-3 py-2 border rounded-md font-mono"
          />
        ) : (
          <div 
            className="w-full h-64 px-3 py-2 border rounded-md overflow-auto prose prose-img:max-w-full"
            dangerouslySetInnerHTML={{ __html: marked(note.content) }}
          />
        )}

        {/* Contador de palabras */}
        <div className="flex justify-end text-xs text-gray-500 mt-1 mb-4">
          <span>{wordCount} palabras</span>
          <span className="mx-2">|</span>
          <span>{charCount} caracteres</span>
          <span className="mx-2">|</span>
          <span>{Math.max(1, Math.ceil(wordCount / 200))} min lectura</span>
        </div>

        <div className="mt-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ',') && newTag.trim()) {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Añadir etiqueta"
              className="px-3 py-2 border rounded-md flex-grow"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Añadir
            </button>
          </div>
          
          {/* Sugerencias de etiquetas */}
          {newTag.trim().length > 1 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {['estudio', 'importante', 'examen', 'duda', 'proyecto'].filter(tag => 
                tag.includes(newTag.trim().toLowerCase()) && !note.tags.includes(tag)
              ).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setNote({
                      ...note, 
                      tags: [...note.tags, tag]
                    });
                    setNewTag('');
                  }}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {note.tags && note.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-200 px-2 py-1 rounded-full text-sm flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-red-500 font-bold"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Sección para seleccionar tareas relacionadas - añadir antes del botón de guardar */}
        <div className="mt-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vincular con tareas
          </label>
          <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task._id} className="flex items-start">
                    <input
                      type="checkbox"
                      id={`task-${task._id}`}
                      checked={note.relatedTasks?.includes(task._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNote({
                            ...note, 
                            relatedTasks: [...(note.relatedTasks || []), task._id]
                          });
                        } else {
                          setNote({
                            ...note, 
                            relatedTasks: (note.relatedTasks || []).filter(id => id !== task._id)
                          });
                        }
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`task-${task._id}`} className="ml-2 block cursor-pointer">
                      <div className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.subject && (
                          <span 
                            className="px-2 py-0.5 text-xs rounded-full" 
                            style={{ 
                              backgroundColor: `${task.subject.color}20`,
                              color: task.subject.color 
                            }}
                          >
                            {task.subject.name}
                          </span>
                        )}
                        {task.priority && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            task.priority === 'Alta' ? 'bg-red-100 text-red-800' : 
                            task.priority === 'Media' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                            {new Date(task.dueDate).toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-2">No hay tareas disponibles para vincular</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-600"
          >
            {loading ? 'Guardando...' : noteId ? 'Actualizar nota' : 'Guardar nota'}
          </button>
        </div>
      </form>
    </div>
  );
}
