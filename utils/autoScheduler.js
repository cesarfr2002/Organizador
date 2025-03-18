import { addMinutes, format, isAfter, isBefore, isSameDay, startOfDay, endOfDay, parseISO, addDays } from 'date-fns';

/**
 * Generate automatic task schedule suggestions based on free time slots
 * @param {Array} classSchedule - Array of scheduled classes
 * @param {Array} tasks - Array of tasks with estimated time
 * @param {Object} options - Configuration options
 * @returns {Object} Result with success status and suggestions
 */
export function generateScheduleSuggestions(classSchedule, tasks, options = {}) {
  const {
    travelTimeBefore = 120, // 2 hours before first class
    travelTimeAfter = 120,   // 2 hours after last class
    daysToSchedule = 7,      // Number of days to schedule ahead
    minFreeTimeBlock = 30,   // Minimum minutes for a free time block
    maxDailyStudyHours = 5   // Maximum study hours per day
  } = options;
  
  console.log(`Generating schedule with options:`, {
    travelTimeBefore,
    travelTimeAfter,
    daysToSchedule,
    minFreeTimeBlock,
    maxDailyStudyHours
  });
  
  // Filter out tasks that don't have estimated time or are already completed
  const pendingTasks = tasks.filter(task => 
    task.estimatedTime > 0 && 
    !task.completed && 
    task.status !== 'completed'
  );
  
  if (pendingTasks.length === 0) {
    return { success: false, message: 'No hay tareas pendientes con tiempo estimado.' };
  }
  
  console.log(`Found ${pendingTasks.length} pending tasks with estimated time`);
  
  try {
    // Ensure class schedule items have proper date objects
    const normalizedSchedule = normalizeClassSchedule(classSchedule);
    
    // Group the class schedule by day
    const scheduleByDay = groupScheduleByDay(normalizedSchedule);
    
    // Generate free time slots for each day
    const freeTimeSlots = generateFreeTimeSlots(
      scheduleByDay, 
      { travelTimeBefore, travelTimeAfter, daysToSchedule, minFreeTimeBlock }
    );
    
    if (freeTimeSlots.length === 0) {
      return { 
        success: false, 
        message: 'No se encontraron espacios libres para programar tareas.' 
      };
    }
    
    console.log(`Found ${freeTimeSlots.length} free time slots across ${daysToSchedule} days`);
    
    // Sort tasks by priority and due date
    const sortedTasks = sortTasksByPriority(pendingTasks);
    
    // Generate schedule suggestions
    const scheduleSuggestions = assignTasksToTimeSlots(
      sortedTasks, 
      freeTimeSlots, 
      { maxDailyStudyHours }
    );
    
    return {
      success: true,
      suggestions: scheduleSuggestions,
      unscheduledTasks: sortedTasks.filter(
        task => !scheduleSuggestions.some(s => s.taskId === task._id)
      )
    };
  } catch (error) {
    console.error('Error generating schedule suggestions:', error);
    return { 
      success: false, 
      message: 'Error al generar sugerencias de horario: ' + error.message 
    };
  }
}

/**
 * Normalize class schedule items to ensure they have proper date objects
 */
function normalizeClassSchedule(classSchedule) {
  return classSchedule.map(classItem => {
    // If no date property exists or it's invalid, skip this item
    if (!classItem.date) return null;
    
    // Ensure date is a proper Date object
    const classDate = classItem.date instanceof Date 
      ? classItem.date 
      : new Date(classItem.date);
    
    // Skip invalid dates
    if (isNaN(classDate.getTime())) return null;
    
    // Calculate start and end time as Date objects
    let startDateTime, endDateTime;
    
    if (classItem.startDateTime) {
      startDateTime = new Date(classItem.startDateTime);
    } else if (classItem.startTime) {
      startDateTime = parseTimeString(classItem.startTime, classDate);
    } else {
      return null; // Skip items without start time
    }
    
    if (classItem.endDateTime) {
      endDateTime = new Date(classItem.endDateTime);
    } else if (classItem.endTime) {
      endDateTime = parseTimeString(classItem.endTime, classDate);
    } else {
      return null; // Skip items without end time
    }
    
    return {
      ...classItem,
      date: classDate,
      startDateTime,
      endDateTime
    };
  }).filter(Boolean); // Remove any null items
}

/**
 * Group class schedule by day
 */
