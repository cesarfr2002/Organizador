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
  
  // Get current date and time (for filtering past slots)
  const now = new Date();
  const today = new Date();
  const startOfToday = startOfDay(today);
  
  for (let i = 0; i < daysToSchedule; i++) {
    // Get date for the current iteration day
    const currentDate = new Date(startOfToday);
    currentDate.setDate(currentDate.getDate() + i);
    const dayKey = format(currentDate, 'yyyy-MM-dd');
    
    // Get classes for the current day
    const dayClasses = scheduleByDay[dayKey] || [];
    
    // Find free time slots for the day, considering the current time for today
    const daySlotsInfo = findFreeTimeSlotsForDay(
      currentDate, 
      dayClasses, 
      { travelTimeBefore, travelTimeAfter, minFreeTimeBlock, currentTime: now }
    );
    
    // Add to total free time slots
    freeTimeSlots.push(...daySlotsInfo.freeSlots.map(slot => ({ 
      ...slot, 
      date: currentDate,
      dayIndex: i // Add day index for prioritization
    })));
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
  
  // Generate schedule suggestions with improved distribution
  const scheduleSuggestions = assignTasksToTimeSlotsImproved(sortedTasks, freeTimeSlots, maxDailyStudyHours);
  
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
  
  // Sort classes by start time
  const sortedClasses = [...dayClasses].sort((a, b) => 
    a.startDateTime - b.startDateTime
  );
  
  // Find the first and last class of the day
  const firstClass = sortedClasses[0];
  const lastClass = sortedClasses[sortedClasses.length - 1];
  
  // Define travel time periods explicitly
  const travelToFirstClass = {
    start: new Date(firstClass.startDateTime),
    end: new Date(firstClass.startDateTime)
  };
  travelToFirstClass.start.setMinutes(travelToFirstClass.start.getMinutes() - travelTimeBefore);
  
  const travelFromLastClass = {
    start: new Date(lastClass.endDateTime),
    end: new Date(lastClass.endDateTime)
  };
  travelFromLastClass.end.setMinutes(travelFromLastClass.end.getMinutes() + travelTimeAfter);
  
  // Define busy periods: classes and travel times
  const busyPeriods = [
    // Travel to first class is busy
    { start: travelToFirstClass.start, end: travelToFirstClass.end, type: 'travel-to' },
    // Travel from last class is busy
    { start: travelFromLastClass.start, end: travelFromLastClass.end, type: 'travel-from' }
  ];
  
  // Add all classes as busy periods
  sortedClasses.forEach(cls => {
    busyPeriods.push({
      start: cls.startDateTime,
      end: cls.endDateTime,
      type: 'class'
    });
  });
  
  // Sort busy periods by start time
  busyPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());
  
  // Create free time segments avoiding busy periods completely
  const freeTimeSegments = [];
  
  // Check for free time at the start of the day before first travel period
  if (travelToFirstClass.start > dayStart) {
    const duration = (travelToFirstClass.start - dayStart) / (1000 * 60);
    if (duration >= minFreeTimeBlock) {
      freeTimeSegments.push({
        start: new Date(dayStart),
        end: new Date(travelToFirstClass.start),
        duration
      });
    }
  }
  
  // Find free time between busy periods
  for (let i = 0; i < busyPeriods.length - 1; i++) {
    const currentPeriod = busyPeriods[i];
    const nextPeriod = busyPeriods[i + 1];
    
    if (nextPeriod.start > currentPeriod.end) {
      const duration = (nextPeriod.start - currentPeriod.end) / (1000 * 60);
      if (duration >= minFreeTimeBlock) {
        freeTimeSegments.push({
          start: new Date(currentPeriod.end),
          end: new Date(nextPeriod.start),
          duration
        });
      }
    }
  }
  
  // Check for free time at the end of day after last travel period
  if (dayEnd > travelFromLastClass.end) {
    const duration = (dayEnd - travelFromLastClass.end) / (1000 * 60);
    if (duration >= minFreeTimeBlock) {
      freeTimeSegments.push({
        start: new Date(travelFromLastClass.end),
        end: new Date(dayEnd),
        duration
      });
    }
  }
  
  // Remove any free segments that overlap with any busy period
  const nonOverlappingSegments = freeTimeSegments.filter(segment => {
    for (const busy of busyPeriods) {
      // Check if this segment overlaps with this busy period
      const overlaps = (
        (segment.start < busy.end && segment.end > busy.start) ||
        (busy.start < segment.end && busy.end > segment.start)
      );
      
      // Skip this segment if it overlaps with any busy period
      if (overlaps) return false;
    }
    return true;
  });
  
  // Merge any adjacent segments that have no gap between them
  const mergedSegments = [];
  nonOverlappingSegments.sort((a, b) => a.start - b.start);
  
  if (nonOverlappingSegments.length > 0) {
    let current = nonOverlappingSegments[0];
    
    for (let i = 1; i < nonOverlappingSegments.length; i++) {
      const next = nonOverlappingSegments[i];
      
      if (Math.abs(next.start - current.end) < 60000) { // Less than 1 minute gap
        // Merge segments
        current.end = next.end;
        current.duration = (current.end - current.start) / (1000 * 60);
      } else {
        mergedSegments.push(current);
        current = next;
      }
    }
    
    mergedSegments.push(current);
  }
  
  // Filter out segments in the past for today
  const validSegments = isToday 
    ? mergedSegments.filter(seg => isAfter(seg.end, currentTime))
    : mergedSegments;
  
  const totalFreeTime = validSegments.reduce((sum, seg) => sum + seg.duration, 0);
  
  // Log for debugging
  console.log('Day:', format(date, 'yyyy-MM-dd'));
  console.log('First class:', firstClass ? format(firstClass.startDateTime, 'HH:mm') : 'None');
  console.log('Last class:', lastClass ? format(lastClass.endDateTime, 'HH:mm') : 'None');
  console.log('Travel to first class:', format(travelToFirstClass.start, 'HH:mm'), 'to', format(travelToFirstClass.end, 'HH:mm'));
  console.log('Travel from last class:', format(travelFromLastClass.start, 'HH:mm'), 'to', format(travelFromLastClass.end, 'HH:mm'));
  console.log('Free segments:', validSegments.map(s => `${format(s.start, 'HH:mm')}-${format(s.end, 'HH:mm')}`));
  
  return { 
    freeSlots: validSegments, 
    totalFreeTime 
  };
}

