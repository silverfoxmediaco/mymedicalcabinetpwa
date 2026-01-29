// Calendar integration service
// Generates calendar links and .ics files for various calendar providers

export const CALENDAR_OPTIONS = [
    { value: 'google', label: 'Google Calendar', icon: 'google' },
    { value: 'apple', label: 'Apple Calendar', icon: 'apple' },
    { value: 'outlook_web', label: 'Outlook.com', icon: 'outlook' },
    { value: 'outlook_desktop', label: 'Outlook Desktop', icon: 'outlook' },
    { value: 'yahoo', label: 'Yahoo Calendar', icon: 'yahoo' },
    { value: 'ics', label: 'Download .ics File', icon: 'download' }
];

// Format date for Google Calendar (YYYYMMDDTHHmmssZ)
const formatGoogleDate = (date) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

// Format date for Outlook (YYYY-MM-DDTHH:mm:ss)
const formatOutlookDate = (date) => {
    return new Date(date).toISOString().replace(/\.\d{3}Z$/, '');
};

// Format date for Yahoo (YYYYMMDDTHHmmss)
const formatYahooDate = (date) => {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');
};

// Calculate end time (default 1 hour if not provided)
const getEndTime = (startDate, durationMinutes = 60) => {
    const end = new Date(startDate);
    end.setMinutes(end.getMinutes() + durationMinutes);
    return end;
};

// Generate .ics file content
const generateICSContent = (appointment) => {
    const start = new Date(appointment.dateTime);
    const end = getEndTime(start, appointment.duration || 60);

    const formatICSDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const escapeText = (text) => {
        if (!text) return '';
        return text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
    };

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//MyMedicalCabinet//Appointments//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `DTSTART:${formatICSDate(start)}`,
        `DTEND:${formatICSDate(end)}`,
        `SUMMARY:${escapeText(appointment.title)}`,
        `DESCRIPTION:${escapeText(appointment.notes || '')}`,
        `LOCATION:${escapeText(appointment.location || '')}`,
        `UID:${appointment._id || Date.now()}@mymedicalcabinet.com`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ];

    return lines.join('\r\n');
};

// Download .ics file
const downloadICS = (appointment) => {
    const content = generateICSContent(appointment);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `appointment-${appointment._id || Date.now()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Generate Google Calendar URL
const getGoogleCalendarUrl = (appointment) => {
    const start = formatGoogleDate(appointment.dateTime);
    const end = formatGoogleDate(getEndTime(appointment.dateTime, appointment.duration || 60));

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: appointment.title,
        dates: `${start}/${end}`,
        details: appointment.notes || '',
        location: appointment.location || ''
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Generate Outlook.com URL
const getOutlookWebUrl = (appointment) => {
    const start = formatOutlookDate(appointment.dateTime);
    const end = formatOutlookDate(getEndTime(appointment.dateTime, appointment.duration || 60));

    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: appointment.title,
        startdt: start,
        enddt: end,
        body: appointment.notes || '',
        location: appointment.location || ''
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

// Generate Yahoo Calendar URL
const getYahooCalendarUrl = (appointment) => {
    const start = formatYahooDate(appointment.dateTime);
    const duration = appointment.duration || 60;
    const hours = Math.floor(duration / 60).toString().padStart(2, '0');
    const minutes = (duration % 60).toString().padStart(2, '0');

    const params = new URLSearchParams({
        v: '60',
        title: appointment.title,
        st: start,
        dur: `${hours}${minutes}`,
        desc: appointment.notes || '',
        in_loc: appointment.location || ''
    });

    return `https://calendar.yahoo.com/?${params.toString()}`;
};

export const calendarService = {
    CALENDAR_OPTIONS,

    // Add appointment to calendar based on user's preferred calendar
    addToCalendar(appointment, calendarType) {
        switch (calendarType) {
            case 'google':
                window.open(getGoogleCalendarUrl(appointment), '_blank');
                break;

            case 'apple':
            case 'outlook_desktop':
            case 'ics':
                downloadICS(appointment);
                break;

            case 'outlook_web':
                window.open(getOutlookWebUrl(appointment), '_blank');
                break;

            case 'yahoo':
                window.open(getYahooCalendarUrl(appointment), '_blank');
                break;

            default:
                // Default to .ics download
                downloadICS(appointment);
        }
    },

    // Get calendar option label by value
    getCalendarLabel(value) {
        const option = CALENDAR_OPTIONS.find(opt => opt.value === value);
        return option ? option.label : 'Download .ics File';
    }
};

export default calendarService;