function groupScheduleByDay(classSchedule) {
  const scheduleByDay = {};
  
  classSchedule.forEach(classItem => {
    const dayKey = format(classItem.date, 'yyyy-MM-dd');
    
    if (!scheduleByDay[dayKey]) {
      scheduleByDay[dayKey] = [];
    }
    
    scheduleByDay[dayKey].push(classItem);
  });
  
  // Sort each day's classes by start time
  Object.keys(scheduleByDay).forEach(day => {
    scheduleByDay[day].sort((a, b) => a.startDateTime - b.startDateTime);
  });
  
  return scheduleByDay;
}

/**
 * Generate free time slots for the specified number of days
 */
function generateFreeTimeSlots(scheduleByDay, options) {
  const { travelTimeBefore, travelTimeAfter, daysToSchedule, minFreeTimeBlock } = options;
  const freeTimeSlots = [];
  
  // Get current date and time
  const now = new Date();
  const currentDay = startOfDay(now);
  
  for (let i = 0; i < daysToSchedule; i++) {
    // Get date for the current iteration day
    const date = addDays(currentDay, i);
    const dayKey = format(date, 'yyyy-MM-dd');
    
    // Get classes for the current day
    const dayClasses = scheduleByDay[dayKey] || [];
    
    // Find free time slots for the day
    const daySlotsInfo = findFreeTimeSlotsForDay(
      date, 
      dayClasses, 
      { 
        travelTimeBefore, 
        travelTimeAfter, 
        minFreeTimeBlock, 
        currentTime: now 
      }
    );
    
    // Add to total free time slots with additional metadata
    freeTimeSlots.push(...daySlotsInfo.freeSlots.map(slot => ({ 
      ...slot, 
      date,
      dayIndex: i, // Add day index for prioritization
      dayKey
    })));
  }
  
  return freeTimeSlots;
}

/**
 * Find free time slots for a given day
 */
function findFreeTimeSlotsForDay(date, dayClasses, options) {
  const { travelTimeBefore, travelTimeAfter, minFreeTimeBlock, currentTime } = options;
  
  // Create beginning and end of day times
  const dayStart = new Date(date);
  dayStart.setHours(6, 0, 0, 0); // Start day at 6 AM
  
  const dayEnd = new Date(date);
  dayEnd.setHours(22, 0, 0, 0); // End day at 10 PM
  
  // For today, adjust dayStart to be the current time if it's after 6 AM
  const isToday = isSameDay(date, currentTime);
  if (isToday && isAfter(currentTime, dayStart)) {
    // Add 15 minute buffer to current time to avoid immediate scheduling
    const adjustedCurrentTime = new Date(currentTime);
    adjustedCurrentTime.setMinutes(adjustedCurrentTime.getMinutes() + 15);
    dayStart.setTime(adjustedCurrentTime.getTime());
  }
  
  // If current time is already past dayEnd, return no free slots for today
  if (isToday && isAfter(currentTime, dayEnd)) {
    return {
      freeSlots: [],
      totalFreeTime: 0
    };
  }
  
  // If there are no classes, the entire day is free
  if (!dayClasses.length) {
    return {
      freeSlots: [{
        start: dayStart,
        end: dayEnd,
        duration: (dayEnd - dayStart) / (1000 * 60) // duration in minutes
      }],
      totalFreeTime: (dayEnd - dayStart) / (1000 * 60)
    };
  }
  
  // Create busy periods from classes and travel times
  const busyPeriods = createBusyPeriods(dayClasses, { travelTimeBefore, travelTimeAfter });
  
  // Find free time between busy periods
  const freeSlots = findFreeBetweenBusyPeriods(
    dayStart, 
    dayEnd, 
    busyPeriods,
    { minFreeTimeBlock, currentTime, isToday }
  );
  
  // Calculate total free time
  const totalFreeTime = freeSlots.reduce((sum, slot) => sum + slot.duration, 0);
  
  return { 
    freeSlots, 
    totalFreeTime 
  };
}

/**
 * Create busy periods from classes and travel times
 */