/**
 * Helper function to merge overlapping time blocks
 */
function mergeOverlappingTimeBlocks(blocks) {
  if (!blocks.length) return [];
  
  // Sort blocks by start time
  const sortedBlocks = [...blocks].sort((a, b) => a.start - b.start);
  
  // Initialize result with the first block
  const mergedBlocks = [{ ...sortedBlocks[0] }];
  
  // Iterate through blocks and merge if they overlap
  for (let i = 1; i < sortedBlocks.length; i++) {
    const currentBlock = sortedBlocks[i];
    const lastMergedBlock = mergedBlocks[mergedBlocks.length - 1];
    
    // If current block starts before or at the end of the last merged block, they overlap
    if (currentBlock.start <= lastMergedBlock.end) {
      // Extend the end time of the last merged block if needed
      if (currentBlock.end > lastMergedBlock.end) {
        lastMergedBlock.end = currentBlock.end;
      }
    } else {
      // No overlap, add as a new block
      mergedBlocks.push({ ...currentBlock });
    }
  }
  
  return mergedBlocks;
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
 * Improved version of assignTasksToTimeSlots with better distribution of tasks
 */
function assignTasksToTimeSlotsImproved(tasks, timeSlots, maxDailyStudyHours) {
  // 1. Sort time slots by day (closest first) and then by start time
  const sortedSlots = [...timeSlots].sort((a, b) => {
    // First sort by day index (to prioritize closer days)
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
    
    // Then sort by start time within the day
    return a.start - b.start;
  });
  
  // Track study minutes per day to respect maxDailyStudyHours
  const dailyStudyMinutes = {};
  
  // Track which tasks have been scheduled
  const scheduledTaskIds = new Set();
  
  // Results array
  const scheduleSuggestions = [];
  
  // Clone tasks so we can modify them
  const remainingTasks = [...tasks];
  
  // For improved distribution:
  // 1. Maximum consecutive tasks in a single slot (avoid grouping too many)
  const MAX_CONSECUTIVE_TASKS = 2;
  
  // 2. Preferred minimum break between tasks (in minutes)
  const PREFERRED_BREAK = 20;
  
  // First pass: Assign high priority tasks first, with better distribution
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
    let availableMinutes = Math.min(slot.duration, remainingDailyMinutes);
    
    // Initial start time for this slot
    let currentStartTime = new Date(slot.start);
    
    // Limit number of consecutive tasks in this slot
    let tasksInCurrentSlot = 0;
    
    for (let i = 0; i < remainingTasks.length && availableMinutes > 0 && tasksInCurrentSlot < MAX_CONSECUTIVE_TASKS; i++) {
      const task = remainingTasks[i];
      
      // Skip already scheduled tasks
      if (scheduledTaskIds.has(task._id)) {
        continue;
      }
      
      // If task fits in the available time
      if (task.estimatedTime && task.estimatedTime <= availableMinutes) {
        // Schedule this task
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
        
        // Update tracking
        currentStartTime = new Date(taskEndTime);
        currentStartTime.setMinutes(currentStartTime.getMinutes() + PREFERRED_BREAK); // Add break between tasks
        availableMinutes = availableMinutes - task.estimatedTime - PREFERRED_BREAK;
        dailyStudyMinutes[dayKey] += task.estimatedTime;
        
        // Remove the task from remainingTasks
        remainingTasks.splice(i, 1);
        i--; // Adjust index since we removed an element
        
        // Increment count of tasks in this slot
        tasksInCurrentSlot++;
      }
    }
  }
  
  // Second pass: Try to fit remaining tasks in any available space
  if (remainingTasks.length > 0) {
    // Reset tracking for the second pass
    for (const slot of sortedSlots) {
      // Skip slots that already have the maximum tasks
      if (scheduleSuggestions.filter(s => 
          isSameDay(s.startTime, slot.date) && 
          s.startTime >= slot.start && 
          s.endTime <= slot.end
        ).length >= MAX_CONSECUTIVE_TASKS) {
        continue;
      }
      
      const dayKey = format(slot.date, 'yyyy-MM-dd');
      if (!dailyStudyMinutes[dayKey]) {
        dailyStudyMinutes[dayKey] = 0;
      }
      
      // Skip if daily limit reached
      const remainingDailyMinutes = (maxDailyStudyHours * 60) - dailyStudyMinutes[dayKey];
      if (remainingDailyMinutes <= 0) continue;
      
      // Find start time based on existing scheduled tasks in this slot
      let startTime = new Date(slot.start);
      let endTime = new Date(slot.end);
      
      // Find tasks already scheduled in this slot
      const tasksInSlot = scheduleSuggestions.filter(s => 
        s.startTime >= slot.start && s.endTime <= slot.end);
      
      if (tasksInSlot.length > 0) {
        // Use the end of the last task plus break time as new start
        const lastTaskInSlot = tasksInSlot.sort((a, b) => b.endTime - a.endTime)[0];
        startTime = new Date(lastTaskInSlot.endTime);
        startTime.setMinutes(startTime.getMinutes() + PREFERRED_BREAK);
      }
      
      // Available time in this slot
      if (startTime >= endTime) continue;
      
      const availableMinutes = Math.min(
        (endTime - startTime) / (1000 * 60),
        remainingDailyMinutes
      );
      
      // Try to fit a task
      for (let i = 0; i < remainingTasks.length; i++) {
        const task = remainingTasks[i];
        
        if (scheduledTaskIds.has(task._id)) continue;
        
        if (task.estimatedTime && task.estimatedTime <= availableMinutes) {
          const taskEndTime = new Date(startTime);
          taskEndTime.setMinutes(taskEndTime.getMinutes() + task.estimatedTime);
          
          scheduleSuggestions.push({
            taskId: task._id,
            title: task.title,
            startTime: new Date(startTime),
            endTime: taskEndTime,
            duration: task.estimatedTime,
            subject: task.subject,
            priority: task.priority
          });
          
          scheduledTaskIds.add(task._id);
          dailyStudyMinutes[dayKey] += task.estimatedTime;
          
          remainingTasks.splice(i, 1);
          break; // Schedule only one task per slot in second pass
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
