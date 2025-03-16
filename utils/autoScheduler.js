import { addMinutes, format, isAfter, isBefore, isSameDay, startOfDay, endOfDay, parseISO } from 'date-fns';

/**
 * Generate automatic task schedule suggestions based on free time slots
 * @param {Array} classSchedule - Array of scheduled classes
 * @param {Array} tasks - Array of tasks with estimated time
 * @param {Object} options - Configuration options
 * @returns {Array} Array of suggested schedules
 */
export function generateScheduleSuggestions(classSchedule, tasks, options = {}) {
  const {
    travelTimeBefore = 120, // 2 hours before first class
    travelTimeAfter = 120,   // 2 hours after last class
    daysToSchedule = 7,      // Number of days to schedule ahead
    minFreeTimeBlock = 30,   // Minimum minutes for a free time block
    maxDailyStudyHours = 5   // Maximum study hours per day
  } = options;
  
  // Filter out tasks that don't have estimated time or are already completed
  const pendingTasks = tasks.filter(task => 
    task.estimatedTime > 0 && 
    !task.completed
  );
  
  if (pendingTasks.length === 0) {
    return { success: false, message: 'No hay tareas pendientes con tiempo estimado.' };
  }
  
  // Group the class schedule by day
  const scheduleByDay = groupScheduleByDay(classSchedule);
  
  // Generate free time slots for each day
  const freeTimeSlots = [];
  
  // Get today and the next N days
  const today = new Date();
  const startOfToday = startOfDay(today);
  
  for (let i = 0; i < daysToSchedule; i++) {
    // Get date for the current iteration day
    const currentDate = new Date(startOfToday);
    currentDate.setDate(currentDate.getDate() + i);
    const dayKey = format(currentDate, 'yyyy-MM-dd');
    
    // Get classes for the current day
    const dayClasses = scheduleByDay[dayKey] || [];
    
    // Find free time slots for the day
    const daySlotsInfo = findFreeTimeSlotsForDay(
      currentDate, 
      dayClasses, 
      { travelTimeBefore, travelTimeAfter, minFreeTimeBlock }
    );
    
    // Add to total free time slots
    freeTimeSlots.push(...daySlotsInfo.freeSlots.map(slot => ({ ...slot, date: currentDate })));
  }
  
  // Sort tasks by priority and due date
  const sortedTasks = [...pendingTasks].sort((a, b) => {
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
  
  // Generate schedule suggestions
  const scheduleSuggestions = assignTasksToTimeSlots(sortedTasks, freeTimeSlots, maxDailyStudyHours);
  
  return {
    success: true,
    suggestions: scheduleSuggestions,
    unscheduledTasks: sortedTasks.filter(task => !scheduleSuggestions.some(s => s.taskId === task._id))
  };
}

/**
 * Group class schedule by day
 */
function groupScheduleByDay(classSchedule) {
  const scheduleByDay = {};
  
  classSchedule.forEach(classItem => {
    const classDate = new Date(classItem.date);
    const dayKey = format(classDate, 'yyyy-MM-dd');
    
    if (!scheduleByDay[dayKey]) {
      scheduleByDay[dayKey] = [];
    }
    
    scheduleByDay[dayKey].push({
      ...classItem,
      startDateTime: parseTimeString(classItem.startTime, classDate),
      endDateTime: parseTimeString(classItem.endTime, classDate)
    });
  });
  
  // Sort each day's classes by start time
  Object.keys(scheduleByDay).forEach(day => {
    scheduleByDay[day].sort((a, b) => a.startDateTime - b.startDateTime);
  });
  
  return scheduleByDay;
}

/**
 * Find free time slots for a given day
 */
function findFreeTimeSlotsForDay(date, dayClasses, options) {
  const { travelTimeBefore, travelTimeAfter, minFreeTimeBlock } = options;
  
  // Create beginning and end of day times
  const dayStart = new Date(date);
  dayStart.setHours(6, 0, 0, 0); // Start day at 6 AM
  
  const dayEnd = new Date(date);
  dayEnd.setHours(22, 0, 0, 0); // End day at 10 PM
  
  // If there are no classes, the entire day is free
  if (dayClasses.length === 0) {
    return {
      freeSlots: [{
        start: dayStart,
        end: dayEnd,
        duration: (dayEnd - dayStart) / (1000 * 60) // duration in minutes
      }],
      totalFreeTime: (dayEnd - dayStart) / (1000 * 60)
    };
  }
  
  // Sort classes by start time
  const sortedClasses = [...dayClasses].sort((a, b) => 
    a.startDateTime - b.startDateTime
  );
  
  // Find the first and last class of the day
  const firstClass = sortedClasses[0];
  const lastClass = sortedClasses[sortedClasses.length - 1];
  
  // Adjust day start and end based on travel time
  let adjustedDayStart = new Date(dayStart);
  let adjustedDayEnd = new Date(dayEnd);
  
  // Account for travel time before first class
  const travelStartTime = new Date(firstClass.startDateTime);
  travelStartTime.setMinutes(travelStartTime.getMinutes() - travelTimeBefore);
  
  if (isAfter(travelStartTime, dayStart)) {
    adjustedDayStart = dayStart;
  } else {
    // First class is soon after day start, so no free time at the beginning
    adjustedDayStart = firstClass.endDateTime;
  }
  
  // Account for travel time after last class
  const travelEndTime = new Date(lastClass.endDateTime);
  travelEndTime.setMinutes(travelEndTime.getMinutes() + travelTimeAfter);
  
  if (isBefore(travelEndTime, dayEnd)) {
    // There's free time after the travel time from last class
    adjustedDayEnd = dayEnd;
  } else {
    // Last class ends too late, so no free time at the end
    adjustedDayEnd = lastClass.startDateTime;
  }
  
  // Find free time slots between classes
  const freeSlots = [];
  let totalFreeTime = 0;
  
  // Free time before first class (if there is enough time)
  if (isAfter(firstClass.startDateTime, adjustedDayStart)) {
    const beforeFirstClass = new Date(firstClass.startDateTime);
    beforeFirstClass.setMinutes(beforeFirstClass.getMinutes() - travelTimeBefore);
    
    if (isAfter(beforeFirstClass, adjustedDayStart)) {
      const duration = (beforeFirstClass - adjustedDayStart) / (1000 * 60);
      if (duration >= minFreeTimeBlock) {
        freeSlots.push({
          start: adjustedDayStart,
          end: beforeFirstClass,
          duration
        });
        totalFreeTime += duration;
      }
    }
  }
  
  // Free time between classes
  for (let i = 0; i < sortedClasses.length - 1; i++) {
    const currentClass = sortedClasses[i];
    const nextClass = sortedClasses[i + 1];
    
    const travelEndTime = new Date(currentClass.endDateTime);
    travelEndTime.setMinutes(travelEndTime.getMinutes() + travelTimeBefore);
    
    const travelStartTime = new Date(nextClass.startDateTime);
    travelStartTime.setMinutes(travelStartTime.getMinutes() - travelTimeBefore);
    
    if (isAfter(travelStartTime, travelEndTime)) {
      const duration = (travelStartTime - travelEndTime) / (1000 * 60);
      if (duration >= minFreeTimeBlock) {
        freeSlots.push({
          start: travelEndTime,
          end: travelStartTime,
          duration
        });
        totalFreeTime += duration;
      }
    }
  }
  
  // Free time after last class (if there is enough time)
  if (isBefore(lastClass.endDateTime, adjustedDayEnd)) {
    const afterLastClass = new Date(lastClass.endDateTime);
    afterLastClass.setMinutes(afterLastClass.getMinutes() + travelTimeAfter);
    
    if (isBefore(afterLastClass, adjustedDayEnd)) {
      const duration = (adjustedDayEnd - afterLastClass) / (1000 * 60);
      if (duration >= minFreeTimeBlock) {
        freeSlots.push({
          start: afterLastClass,
          end: adjustedDayEnd,
          duration
        });
        totalFreeTime += duration;
      }
    }
  }
  
  return { freeSlots, totalFreeTime };
}

/**
 * Assign tasks to available time slots
 */
function assignTasksToTimeSlots(tasks, timeSlots, maxDailyStudyHours) {
  // Sort time slots by date and start time
  const sortedSlots = [...timeSlots].sort((a, b) => a.start - b.start);
  
  // Track study minutes per day to respect maxDailyStudyHours
  const dailyStudyMinutes = {};
  
  // Track which tasks have been scheduled
  const scheduledTaskIds = new Set();
  
  // Results array
  const scheduleSuggestions = [];
  
  // Clone tasks so we can modify them
  const remainingTasks = [...tasks];
  
  // Process each time slot
  for (const slot of sortedSlots) {
    // Get day key for tracking daily study time
    const dayKey = format(slot.date, 'yyyy-MM-dd');
    if (!dailyStudyMinutes[dayKey]) {
      dailyStudyMinutes[dayKey] = 0;
    }
    
    // Calculate remaining minutes available for study today
    const maxDailyMinutes = maxDailyStudyHours * 60;
    const remainingDailyMinutes = maxDailyMinutes - dailyStudyMinutes[dayKey];
    
    // Skip this slot if we've reached the daily study limit
    if (remainingDailyMinutes <= 0) continue;
    
    // Available minutes is the minimum of slot duration and remaining daily limit
    const availableMinutes = Math.min(slot.duration, remainingDailyMinutes);
    
    // Find tasks that fit within this slot
    let currentSlotMinutes = availableMinutes;
    let currentStartTime = new Date(slot.start);
    
    // Try to assign tasks to this slot
    let i = 0;
    while (currentSlotMinutes > 0 && i < remainingTasks.length) {
      const task = remainingTasks[i];
      
      // Skip already scheduled tasks
      if (scheduledTaskIds.has(task._id)) {
        i++;
        continue;
      }
      
      // If task has estimated time and it fits
      if (task.estimatedTime && task.estimatedTime <= currentSlotMinutes) {
        // Task fits in this slot - schedule it
        const taskEndTime = new Date(currentStartTime);
        taskEndTime.setMinutes(taskEndTime.getMinutes() + task.estimatedTime);
        
        scheduleSuggestions.push({
          taskId: task._id,
          title: task.title,
          startTime: new Date(currentStartTime),
          endTime: taskEndTime,
          duration: task.estimatedTime,
          subject: task.subject,
          priority: task.priority
        });
        
        // Mark task as scheduled
        scheduledTaskIds.add(task._id);
        
        // Update time tracking
        currentStartTime = taskEndTime;
        currentSlotMinutes -= task.estimatedTime;
        dailyStudyMinutes[dayKey] += task.estimatedTime;
        
        // Remove the scheduled task from our working list
        remainingTasks.splice(i, 1);
      } else {
        // This task doesn't fit, try the next one
        i++;
      }
    }
  }
  
  return scheduleSuggestions;
}

/**
 * Helper function to convert time string (HH:MM) to Date object
 */
function parseTimeString(timeString, dateObj) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const result = new Date(dateObj);
  result.setHours(hours, minutes, 0, 0);
  return result;
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