function createBusyPeriods(dayClasses, { travelTimeBefore, travelTimeAfter }) {
  if (!dayClasses.length) return [];
  
  // Sort classes by start time
  const sortedClasses = [...dayClasses].sort((a, b) => 
    a.startDateTime - b.startDateTime
  );
  
  const busyPeriods = [];
  
  // Find the first and last class of the day
  const firstClass = sortedClasses[0];
  const lastClass = sortedClasses[sortedClasses.length - 1];
  
  // Add travel time before first class
  const travelBeforeStart = new Date(firstClass.startDateTime);
  travelBeforeStart.setMinutes(travelBeforeStart.getMinutes() - travelTimeBefore);
  
  busyPeriods.push({
    start: travelBeforeStart,
    end: firstClass.startDateTime,
    type: 'travel-to'
  });
  
  // Add all classes
  sortedClasses.forEach(cls => {
    busyPeriods.push({
      start: cls.startDateTime,
      end: cls.endDateTime,
      type: 'class'
    });
  });
  
  // Add travel time after last class
  const travelAfterEnd = new Date(lastClass.endDateTime);
  travelAfterEnd.setMinutes(travelAfterEnd.getMinutes() + travelTimeAfter);
  
  busyPeriods.push({
    start: lastClass.endDateTime,
    end: travelAfterEnd,
    type: 'travel-from'
  });
  
  // Add travel times between consecutive classes if the gap is large enough
  for (let i = 0; i < sortedClasses.length - 1; i++) {
    const currentClass = sortedClasses[i];
    const nextClass = sortedClasses[i + 1];
    
    // Calculate minutes between end of current class and start of next class
    const gapMinutes = (nextClass.startDateTime - currentClass.endDateTime) / (1000 * 60);
    
    // If there's more than 30 minutes between classes, add travel times
    if (gapMinutes > 30) {
      // Calculate travel time (up to 30 minutes each way)
      const maxTravelTime = Math.min(30, gapMinutes / 3);
      
      // Add travel time after current class
      const travelAfterCurrentStart = new Date(currentClass.endDateTime);
      const travelAfterCurrentEnd = new Date(currentClass.endDateTime);
      travelAfterCurrentEnd.setMinutes(travelAfterCurrentEnd.getMinutes() + maxTravelTime);
      
      busyPeriods.push({
        start: travelAfterCurrentStart,
        end: travelAfterCurrentEnd,
        type: 'travel-between'
      });
      
      // Add travel time before next class
      const travelBeforeNextStart = new Date(nextClass.startDateTime);
      travelBeforeNextStart.setMinutes(travelBeforeNextStart.getMinutes() - maxTravelTime);
      
      busyPeriods.push({
        start: travelBeforeNextStart,
        end: nextClass.startDateTime,
        type: 'travel-between'
      });
    }
  }
  
  // Sort busy periods by start time and merge overlapping periods
  const mergedPeriods = mergeOverlappingPeriods(
    busyPeriods.sort((a, b) => a.start - b.start)
  );

  // Debug information
  console.log('First class:', firstClass.startDateTime, '-', firstClass.endDateTime);
  console.log('Last class:', lastClass.startDateTime, '-', lastClass.endDateTime);
  console.log('Travel before first class:', travelBeforeStart, '-', firstClass.startDateTime);
  console.log('Travel after last class:', lastClass.endDateTime, '-', travelAfterEnd);
  
  return mergedPeriods;
}

/**
 * Merge overlapping busy periods
 */
function mergeOverlappingPeriods(periods) {
  if (!periods.length) return [];
  
  const result = [periods[0]];
  
  for (let i = 1; i < periods.length; i++) {
    const current = periods[i];
    const previous = result[result.length - 1];
    
    // Check if current period overlaps with previous or is adjacent to it
    // We consider periods adjacent if they're within 1 minute of each other
    const isOverlapping = current.start <= new Date(previous.end.getTime() + 60000);
    
    if (isOverlapping) {
      // Merge periods by extending end time if needed
      if (current.end > previous.end) {
        previous.end = current.end;
      }
      
      // Combine types
      if (previous.type !== current.type) {
        previous.type = 'mixed';
      }
    } else {
      // No overlap, add as a new period
      result.push(current);
    }
  }
  
  return result;
}

/**
 * Find free time between busy periods
 */
