import React from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'
import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
import * as Notifications from 'expo-notifications'
import reminders from './data/notifications'
import { Picker, PickerModes, Switch } from 'react-native-ui-lib'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer'
import { formatDuration } from './utils'

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
  const [status, setStatus] = React.useState<BackgroundFetch.BackgroundFetchStatus | null>(null)
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

  React.useEffect(() => {
    getNotificationTime().then(setNotificationTime)
  }, [])


  const nextNotificationTime = () => {
    const currentTime = new Date()
    const startOfCurrentDay = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate())
    const secondsFromStartOfDay = Date.now() - startOfCurrentDay.getTime()
    const secondsToEndOfDay = 1000 * 60 * 60 * 24 - Date.now()
    if(secondsFromStartOfDay < notificationTime) {
      return notificationTime - secondsFromStartOfDay
    } else {
      return secondsToEndOfDay + notificationTime
    }
  }

  return (
    <View style={styles.screen}>
      <CountdownCircleTimer
        isPlaying
        key={Math.random()}
        duration={60 * 60 * 24}
        initialRemainingTime={Math.ceil(nextNotificationTime() / 1000)}
        colors={['#004777', '#F7B801', '#A30000', '#A30000']}
        colorsTime={[7, 5, 2, 0]}
      >
        {({ remainingTime }) => (
          <Text style={styles.timer}>{formatDuration(remainingTime)}</Text>
        )}
      </CountdownCircleTimer>
      <View style={styles.properties}>
        <View style={styles.flex}>
          <Text style={{ ...styles.property, marginTop: 7 }}>Время:</Text>
          <Picker
            value={values.find(z => z.value === notificationTime)}
            placeholder={'Placeholder'}
            onChange={e => setNotificationTime(e.value)}
            useWheelPicker={true}
            useNativePicker={false}
            selectionLimit={3}
            mode={PickerModes.SINGLE}
          // editable={isRegistered}
          >
            {values.map((e, i) => (
              <Picker.Item key={i} {...e} />
            ))}
          </Picker>
        </View>
        <View style={styles.flex}>
          <Text style={styles.property}>Присылать уведомление:</Text>
          <Switch 
            value={isRegistered} 
            onValueChange={async enable => {
              if (enable) {
                await registerBackgroundFetchAsync()
              } else {
                await unregisterBackgroundFetchAsync()
              }
              checkStatusAsync()
            }}
            disabled={status !== 3}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  properties: {
    display: 'flex',
    width: '100%',
    paddingHorizontal: 40,
    marginTop: 50
  },
  flex: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0
  },
  property: {
    fontSize: 16
  },

  textContainer: {
    margin: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },

  timer: {
    fontSize: 22,
    fontWeight: 'bold',
  }
})