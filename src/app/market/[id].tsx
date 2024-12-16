import { View, Text, Alert, Modal, StatusBar } from 'react-native'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { useCameraPermissions, CameraView } from 'expo-camera'
import { api } from '@/services/api'
import { useEffect, useRef, useState } from 'react'
import { Loading } from '@/components/loading'
import { Cover } from '@/components/market/cover'
import { Details, PropsDetails } from '@/components/market/details'
import { Coupon } from '@/components/market/coupon'
import { Button } from '@/components/button'
import { ScrollView } from 'react-native-gesture-handler'
type DataPros = PropsDetails & {
  cover: string
}
export default function Market() {
  const [data, setData] = useState<DataPros>()
  const [coupon, setCoupon] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [couponIsFetching, setCouponIsFetching] = useState(false)
  const [isVisibileCameraModal, setIsVisibileCameraModal] = useState(false)
  const qrLock = useRef(false)

  const [_, requestPermission] = useCameraPermissions()

  const params = useLocalSearchParams<{ id: string }>()

  console.log(params.id)
  async function fetchMarket() {
    try {
      const { data } = await api.get(`/markets/${params.id}`)
      setData(data)
      setIsLoading(false)
    } catch (error) {
      console.log(error)
      Alert.alert('Erro', 'Não foi possivel carregar os dados', [
        { text: 'OK', onPress: () => router.back() }
      ])
    }
  }

  async function handleOpenCamera() {
    try {
      const { granted } = await requestPermission()

      if (!granted) {
        return Alert.alert('Câmera', 'Você precisa habilitar o uso da câmera.')
      }

      qrLock.current = false
      setIsVisibileCameraModal(true)
    } catch (error) {
      console.log(error)
      Alert.alert('Câmera', 'Não foi possível utilizar a câmera')
    }
  }

  async function getCoupon(id: string) {
    try {
      setCouponIsFetching(true)

      const { data } = await api.patch('/coupons/' + id)
      Alert.alert('Cupom', data.coupon)
      setCoupon(data.coupon)
    } catch (error) {
      console.log(error)
      Alert.alert('Erro', 'Não possível utilizar o cupom')
    } finally {
      setCouponIsFetching(false)
    }
  }

  function hadleUseCoupon(id: string) {
    setIsVisibileCameraModal(false)
    Alert.alert(
      'Câmera',
      'Não é possível reutilizar um cupom resgatado. Deseja realmente resgatar o cupom?',
      [
        { style: 'cancel', text: 'Não' },
        { text: 'Sim', onPress: () => getCoupon(id) }
      ]
    )
  }

  useEffect(() => {
    fetchMarket()
  }, [params.id, coupon])

  if (isLoading) {
    return <Loading />
  }

  if (!data) {
    return <Redirect href="/home" />
  }
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" hidden={isVisibileCameraModal} />
      <ScrollView showsHorizontalScrollIndicator={false}>
        <Cover uri={data.cover} />
        <Details data={data} />
        {coupon && <Coupon code={coupon} />}
      </ScrollView>
      <View style={{ padding: 32 }}>
        <Button onPress={handleOpenCamera}>
          <Button.Title>Ler QR Code</Button.Title>
        </Button>
      </View>

      <Modal style={{ flex: 1 }} visible={isVisibileCameraModal}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={({ data }) => {
            if (data && !qrLock.current) {
              qrLock.current = true
              setTimeout(() => hadleUseCoupon(data), 500)
            }
          }}
        />
        <View style={{ position: 'absolute', bottom: 32, left: 32, right: 32 }}>
          <Button
            onPress={() => setIsVisibileCameraModal(false)}
            isLoading={couponIsFetching}
          >
            <Button.Title>Voltar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  )
}
