import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
import * as Notifications from 'expo-notifications'
import reminders from './data/notifications'
import { Picker, PickerModes, PickerValue, Switch, Button } from 'react-native-ui-lib'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Timer from './components/Timer'
import { formatDuration } from './utils'
import OnboardingComponent from './components/Onboarding'

const BACKGROUND_FETCH_TASK = 'background-fetch'

const backgroundTask = async () => {
  if (await checkIfTimeIsUp()) {
    await notify()
  } else {
    return BackgroundFetch.BackgroundFetchResult.NoData
  }
  return BackgroundFetch.BackgroundFetchResult.NewData
}
TaskManager.defineTask(BACKGROUND_FETCH_TASK, backgroundTask)

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  })
})

const notify = async () => {
  const notificationTime = await getGoalTime()

  const randomReminder = reminders[Math.floor(Math.random() * reminders.length)]
  console.log('notify', { content: {
    title: randomReminder.title,
    body: randomReminder.body
  } })
  Notifications.scheduleNotificationAsync({
    content: {
      title: randomReminder.title,
      body: randomReminder.body
    },
    trigger: null
  })
  await AsyncStorage.setItem('notified', 'true')
  await AsyncStorage.setItem('last_notified_time', String(startOfCurrentDay().getTime() + notificationTime))
}

const values = [
  { value: 1000 * 60 * 60 * 7, label: 'Утром (7:00)' },
  { value: 1000 * 60 * 60 * 19, label: 'Вечером (19:00)' },
  { value: 1000 * 60 * 60 * 23, label: 'Ночью (23:00)' }
]

async function getGoalTime() {
  const time = await AsyncStorage.getItem('goal_time')
  if (time === null) {
    await AsyncStorage.setItem('goal_time', String(values[0].value))
    return values[0].value
  } else {
    const notificationTime = Number(time)
    return Number.isFinite(notificationTime) ? notificationTime : values[0].value
  }
}

async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 15,
    stopOnTerminate: false,
    startOnBoot: true,
  })
}

async function unregisterBackgroundFetchAsync() {
  return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK)
}

async function checkState() {
  const notificationTime = await getGoalTime()
  const timeIsUp = (Date.now() - startOfCurrentDay().getTime()) > notificationTime
  if (timeIsUp) {
    const isNotifiedString = await AsyncStorage.getItem('notified')
    const isNotified = isNotifiedString === 'true'

    const notificationTimeRaw = Number(await AsyncStorage.getItem('last_notified_time'))
    const notificationTime = Number.isFinite(notificationTimeRaw) ? notificationTimeRaw : 0

    if (!isNotified) {
      if (!withinCurrentDay(notificationTime)) {
        if (isNotifiedString === null) {
          return 'NO_DATA'
        } else {
          return 'TIME_IS_UP'
        }
      } else {
        return 'NOT_CURRENT_DAY'
      }
    } else {
      return 'NOTIFIED'
    }
  } else {
    return 'CONTINUE'
  }
}

async function checkIfTimeIsUp() {
  return (await checkState()) === 'TIME_IS_UP'
}

const nextNotificationTime = (notificationTime, currentTime = new Date()) => {
  const secondsFromStartOfDay = currentTime.getTime() - startOfCurrentDay().getTime()
  const secondsToEndOfDay = 1000 * 60 * 60 * 24 - secondsFromStartOfDay
  if (secondsFromStartOfDay < notificationTime) {
    return notificationTime - secondsFromStartOfDay
  } else {
    return secondsToEndOfDay + notificationTime
  }
}

