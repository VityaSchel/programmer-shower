import React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import Svg, { Path, LinearGradient, Stop, Defs } from 'react-native-svg'
import Constants from 'expo-constants'
import { useCountdown, Props } from 'react-native-countdown-circle-timer'

export default function Timer({ duration, ...props }: Props) {
  const countdown = useCountdown({ duration, ...props, colors: 'url(#timer-gradient)' })
  const {
    path,
    pathLength,
    stroke,
    strokeDashoffset,
    remainingTime,
    elapsedTime,
    size,
    strokeWidth,
  } = countdown

  return (
    <View style={styles.container}>
      <View style={{ width: size, position: 'relative' }}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="timer-gradient" x1="1" y1="0" x2="0" y2="0">
              <Stop offset="5%" stopColor="#0275d4" />
              <Stop offset="95%" stopColor="#02d475" />
            </LinearGradient>
          </Defs>
          <Path
            d={path}
            fill="none"
            stroke="#d9d9d9"
            strokeWidth={strokeWidth}
          />
          {elapsedTime !== duration && (
            <Path
              d={path}
              fill="none"
              stroke={stroke}
              strokeLinecap='round'
              strokeWidth={strokeWidth}
              strokeDasharray={pathLength}
              strokeDashoffset={strokeDashoffset}
            />
          )}
        </Svg>
        <View style={styles.time}>
          {props.children(countdown)}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  time: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%'
  }
})