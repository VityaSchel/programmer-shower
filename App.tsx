import React from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'
import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
import * as Notifications from 'expo-notifications'
import reminders from './data/notifications'
// import DateTimePicker from '@react-native-community/datetimepicker'
import { Picker, PickerModes } from 'react-native-ui-lib'
import AsyncStorage from '@react-native-async-storage/async-storage'
import ConicalGradient from 'react-native-conical-gradient-progress'


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

const values = [
  { value: 1000 * 60 * 60 * 7, label: 'Утром (7:00)' },
  { value: 1000 * 60 * 60 * 19, label: 'Вечером (19:00)' },
  { value: 1000 * 60 * 60 * 23, label: 'Ночью (23:00)' }
]

async function getNotificationTime() {
  const time = await AsyncStorage.getItem('notification_time')
  if (time === null) return values[0].value
  else return values.find(z => z.value === Number(time)).value ?? values[0].value
}

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
  const [notificationTime, setNotificationTime] = React.useState<number>()

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
    getNotificationTime().then(setNotificationTime)
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
      <ConicalGradient 
        size={150}
        width={10}
        fill={100}
        prefill={10}
        beginColor="#ff0000"
        endColor="#0000ff"
        segments={20}
        backgroundColor="rgba(255, 255, 255, 0.2)"
        linecap="round"
      >
        {fill => (
          <View>
            <Text>
              16 segments{'\n'}
              {fill.toFixed(0)}%`
            </Text>
          </View>
        )}
      </ConicalGradient>
      <Picker
        // value={notificationTime.map(o => values.find(z => z.value === o))}
        value={values.find(z => z.value === notificationTime)}
        placeholder={'Placeholder'}
        onChange={e => setNotificationTime(e.value)}
        useWheelPicker={true}
        useNativePicker={false}
        selectionLimit={3}
        // migrateTextField
        mode={PickerModes.SINGLE}
      >
        {values.map((e,i) => (
          <Picker.Item key={i} {...e} />
        ))}
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