const withinCurrentDay = (dateTime: number) => {
  const date = new Date(dateTime)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

const startOfCurrentDay = () => {
  const currentTime = new Date()
  return new Date(
    currentTime.getFullYear(), 
    currentTime.getMonth(), 
    currentTime.getDate()
  )
}

let ch_ = false

export default function BackgroundFetchScreen() {
  const [onboardingScreen, setIsOnboardingScreen] = React.useState(false)
  const [isRegistered, setIsRegistered] = React.useState(false)
  const [status, setStatus] = React.useState<BackgroundFetch.BackgroundFetchStatus | null>(null)
  const [notificationTime, setNotificationTime] = React.useState<number>()
  const [timeIsUp, setTimeIsUp] = React.useState(true)

  React.useEffect(() => {
    checkBackgroundTaskStatusAsync()
    checkState().then(state => {
      if (state === 'TIME_IS_UP' || state === 'NOTIFIED')
        setTimeIsUp(true)
      else
        setTimeIsUp(false)
    })
  }, [])

  const checkBackgroundTaskStatusAsync = async () => {
    const status = await BackgroundFetch.getStatusAsync()
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK)
    setStatus(status)
    setIsRegistered(isRegistered)
  }

  React.useEffect(() => {
    getGoalTime().then(setNotificationTime)
  }, [])

  const handleDone = () => {
    ch_ = false
    AsyncStorage.setItem('notified', 'false')
    setTimeIsUp(false)
  }

  const handleUpdate = async () => {
    if (await checkIfTimeIsUp() && !ch_) {
      ch_ = true
      await AsyncStorage.setItem('notified', 'true')
      await AsyncStorage.setItem('last_notified_time', String(startOfCurrentDay().getTime() + notificationTime))
      setTimeIsUp(true)
      const shouldSendNotification = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK)
      if (shouldSendNotification) {
        await notify()
      }
    }
  }

  const handleChangeGoalTime = (value: number) => {
    AsyncStorage.setItem('goal_time', String(value))
    setNotificationTime(value)
    AsyncStorage.setItem('notified', 'false')
    AsyncStorage.removeItem('last_notified_time')
  }

  React.useEffect(() => {
    AsyncStorage.getItem('first_time_open').then(isFirstTime => {
      if(isFirstTime === null) {
        setIsOnboardingScreen(true)
        AsyncStorage.setItem('first_time_open', 'false')
        BackgroundFetch.getStatusAsync().then(status => {
          if(status === 3) {
            registerBackgroundFetchAsync().then(() => setIsRegistered(true))
          }
        })
      }
    })
  }, [])

  // AsyncStorage.getItem('goal_time', (_, z) => console.log('goal_time', z))
  // AsyncStorage.getItem('notified', (_, z) => console.log('notified', z))
  // AsyncStorage.getItem('last_notified_time', (_, z) => console.log('last_notified_time', z))
  // console.log('timeIsUp', timeIsUp)
  // console.log('notificationTime', notificationTime)
  // console.log('next', nextNotificationTime(notificationTime))

  return (
    onboardingScreen
      ? <OnboardingComponent onDone={() => setIsOnboardingScreen(false)} />
      : (
        <View style={styles.screen}>
          <Button onPress={() => AsyncStorage.clear()} label='Remove' />
          <Button onPress={() => handleChangeGoalTime(Date.now() - startOfCurrentDay().getTime() + 10 * 1000)} label='Set to 10 seconds from now' />
          <Timer
            isPlaying={!timeIsUp}
            key={Math.random()}
            duration={60 * 60 * 24}
            initialRemainingTime={timeIsUp ? 0 : Math.ceil(nextNotificationTime(notificationTime) / 1000)}
            colors={['#004777', '#02d475']}
            colorsTime={[60 * 60 * 24, 0]}
            size={220}
            onUpdate={handleUpdate}
          >
            {({ remainingTime }) => (
              <Text style={styles.timer}>
                {timeIsUp 
                  ? 'Время мыться!'
                  : formatDuration(remainingTime)
                }
              </Text>
            )}
          </Timer>
          {timeIsUp && (
            <View style={styles.doneButton}>
              <Button
                label='Готово!' 
                size={Button.sizes.large}
                onPress={handleDone}
              />
            </View>
          )}
          <View style={styles.properties}>
            <View style={styles.flex}>
              <Text style={{ ...styles.property, marginTop: 7 }}>Время:</Text>
              <Picker
                value={values.find(z => z.value === notificationTime)}
                placeholder={'Выбрать'}
                onChange={({ value }: { value: PickerValue }) => handleChangeGoalTime(Number(value))}
                useWheelPicker={true}
                useNativePicker={false}
                selectionLimit={3}
                mode={PickerModes.SINGLE}
                editable={!timeIsUp}
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
                  checkBackgroundTaskStatusAsync()
                }}
                disabled={status !== 3 || timeIsUp}
              />
            </View>
          </View>
          <Text style={{ opacity: 0, fontSize: 0 }}>Arasfon хуесос ❤️</Text>
        </View>
      )
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

  doneButton: {
    marginTop: 30,
  },
  boldText: {
    fontWeight: 'bold',
  },

  timer: {
    fontSize: 22,
    fontWeight: 'bold',
  }
})