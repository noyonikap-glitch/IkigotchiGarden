/**
 * Notification Scheduler Utility
 * Centralized notification scheduling logic for plant watering reminders
 */
import * as Notifications from 'expo-notifications';
import { loadPlants, savePlants } from './storage';

/**
 * Schedules a notification for a single plant
 * Cancels existing notification if present before scheduling new one
 *
 * @param {Object} plant - Plant object with id, name, wateringInterval, lastWatered
 * @returns {Promise<string|null>} - Notification ID or null if failed
 */
export async function scheduleNotificationForPlant(plant) {
  try {
    // Cancel existing notification if it exists
    if (plant.notifId) {
      await Notifications.cancelScheduledNotificationAsync(plant.notifId);
    }

    // Calculate next watering date
    const lastWatered = new Date(plant.lastWatered);
    const intervalDays = plant.wateringInterval || 7;

    const nextWateringDate = new Date(lastWatered);

    // Handle "test" mode (very short intervals for testing)
    if (intervalDays < 0.01) {
      // Less than ~14 minutes, assume test mode
      // Schedule based on current time + interval in minutes
      const now = new Date();
      const intervalMinutes = intervalDays * 24 * 60;
      nextWateringDate.setTime(now.getTime() + Math.ceil(intervalMinutes) * 60 * 1000);
    } else {
      // Normal mode: add days to last watered date
      nextWateringDate.setDate(lastWatered.getDate() + intervalDays);
    }

    // Schedule notification with NEW API format (fixes deprecation warning)
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Water ${plant.name} 🌿`,
        body: `${plant.species || plant.genus || 'Your plant'} is due for watering today.`,
        data: { plantId: plant.id }, // For navigation when notification is tapped
      },
      trigger: {
        type: 'date',
        date: nextWateringDate,
      },
    });

    console.log(`[Scheduler] Scheduled notification for ${plant.name} at ${nextWateringDate.toLocaleString()}`);
    return notifId;
  } catch (error) {
    console.error(`[Scheduler] Error scheduling notification for ${plant.name}:`, error);
    return null;
  }
}

/**
 * Cancels a notification for a single plant
 *
 * @param {Object} plant - Plant object with notifId
 */
export async function cancelNotificationForPlant(plant) {
  try {
    if (plant.notifId) {
      await Notifications.cancelScheduledNotificationAsync(plant.notifId);
      console.log(`[Scheduler] Cancelled notification for ${plant.name}`);
    }
  } catch (error) {
    console.error(`[Scheduler] Error cancelling notification for ${plant.name}:`, error);
  }
}

/**
 * Cancels all existing notifications and schedules new ones for all plants
 * Called on app launch to ensure notifications are in sync with plant data
 *
 * @param {Array} plants - Array of plant objects
 */
export async function scheduleAllNotifications(plants) {
  try {
    console.log(`[Scheduler] Scheduling notifications for ${plants.length} plants...`);

    // Cancel all existing notifications (clean slate)
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Load fresh plant data
    const currentPlants = await loadPlants();

    // Schedule notification for each plant
    const updatedPlants = await Promise.all(
      currentPlants.map(async (plant) => {
        const notifId = await scheduleNotificationForPlant(plant);
        return { ...plant, notifId };
      })
    );

    // Save updated plants with new notification IDs
    await savePlants(updatedPlants);

    console.log(`[Scheduler] Successfully scheduled ${updatedPlants.length} notifications`);
  } catch (error) {
    console.error('[Scheduler] Error scheduling all notifications:', error);
  }
}