function findFreeBetweenBusyPeriods(dayStart, dayEnd, busyPeriods, options) {
  const { minFreeTimeBlock, currentTime, isToday } = options;
  const freeSlots = [];
  
  // If no busy periods, the entire day is free
  if (!busyPeriods.length) {
    const duration = (dayEnd - dayStart) / (1000 * 60);
    if (duration >= minFreeTimeBlock) {
      freeSlots.push({
        start: dayStart,
        end: dayEnd,
        duration
      });
    }
    return freeSlots;
  }
  
  // Debug info - log all busy periods
  busyPeriods.forEach((period, index) => {
    console.log(`Busy period ${index}: ${format(period.start, 'HH:mm')} - ${format(period.end, 'HH:mm')} (${period.type})`);
  });
  
  // Check for free time at the start of the day
  if (dayStart < busyPeriods[0].start) {
    const duration = (busyPeriods[0].start - dayStart) / (1000 * 60);
    if (duration >= minFreeTimeBlock) {
      freeSlots.push({
        start: dayStart,
        end: busyPeriods[0].start,
        duration
      });
    }
  }
  
  // Find free time between busy periods
  for (let i = 0; i < busyPeriods.length - 1; i++) {
    const current = busyPeriods[i];
    const next = busyPeriods[i + 1];
    
    if (current.end < next.start) {
      const duration = (next.start - current.end) / (1000 * 60);
      if (duration >= minFreeTimeBlock) {
        freeSlots.push({
          start: current.end,
          end: next.start,
          duration
        });
      }
    }
  }
  
  // Check for free time at the end of the day
  const lastBusy = busyPeriods[busyPeriods.length - 1];
  if (lastBusy.end < dayEnd) {
    const duration = (dayEnd - lastBusy.end) / (1000 * 60);
    if (duration >= minFreeTimeBlock) {
      freeSlots.push({
        start: lastBusy.end,
        end: dayEnd,
        duration
      });
    }
  }
  
  // For today, filter out any free slots that are in the past
  let validSlots = freeSlots;
  if (isToday) {
    validSlots = freeSlots.filter(slot => isAfter(slot.end, currentTime));
  }
  
  // Debug info - log all free slots
  validSlots.forEach((slot, index) => {
    console.log(`Free slot ${index}: ${format(slot.start, 'HH:mm')} - ${format(slot.end, 'HH:mm')} (${slot.duration} min)`);
  });
  
  return validSlots;
}

/**
 * Sort tasks by priority and due date
 */
function sortTasksByPriority(tasks) {
  return [...tasks].sort((a, b) => {
    // First by priority (High to Low)
    const priorityScore = getPriorityScore(b.priority) - getPriorityScore(a.priority);
    if (priorityScore !== 0) return priorityScore;
    
    // Then by due date (Closest first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    
    // Tasks with due dates come before tasks without due dates
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    
    return 0;
  });
}

/**
 * Assign tasks to available time slots
 */
