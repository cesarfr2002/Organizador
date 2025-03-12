import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Resource from '../../../models/Resource';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  await dbConnect();
  
  // GET: Obtener recursos
  if (req.method === 'GET') {
    try {
      const { filter = 'recent', limit = 10, subject, type, important, sort = 'recent' } = req.query;
      
      let query = { userId: session.user.id };
      let sortOptions = {};
      
      // Aplicar filtros adicionales si se proporcionan
      if (subject) {
        query.subject = subject;
      }
      
      if (type && type !== 'all') {
        query.type = type;
      }
      
      if (important === 'true') {
        query.important = true;
      }
      
      if (req.query.tag) {
        query.tags = { $in: [req.query.tag] };
      }
      
      if (req.query.search) {
        query.$or = [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ];
      }
      
      // Determinar ordenamiento
      switch (sort) {
        case 'title':
          sortOptions = { title: 1 }; // Orden alfabético por título
          break;
        case 'accessed':
          sortOptions = { accessCount: -1, lastAccessed: -1 }; // Más accedidos primero
          break;
        case 'recent':
        default:
          sortOptions = { createdAt: -1 }; // Más recientes primero
          break;
      }
      
      // Si el filtro es 'important', sobreescribir la consulta
      if (filter === 'important') {
        query.important = true;
      }
      
      const page = parseInt(req.query.page) || 1;
      const pageLimit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * pageLimit;
      
      const sortField = req.query.sortField || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      // Rename this variable to avoid redefinition
      const mongoSort = { [sortField]: sortOrder };
      
      const resources = await Resource.find(query)
        .populate('subject', 'name color')
        .sort(sortOptions)
        .skip(skip)
        .limit(pageLimit);
      
      const total = await Resource.countDocuments(query);
      
      return res.status(200).json({
        resources,
        pagination: {
          total,
          page,
          limit: pageLimit,
          pages: Math.ceil(total / pageLimit)
        }
      });
    } catch (error) {
      console.error('Error fetching resources:', error);
      return res.status(500).json({ error: 'Error al obtener recursos' });
    }
  } else {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
