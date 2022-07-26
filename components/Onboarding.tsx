import React from 'react'
import { Image } from 'react-native'
import Onboarding from 'react-native-onboarding-swiper'

export default function OnboardingComponent(props) {
  return (
    <Onboarding
      showSkip={false}
      nextLabel='Дальше'
      pages={[
        {
          backgroundColor: '#3496eb',
          image: <Image style={{ width: 410, resizeMode: 'contain' }} source={require('../data/notifications_images/fat_programmer.png')} />,
          title: 'Ваш программист забывает мыться?',
          subtitle: 'Мы сделали приложение специально для таких случаев!',
        },
        {
          backgroundColor: '#34eb68',
          image: <Image style={{ height: 300, resizeMode: 'contain' }} source={require('../assets/onboarding_images/3d_person_walking.jpeg')} />,
          title: '«Что-что?» — спросите вы — «неужели это ТО САМОЕ нужное всем приложение?»',
          subtitle: 'Абсолютно верно! Это приложение от программистов для программистов!',
        },
        {
          backgroundColor: '#eb4034',
          image: <Image style={{ height: 300, resizeMode: 'contain' }} source={require('../assets/onboarding_images/anime_nya.png')} />,
          title: 'Но что если мой программист не захочет мыться? 😨 😈 ☠️',
          subtitle: 'Мы подготовили сюрприз: подарок, который вы получаете, если моетесь каждый день!',
        },
      ]}
      {...props}
    />
  )
}