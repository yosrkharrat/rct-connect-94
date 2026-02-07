import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

// Initialize notification system
export async function initNotifications() {
  if (!Capacitor.isNativePlatform()) {
    console.log('Notifications only work on native platforms');
    return;
  }

  try {
    // Request permissions for local notifications
    const localPermissions = await LocalNotifications.requestPermissions();
    console.log('Local notifications permission:', localPermissions);

    // Request permissions for push notifications
    const pushPermissions = await PushNotifications.requestPermissions();
    console.log('Push notifications permission:', pushPermissions);

    if (pushPermissions.receive === 'granted') {
      // Register for push notifications
      await PushNotifications.register();
      
      // Listen for registration
      await PushNotifications.addListener('registration', token => {
        console.log('Push registration success, token:', token.value);
        // TODO: Send token to backend when available
        localStorage.setItem('rct_push_token', token.value);
      });

      // Listen for registration errors
      await PushNotifications.addListener('registrationError', error => {
        console.error('Push registration error:', error);
      });

      // Listen for push notifications
      await PushNotifications.addListener('pushNotificationReceived', notification => {
        console.log('Push notification received:', notification);
        // Show local notification when app is in foreground
        showLocalNotification({
          title: notification.title || 'RCT',
          body: notification.body || '',
          id: Date.now(),
        });
      });

      // Listen for notification actions
      await PushNotifications.addListener('pushNotificationActionPerformed', action => {
        console.log('Push notification action performed:', action);
        // TODO: Handle notification tap (navigate to event, etc.)
      });
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
}

// Schedule a local notification
export async function scheduleLocalNotification(options: {
  title: string;
  body: string;
  scheduleAt: Date;
  id: number;
  extra?: any;
}) {
  if (!Capacitor.isNativePlatform()) {
    console.log('Scheduling notification:', options);
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: options.title,
          body: options.body,
          id: options.id,
          schedule: { at: options.scheduleAt },
          extra: options.extra,
        },
      ],
    });
    console.log('Notification scheduled successfully');
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

// Show immediate local notification
export async function showLocalNotification(options: {
  title: string;
  body: string;
  id: number;
  extra?: any;
}) {
  if (!Capacitor.isNativePlatform()) {
    console.log('Showing notification:', options);
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: options.title,
          body: options.body,
          id: options.id,
          extra: options.extra,
        },
      ],
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Cancel a scheduled notification
export async function cancelNotification(id: number) {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

// Get pending notifications
export async function getPendingNotifications() {
  if (!Capacitor.isNativePlatform()) {
    return [];
  }

  try {
    const result = await LocalNotifications.getPending();
    return result.notifications;
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
  }
}

// Schedule event reminder (1 hour before event)
export async function scheduleEventReminder(event: { id: string; title: string; date: string; time: string }) {
  const eventDate = new Date(`${event.date}T${event.time}`);
  const reminderDate = new Date(eventDate.getTime() - 60 * 60 * 1000); // 1 hour before

  if (reminderDate > new Date()) {
    await scheduleLocalNotification({
      title: '📅 Rappel d\'événement',
      body: `${event.title} commence dans 1 heure`,
      scheduleAt: reminderDate,
      id: parseInt(event.id.replace(/\D/g, '')) || Date.now(),
      extra: { type: 'event', eventId: event.id },
    });
  }
}

// Schedule daily event notification (6:00 AM)
export async function scheduleDailyEventNotification(event: { id: string; title: string; date: string; time: string }) {
  const eventDate = new Date(`${event.date}T06:00:00`);

  if (eventDate > new Date()) {
    await scheduleLocalNotification({
      title: '🏃 Événement du jour',
      body: `N'oubliez pas : ${event.title} à ${event.time}`,
      scheduleAt: eventDate,
      id: parseInt(event.id.replace(/\D/g, '')) + 1000 || Date.now(),
      extra: { type: 'daily', eventId: event.id },
    });
  }
}
