
/*!
* Interactive Calendar Library v1.0.0
* https://inorganicplanet.com/
*
* Copyright OpenJS Foundation and other contributors
* Released under the MIT license
*
* Date: 2024-01-08T17:08Z
*/

// Storage variable
 
$(document).ready(function() {
    // event storage
    let eventStorage = {
        assignedEvents: {},  // Store events by date
        unassignedEvents: [] // Store unassigned events
    };
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let isWeekView = false;
    let currentWeek = 0;

    function updateCalendar() {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        
        // Update header
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        $('#monthYearDisplay').text(`${monthNames[currentMonth]} ${currentYear}`);

        $('#calendar').empty();
        
        // Add day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            $('#calendar').append(`<div class="date-header">${day}</div>`);
        });

        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            $('#calendar').append('<div class="day"></div>');
        }

        // Add days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const currentDate = new Date(currentYear, currentMonth, i);
            const dayClass = currentDate.getDay() >= 1 && currentDate.getDay() <= 5 ? 'workday' : 'weekend';
            $('#calendar').append(`
                <div class="day ${dayClass}" data-date="${currentDate.toISOString().split('T')[0]}">
                    <div class="date-header">${i}</div>
                </div>
            `);
        }
        
        // Reinitialize drag and drop
        initializeDragAndDrop();
    }

    function getWeekDates(date) {
        const week = [];
        const first = date.getDate() - date.getDay();
        
        for(let i = 0; i < 7; i++) {
            const day = new Date(date);
            day.setDate(first + i);
            week.push(day);
        }
        return week;
    }

    function generateWeekView() {
        $('#calendar').empty();
        
        // Add day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            $('#calendar').append(`<div class="date-header">${day}</div>`);
        });

        // Get current week dates
        const weekStart = new Date(currentYear, currentMonth);
        weekStart.setDate(weekStart.getDate() + (currentWeek * 7));
        const weekDates = getWeekDates(weekStart);

        // Add week days
        weekDates.forEach(date => {
            const dayClass = date.getDay() >= 1 && date.getDay() <= 5 ? 'workday' : 'weekend';
            $('#calendar').append(`
                <div class="day ${dayClass}" data-date="${date.toISOString().split('T')[0]}">
                    <div class="date-header">${date.getDate()}</div>
                </div>
            `);
        });

        // Update header display
        const firstDate = weekDates[0];
        const lastDate = weekDates[6];
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        $('#monthYearDisplay').text(
            `${monthNames[firstDate.getMonth()]} ${firstDate.getDate()} - ${monthNames[lastDate.getMonth()]} ${lastDate.getDate()}, ${firstDate.getFullYear()}`
        );
    }

    function updateCalendarView() {
        saveCurrentEvents(); // Save current state before switching views
        
        if (isWeekView) {
            generateWeekView();
        } else {
            updateCalendar();
        }
        
        restoreAllEvents(); // Use new restoration function
    }

    // New function to restore ALL events regardless of current view
    function restoreAllEvents() {
        // Clear existing events
        $('.day').find('.event').remove();
        $('#unassigned-list').empty();
        
        // Get all visible dates in current view
        const visibleDates = new Set();
        $('.day').each(function() {
            const date = $(this).data('date');
            if (date) visibleDates.add(date);
        });
        
        // Restore calendar events for visible dates
        Object.keys(eventStorage.assignedEvents).forEach(date => {
            if (visibleDates.has(date)) {
                const dayElement = $(`.day[data-date="${date}"]`);
                if (dayElement.length) {
                    eventStorage.assignedEvents[date].forEach(event => {
                        const newEvent = createEventElement(event.text, false);
                        dayElement.append(newEvent);
                    });
                }
            }
        });
        
        // Restore unassigned events
        eventStorage.unassignedEvents.forEach(event => {
            const newEvent = createEventElement(event.text, true);
            $('#unassigned-list').append(newEvent);
        });
        
        initializeDragAndDrop();
    }

    function createEventElement(eventName, isUnassigned = false) {
        return $(`
            <div class="${isUnassigned ? 'unassigned-event' : 'event'}">
                <span class="event-text">${eventName}</span>
                <span class="delete-event">x</span>
            </div>
        `);
    }

    function initializeDragAndDrop() {
        // Make elements draggable
        $('.event, .unassigned-event').draggable({
            revert: "invalid",
            cursor: "move",
            helper: 'original',
            zIndex: 100,
            start: function(event, ui) {
                $(this).addClass('being-dragged');
            },
            stop: function(event, ui) {
                $(this).removeClass('being-dragged');
            }
        });

        // Make calendar days droppable
        $('.day').droppable({
            accept: ".event, .unassigned-event",
            drop: function(event, ui) {
                const droppedEvent = $(ui.draggable);
                droppedEvent
                    .removeClass('unassigned-event being-dragged')
                    .addClass('event')
                    .css({
                        position: 'relative',
                        top: 'auto',
                        left: 'auto'
                    })
                    .appendTo(this);
                saveCurrentEvents();
            }
        });

        // Make both #unassigned-events and #unassigned-list droppable
        $('#unassigned-events, #unassigned-list').droppable({
            accept: ".event",
            tolerance: "fit",
            drop: function(event, ui) {
                const droppedEvent = $(ui.draggable);
                const unassignedList = $('#unassigned-list');
                
                droppedEvent
                    .removeClass('event being-dragged')
                    .addClass('unassigned-event')
                    .css({
                        position: 'relative',
                        top: 'auto',
                        left: 'auto'
                    })
                    .appendTo(unassignedList);
                
                saveCurrentEvents();
                initializeDragAndDrop(); // Reinitialize to ensure new event is draggable
            }
        });
    }


    function saveCurrentEvents() {
        // Keep existing stored events that aren't currently visible
        const currentStorage = {
            assignedEvents: {...eventStorage.assignedEvents}, // Clone existing storage
            unassignedEvents: []
        };
        
        // Update storage with currently visible events
        $('.day').each(function() {
            const date = $(this).data('date');
            if (date) {
                const events = $(this).find('.event').map(function() {
                    return {
                        text: $(this).find('.event-text').text(),
                        class: 'event'
                    };
                }).get();
                if (events.length) {
                    currentStorage.assignedEvents[date] = events;
                } else {
                    delete currentStorage.assignedEvents[date]; // Remove date if no events
                }
            }
        });
        
        // Save unassigned events
        currentStorage.unassignedEvents = $('#unassigned-list').find('.unassigned-event').map(function() {
            return {
                text: $(this).find('.event-text').text(),
                class: 'unassigned-event'
            };
        }).get();
        
        eventStorage = currentStorage;
    }

    function restoreEvents() {
        // Clear existing events
        $('.day').find('.event').remove();
        $('#unassigned-list').empty();
        
        // Restore calendar events
        $('.day').each(function() {
            const date = $(this).data('date');
            if (date && eventStorage.assignedEvents[date]) {
                eventStorage.assignedEvents[date].forEach(event => {
                    const newEvent = createEventElement(event.text, false);
                    $(this).append(newEvent);
                });
            }
        });
        
        // Restore unassigned events
        eventStorage.unassignedEvents.forEach(event => {
            const newEvent = createEventElement(event.text, true);
            $('#unassigned-list').append(newEvent);
        });
        
        initializeDragAndDrop();
    }

    // Event Handlers
    $('#prevNav').click(function() {
        saveCurrentEvents();
        if (isWeekView) {
            currentWeek--;
            generateWeekView();
        } else {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            updateCalendar();
        }
        restoreEvents();
    });

    $('#nextNav').click(function() {
        saveCurrentEvents();
        if (isWeekView) {
            currentWeek++;
            generateWeekView();
        } else {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            updateCalendar();
        }
        restoreEvents();
    });

    $('#currentNav').click(function() {
        saveCurrentEvents();
        const today = new Date();
        currentMonth = today.getMonth();
        currentYear = today.getFullYear();
        currentWeek = Math.floor((today.getDate() - 1) / 7);
        updateCalendarView();
    });

    $('#toggleView').click(function() {
        isWeekView = !isWeekView;
        currentWeek = Math.floor((new Date().getDate() - 1) / 7);
        updateCalendarView();
    });

    // Initialize calendar
    updateCalendar();
    initializeDragAndDrop();

    // Double-click handlers
    $(document).on('dblclick', '.day', function() {
        const eventName = prompt("Enter event name:");
        if (eventName && eventName.trim() !== '') {
            const newEvent = createEventElement(eventName, false);
            $(this).append(newEvent);
            initializeDragAndDrop();
        }
    });

    $(document).on('dblclick', '.event, .unassigned-event', function(e) {
        e.stopPropagation();
        const eventElement = $(this);
        const eventTextElement = eventElement.find('.event-text');
        const currentText = eventTextElement.text();
        
        const newText = prompt("Edit event:", currentText);
        if (newText !== null && newText.trim() !== '') {
            eventTextElement.text(newText.trim());
        }
    });

    // Delete event handler
    $(document).on('click', '.delete-event', function(e) {
        e.stopPropagation();
        const eventElement = $(this).parent();
        const dayElement = eventElement.closest('.day');
        const date = dayElement.data('date');
        const eventName = eventElement.find('.event-text').text();
        
        if (confirm(`Are you sure you want to delete the event "${eventName}"?`)) {
            eventElement.remove();
            if (date && eventStorage[date]) {
                const events = dayElement.find('.event, .unassigned-event').map(function() {
                    return {
                        text: $(this).find('.event-text').text(),
                        class: $(this).hasClass('unassigned-event') ? 'unassigned-event' : 'event'
                    };
                }).get();
                if (events.length) {
                    eventStorage[date] = events;
                } else {
                    delete eventStorage[date];
                }
            }
        }
    });

    // Add unassigned event handler
    $('#add-unassigned').click(function() {
        const eventName = prompt("Enter event name:");
        if (eventName && eventName.trim() !== '') {
            const newEvent = createEventElement(eventName, true);
            $('#unassigned-list').append(newEvent);
            initializeDragAndDrop();
        }
    });

    updateCalendar();

    // Add initial sample events
    const sampleEvents = [
        { text: "Team Meeting" },
        { text: "Project Review" }
    ];

    sampleEvents.forEach(event => {
        const newEvent = createEventElement(event.text, true);
        $('#unassigned-list').append(newEvent);
    });

    saveCurrentEvents();
    initializeDragAndDrop();
});
