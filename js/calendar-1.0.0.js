
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
let eventStorage = {};

$(document).ready(function () {
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

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
    }

    // Generate calendar
    function generateCalendar(firstDay, lastDay) {
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
    }

    // Navigation handlers
    $('#prevMonth').click(function () {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendar();
    });

    $('#nextMonth').click(function () {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendar();
    });

    $('#currentMonth').click(function () {
        const today = new Date();
        currentMonth = today.getMonth();
        currentYear = today.getFullYear();
        updateCalendar();
    });

    // Initialize draggable and droppable
    function initializeDragAndDrop() {
        $('.event, .unassigned-event').draggable({
            revert: "invalid",
            cursor: "move",
            helper: 'original',
            zIndex: 100,
            start: function (event, ui) {
                $(this).addClass('being-dragged');
            },
            stop: function (event, ui) {
                $(this).removeClass('being-dragged');
            }
        });

        $('.day').droppable({
            accept: ".event, .unassigned-event",
            drop: function (event, ui) {
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
                saveCurrentEvents(); // Save after drop
            }
        });

        $('#unassigned-list').droppable({
            accept: ".event",
            drop: function (event, ui) {
                const droppedEvent = $(ui.draggable);
                droppedEvent
                    .removeClass('event being-dragged')
                    .addClass('unassigned-event')
                    .css({
                        position: 'relative',
                        top: 'auto',
                        left: 'auto'
                    })
                    .appendTo(this);
                saveCurrentEvents(); // Save after drop
            }
        });
    }

    // Update the add unassigned event handler
    $('#add-unassigned').click(function () {
        const eventName = prompt("Enter event name:");
        if (eventName && eventName.trim() !== '') {
            const newEvent = createEventElement(eventName, true);
            $('#unassigned-list').append(newEvent);
            initializeDragAndDrop();
        }
    });

    // Update the calendar day event handler
    $(document).on('dblclick', '.day', function () {
        const eventName = prompt("Enter event name:");
        if (eventName && eventName.trim() !== '') {
            const newEvent = createEventElement(eventName, false);
            $(this).append(newEvent);
            console.log(newEvent);
            initializeDragAndDrop();
        }
    });

    // Add delete event handler:
    $(document).on('click', '.delete-event', function (e) {
        e.stopPropagation();
        const eventElement = $(this).parent();
        const dayElement = eventElement.closest('.day');
        const date = dayElement.data('date');
        const eventName = eventElement.find('.event-text').text();

        if (confirm(`Are you sure you want to delete the event "${eventName}"?`)) {
            eventElement.remove();
            // Update storage after deletion
            if (date && eventStorage[date]) {
                const events = dayElement.find('.event, .unassigned-event').map(function () {
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

    // Update the sample unassigned events:
    $('#unassigned-list').append(`
                <div class="unassigned-event">
                    <span class="event-text">Team Meeting</span>
                    <span class="delete-event">x</span>
                </div>
                <div class="unassigned-event">
                    <span class="event-text">Project Review</span>
                    <span class="delete-event">x</span>
                </div>
            `);

    // double-clicking events
    $(document).on('dblclick', '.event, .unassigned-event', function (e) {
        e.stopPropagation(); // Prevent triggering the day's double-click event
        const eventElement = $(this);
        const eventTextElement = eventElement.find('.event-text');
        const currentText = eventTextElement.text();

        const newText = prompt("Edit event:", currentText);
        if (newText !== null && newText.trim() !== '') {
            eventTextElement.text(newText.trim());
        }
    });

    // Update the event creation functions to use consistent structure
    function createEventElement(eventName, isUnassigned = false) {
        return $(`
                    <div class="${isUnassigned ? 'unassigned-event' : 'event'}">
                        <span class="event-text">${eventName}</span>
                        <span class="delete-event">x</span>
                    </div>
                `);
    }

    //Week view
    let isWeekView = false;
    let currentWeek = 0;

    function getWeekDates(date) {
        const week = [];
        const first = date.getDate() - date.getDay();

        for (let i = 0; i < 7; i++) {
            const day = new Date(date);
            day.setDate(first + i);
            week.push(day);
        }
        return week;
    }

    function updateCalendarView() {
        // Store all current events with their dates before clearing
        const savedEvents = {};
        $('.day').each(function () {
            const date = $(this).data('date');
            const events = $(this).find('.event').detach();
            if (events.length) {
                savedEvents[date] = events;
            }
        });

        if (isWeekView) {
            generateWeekView();
        } else {
            updateCalendar();
        }

        // Restore events to their corresponding dates
        $('.day').each(function () {
            const date = $(this).data('date');
            if (savedEvents[date]) {
                $(this).append(savedEvents[date]);
            }
        });

        // Reinitialize drag and drop
        initializeDragAndDrop();
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

    // Update the navigation handlers to also save events
    $('#prevNav').click(function () {
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

    $('#nextNav').click(function () {
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

    $('#currentNav').click(function () {
        saveCurrentEvents();
        const today = new Date();
        currentMonth = today.getMonth();
        currentYear = today.getFullYear();
        currentWeek = Math.floor((today.getDate() - 1) / 7);
        updateCalendarView();
    });

    // Add toggle view handler
    $('#toggleView').click(function () {
        saveCurrentEvents();
        isWeekView = !isWeekView;
        currentWeek = Math.floor((new Date().getDate() - 1) / 7);
        updateCalendarView();
    });

    // Save events
    function saveCurrentEvents() {
        // Keep existing stored events that aren't in current view
        const currentStorage = { ...eventStorage };

        // Add/update events from current view
        $('.day').each(function () {
            const date = $(this).data('date');
            if (date) {
                const events = $(this).find('.event, .unassigned-event').map(function () {
                    return {
                        text: $(this).find('.event-text').text(),
                        class: $(this).hasClass('unassigned-event') ? 'unassigned-event' : 'event'
                    };
                }).get();
                if (events.length) {
                    currentStorage[date] = events;
                }
            }
        });

        eventStorage = currentStorage;
    }

    function restoreEvents() {
        $('.day').each(function () {
            const date = $(this).data('date');
            if (date && eventStorage[date]) {
                eventStorage[date].forEach(event => {
                    const newEvent = $(`
                            <div class="${event.class}">
                                <span class="event-text">${event.text}</span>
                                <span class="delete-event">x</span>
                            </div>
                        `);
                    $(this).append(newEvent);
                });
            }
        });
        initializeDragAndDrop();
    }

    function updateCalendarView() {
        if (isWeekView) {
            generateWeekView();
        } else {
            updateCalendar();
        }
        restoreEvents();
    }

    //End Week view

    // Initialize calendar
    updateCalendar();
    initializeDragAndDrop();
});
