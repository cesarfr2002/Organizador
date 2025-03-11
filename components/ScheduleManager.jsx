import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM a 8 PM

export default function ScheduleManager({ subjects }) {
  const [schedule, setSchedule] = useState([]);
  
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      // Organizar las materias por día y hora para mostrarlas en el horario
      const scheduleMap = {};
      
      subjects.forEach(subject => {
        subject.schedule.forEach(slot => {
          const day = slot.day;
          const key = `${day}-${slot.startTime}`;
          
          if (!scheduleMap[key]) {
            scheduleMap[key] = [];
          }
          
          scheduleMap[key].push({
            subjectId: subject._id,
            name: subject.name,
            location: slot.location,
            startTime: slot.startTime,
            endTime: slot.endTime,
            color: subject.color
          });
        });
      });
      
      setSchedule(scheduleMap);
    }
  }, [subjects]);

  return (
    <div className="overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4">Mi Horario</h2>
      <div className="border rounded-lg shadow">
        <table className="w-full min-w-max">
          <thead>
            <tr>
              <th className="border p-2">Hora</th>
              {DAYS.map(day => (
                <th key={day} className="border p-2">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(hour => (
              <tr key={hour}>
                <td className="border p-2 text-center">
                  {`${hour}:00 - ${hour + 1}:00`}
                </td>
                {DAYS.map((_, dayIndex) => {
                  const dayKey = `${dayIndex + 1}-${hour}:00`;
                  const classes = schedule[dayKey] || [];
                  
                  return (
                    <td key={dayIndex} className="border p-0 h-16 relative">
                      {classes.map((cls, idx) => (
                        <div 
                          key={idx}
                          className="absolute inset-0 m-1 p-2 rounded overflow-hidden text-xs"
                          style={{ backgroundColor: cls.color + '40', borderLeft: `4px solid ${cls.color}` }}
                        >
                          <div className="font-bold">{cls.name}</div>
                          <div>{cls.location}</div>
                          <div>
                            {cls.startTime} - {cls.endTime}
                          </div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