function assignTasksToTimeSlots(tasks, timeSlots, options) {
  const { maxDailyStudyHours } = options;
  
  // Track study minutes per day
  const dailyStudyMinutes = {};
  
  // Track scheduled tasks
  const scheduledTaskIds = new Set();
  
  // Result array
  const scheduleSuggestions = [];
  
  // Clone tasks
  const remainingTasks = [...tasks];
  
  // Settings for spacing
  const MIN_BREAK = 15;  // Minimum break between tasks (minutes)
  const MAX_CONSECUTIVE = 2;  // Maximum consecutive tasks per slot
  
  // Sort time slots by day (closest first) and start time
  const sortedSlots = [...timeSlots].sort((a, b) => {
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
    return a.start - b.start;
  });
  
  // Process each time slot
  for (const slot of sortedSlots) {
    const dayKey = slot.dayKey;
    if (!dailyStudyMinutes[dayKey]) {
      dailyStudyMinutes[dayKey] = 0;
    }
    
    // Maximum daily study minutes
    const maxDailyMinutes = maxDailyStudyHours * 60;
    
    // Skip if daily limit reached
    const remainingDailyMinutes = maxDailyMinutes - dailyStudyMinutes[dayKey];
    if (remainingDailyMinutes <= 0) continue;
    
    // Available minutes is the minimum of slot duration and remaining daily limit
    let availableMinutes = Math.min(slot.duration, remainingDailyMinutes);
    
    // Starting time for this slot
    let currentTime = new Date(slot.start);
    
    // Limit consecutive tasks per slot
    let consecutiveTasks = 0;
    
    // Try to assign tasks to this slot
    let i = 0;
    while (
      i < remainingTasks.length && 
      availableMinutes >= MIN_BREAK && 
      consecutiveTasks < MAX_CONSECUTIVE
    ) {
      const task = remainingTasks[i];
      
      // Skip already scheduled tasks
      if (scheduledTaskIds.has(task._id)) {
        i++;
        continue;
      }
      
      // Calculate how much time we need (task time + break)
      const timeNeeded = task.estimatedTime + MIN_BREAK;
      
      // If task fits in available time
      if (task.estimatedTime && task.estimatedTime <= availableMinutes) {
        // Calculate end time
        const endTime = new Date(currentTime);
        endTime.setMinutes(endTime.getMinutes() + task.estimatedTime);
        
        // Schedule the task
        scheduleSuggestions.push({
          taskId: task._id,
          title: task.title,
          startTime: new Date(currentTime),
          endTime: endTime,
          duration: task.estimatedTime,
          subject: task.subject,
          priority: task.priority,
          dayKey: dayKey
        });
        
        // Update tracking
        scheduledTaskIds.add(task._id);
        dailyStudyMinutes[dayKey] += task.estimatedTime;
        
        // Update current time (add task time + break)
        currentTime = new Date(endTime);
        currentTime.setMinutes(currentTime.getMinutes() + MIN_BREAK);
        
        // Reduce available minutes
        availableMinutes -= timeNeeded;
        
        // Remove task from remaining list
        remainingTasks.splice(i, 1);
        
        // Increment consecutive task counter
        consecutiveTasks++;
      } else {
        // Try next task
        i++;
      }
    }
  }
  
  // Second pass: Try to fit any remaining tasks
  if (remainingTasks.length > 0) {
    for (const slot of sortedSlots) {
      // Skip slots that already have MAX_CONSECUTIVE tasks
      const tasksInSlot = scheduleSuggestions.filter(
        s => s.dayKey === slot.dayKey && 
             s.startTime >= slot.start && 
             s.endTime <= slot.end
      );
      
      if (tasksInSlot.length >= MAX_CONSECUTIVE) continue;
      
      const dayKey = slot.dayKey;
      
      // Skip if daily limit reached
      const maxDailyMinutes = maxDailyStudyHours * 60;
      const dailyMinutes = dailyStudyMinutes[dayKey] || 0;
      const remainingDailyMinutes = maxDailyMinutes - dailyMinutes;
      
      if (remainingDailyMinutes <= 0) continue;
      
      // Find where we can start in this slot
      let startTime = new Date(slot.start);
      
      if (tasksInSlot.length > 0) {
        const lastTask = tasksInSlot.reduce(
          (latest, task) => task.endTime > latest.endTime ? task : latest, 
          tasksInSlot[0]
        );
        
        startTime = new Date(lastTask.endTime);
        startTime.setMinutes(startTime.getMinutes() + MIN_BREAK);
      }
      
      // If start time is after slot end, skip
      if (startTime >= slot.end) continue;
      
      // Calculate available minutes
      const slotMinutesLeft = (slot.end - startTime) / (1000 * 60);
      const availableMinutes = Math.min(slotMinutesLeft, remainingDailyMinutes);
      
      // Try to fit any small tasks
      for (let i = 0; i < remainingTasks.length; i++) {
        const task = remainingTasks[i];
        
        if (scheduledTaskIds.has(task._id)) continue;
        
        if (task.estimatedTime && task.estimatedTime <= availableMinutes) {
          // Calculate end time
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + task.estimatedTime);
          
          // Schedule the task
          scheduleSuggestions.push({
            taskId: task._id,
            title: task.title,
            startTime: new Date(startTime),
            endTime: endTime,
            duration: task.estimatedTime,
            subject: task.subject,
            priority: task.priority,
            dayKey: dayKey
          });
          
          scheduledTaskIds.add(task._id);
          if (!dailyStudyMinutes[dayKey]) dailyStudyMinutes[dayKey] = 0;
          dailyStudyMinutes[dayKey] += task.estimatedTime;
          
          // Remove task from remaining list
          remainingTasks.splice(i, 1);
          
          // Only fit one task per slot in second pass
          break;
        }
      }
    }
  }
  
  // Sort final suggestions by date and time
  return scheduleSuggestions.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Helper function to convert time string (HH:MM) to Date object
 */
function parseTimeString(timeString, dateObj) {
  if (!timeString || !dateObj) return null;
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    
    const result = new Date(dateObj);
    result.setHours(hours, minutes, 0, 0);
    return result;
  } catch (error) {
    console.error('Error parsing time string:', error);
    return null;
  }
}

/**
 * Get numerical score for priority sorting
 */
function getPriorityScore(priority) {
  switch (priority) {
    case 'Alta': return 3;
    case 'Media': return 2;
    case 'Baja': return 1;
    default: return 0;
  }
}
