/**
 * Reminder Service
 * Handles scheduling and sending medication and appointment reminders
 *
 * This should be run on a schedule (e.g., every 15 minutes via cron)
 * In production, use a proper job scheduler like node-cron, Agenda, or a cloud scheduler
 */

const User = require('../models/User');
const Medication = require('../models/Medication');
const Appointment = require('../models/Appointment');
const emailService = require('./emailService');

/**
 * Process medication reminders
 * Finds medications due for reminder and sends emails
 */
const processMedicationReminders = async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Round to nearest 15 minutes for matching
    const roundedMinute = Math.floor(currentMinute / 15) * 15;
    const timeSlot = `${currentHour.toString().padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}`;

    console.log(`[Reminder] Processing medication reminders for time slot: ${timeSlot}`);

    try {
        // Find active medications with reminders enabled
        const medications = await Medication.find({
            status: 'active',
            'reminder.enabled': true
        }).populate('userId', 'email firstName lastName');

        let sentCount = 0;
        let errorCount = 0;

        for (const medication of medications) {
            // Check if any reminder time matches current time slot
            const reminderTimes = medication.reminder?.times || [];
            const shouldRemind = reminderTimes.some(time => {
                const [hour, minute] = time.split(':').map(Number);
                const roundedReminderMinute = Math.floor(minute / 15) * 15;
                return hour === currentHour && roundedReminderMinute === roundedMinute;
            });

            if (shouldRemind && medication.userId) {
                try {
                    await emailService.sendMedicationReminder(
                        medication.userId,
                        medication,
                        now
                    );
                    sentCount++;
                } catch (error) {
                    console.error(`[Reminder] Failed to send medication reminder for ${medication._id}:`, error.message);
                    errorCount++;
                }
            }
        }

        console.log(`[Reminder] Medication reminders sent: ${sentCount}, errors: ${errorCount}`);
        return { sent: sentCount, errors: errorCount };
    } catch (error) {
        console.error('[Reminder] Error processing medication reminders:', error);
        throw error;
    }
};

/**
 * Process appointment reminders
 * Sends reminders 24 hours and 2 hours before appointments
 */
const processAppointmentReminders = async () => {
    const now = new Date();

    console.log(`[Reminder] Processing appointment reminders`);

    try {
        // Find upcoming appointments in next 25 hours that haven't been reminded
        const tomorrow = new Date(now.getTime() + 25 * 60 * 60 * 1000);
        const twoHoursFromNow = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);
        const twoHoursAgo = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);

        const appointments = await Appointment.find({
            dateTime: { $gte: now, $lte: tomorrow },
            status: { $in: ['scheduled', 'confirmed'] }
        }).populate('userId', 'email firstName lastName');

        let sentCount = 0;
        let errorCount = 0;

        for (const appointment of appointments) {
            if (!appointment.userId) continue;

            const appointmentTime = new Date(appointment.dateTime);
            const hoursUntil = (appointmentTime - now) / (1000 * 60 * 60);

            // Check if we should send 24-hour reminder (between 23-25 hours)
            const should24HourRemind = hoursUntil >= 23 && hoursUntil <= 25;

            // Check if we should send 2-hour reminder (between 1.5-2.5 hours)
            const should2HourRemind = hoursUntil >= 1.5 && hoursUntil <= 2.5;

            // Check what reminders have already been sent
            const remindersSent = appointment.remindersSent || [];
            const sent24Hour = remindersSent.some(r => r.type === 'email' && r.timing === '24h');
            const sent2Hour = remindersSent.some(r => r.type === 'email' && r.timing === '2h');

            if ((should24HourRemind && !sent24Hour) || (should2HourRemind && !sent2Hour)) {
                try {
                    await emailService.sendAppointmentReminder(
                        appointment.userId,
                        appointment
                    );

                    // Record that reminder was sent
                    const timing = should24HourRemind ? '24h' : '2h';
                    await Appointment.findByIdAndUpdate(appointment._id, {
                        $push: {
                            remindersSent: {
                                type: 'email',
                                timing,
                                sentAt: now
                            }
                        }
                    });

                    sentCount++;
                } catch (error) {
                    console.error(`[Reminder] Failed to send appointment reminder for ${appointment._id}:`, error.message);
                    errorCount++;
                }
            }
        }

        console.log(`[Reminder] Appointment reminders sent: ${sentCount}, errors: ${errorCount}`);
        return { sent: sentCount, errors: errorCount };
    } catch (error) {
        console.error('[Reminder] Error processing appointment reminders:', error);
        throw error;
    }
};

/**
 * Process refill reminders
 * Sends reminders when refillDate is approaching
 */
const processRefillReminders = async () => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    console.log(`[Reminder] Processing refill reminders`);

    try {
        // Find medications with refill date in next 3 days
        const medications = await Medication.find({
            status: 'active',
            refillDate: { $gte: now, $lte: threeDaysFromNow },
            refillReminderSent: { $ne: true }
        }).populate('userId', 'email firstName lastName');

        let sentCount = 0;
        let errorCount = 0;

        for (const medication of medications) {
            if (!medication.userId) continue;

            try {
                await emailService.sendRefillReminder(medication.userId, medication);

                // Mark as sent
                await Medication.findByIdAndUpdate(medication._id, {
                    refillReminderSent: true
                });

                sentCount++;
            } catch (error) {
                console.error(`[Reminder] Failed to send refill reminder for ${medication._id}:`, error.message);
                errorCount++;
            }
        }

        console.log(`[Reminder] Refill reminders sent: ${sentCount}, errors: ${errorCount}`);
        return { sent: sentCount, errors: errorCount };
    } catch (error) {
        console.error('[Reminder] Error processing refill reminders:', error);
        throw error;
    }
};

/**
 * Run all reminder processes
 * Call this from a scheduled job
 */
const processAllReminders = async () => {
    console.log(`[Reminder] Starting reminder processing at ${new Date().toISOString()}`);

    const results = {
        medications: await processMedicationReminders(),
        appointments: await processAppointmentReminders(),
        refills: await processRefillReminders()
    };

    console.log(`[Reminder] Completed reminder processing`, results);
    return results;
};

module.exports = {
    processMedicationReminders,
    processAppointmentReminders,
    processRefillReminders,
    processAllReminders
};
