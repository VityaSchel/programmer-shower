import React from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'
import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
import * as Notifications from 'expo-notifications'
import reminders from './data/notifications'
// import DateTimePicker from '@react-native-community/datetimepicker'
import Picker from 'react-native-ui-lib/picker'
import AsyncStorage from '@react-native-async-storage/async-storage'

const BACKGROUND_FETCH_TASK = 'background-fetch'

// 1. Define the task by providing a name and the function that should be executed
// Note: This needs to be called in the global scope (e.g outside of your React components)
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const now = Date.now()

  const randomReminder = reminders[Math.floor(Math.random() * reminders.length)]
  Notifications.scheduleNotificationAsync({ 
    content: {
      title: randomReminder.title,
      body: randomReminder.body
    },
    trigger: null
  })

  return BackgroundFetch.BackgroundFetchResult.NewData
})

async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 10,
    stopOnTerminate: false,
    startOnBoot: true,
  })
}

async function unregisterBackgroundFetchAsync() {
  return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK)
}

export default function BackgroundFetchScreen() {
  const [isRegistered, setIsRegistered] = React.useState(false)
  const [status, setStatus] = React.useState(null)
  const [notificationTime, setNotificationTime] = React.useState<number[]>([])

  React.useEffect(() => {
    checkStatusAsync()
  }, [])

  const checkStatusAsync = async () => {
    const status = await BackgroundFetch.getStatusAsync()
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK)
    setStatus(status)
    setIsRegistered(isRegistered)
  }

  const toggleFetchTask = async () => {
    if (isRegistered) {
      await unregisterBackgroundFetchAsync()
    } else {
      await registerBackgroundFetchAsync()
    }

    checkStatusAsync()
  }

  React.useEffect(() => { 
    AsyncStorage.
    AsyncStorage.getItem('notification_time').then(time => {
      if (!Number.isFinite(retreivedTime)) retreivedTime = 0
      setNotificationTime(retreivedTime)
    })
  }, [])

  return (
    <View style={styles.screen}>
      <View style={styles.textContainer}>
        <Text>
          Background fetch status:{' '}
          <Text style={styles.boldText}>
            {status && BackgroundFetch.BackgroundFetchStatus[status]}
          </Text>
        </Text>
        <Text>
          Background fetch task name:{' '}
          <Text style={styles.boldText}>
            {isRegistered ? BACKGROUND_FETCH_TASK : 'Not registered yet!'}
          </Text>
        </Text>
      </View>
      <View style={styles.textContainer}></View>
      <Button
        title={isRegistered ? 'Unregister BackgroundFetch task' : 'Register BackgroundFetch task'}
        onPress={toggleFetchTask}
      />
      {/* <DateTimePicker 
        mode='time'
        value={new Date(notificationTime)}
        onChange={(_, date) => setNotificationTime(date.getTime())}
        display='clock'
      /> */}
      <Picker
        value={notificationTime}
        placeholder={'Placeholder'}
        onChange={setNotificationTime}
        useWheelPicker={true}
        useNativePicker={false}
        mode='MULTI'
      >
        <Picker.Item key={1} value='123' label='Утром (7:00)' />
        <Picker.Item key={2} value='123' label='Вечером (19:00)' />
        <Picker.Item key={2} value='123' label='Ночью (23:00)' />
      </Picker>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  textContainer: {
    margin: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
})