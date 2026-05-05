// Web Bluetooth client for the Kairo Band (Track 1 firmware).
//
// UUIDs match firmware/track1-xiao/src/main.cpp. When real BLE pairing
// (SSP Passkey, spec §5.5) lands these stay the same — only the bonded-
// device list and pairing dialog change.
//
// Use: const ble = new KairoBle(); await ble.connect(onSnapshot);

const KAIRO_SERVICE_UUID = '5d7d0001-9b6e-4d51-92a1-7e73a1ce0001'
const KAIRO_SNAPSHOT_CHAR_UUID = '5d7d0002-9b6e-4d51-92a1-7e73a1ce0001'

export interface KairoSnapshot {
  ts: number
  hr: number
  spo2: number
  tempC: number
  steps: number
  battery: number
  state: 'calm' | 'active' | 'sleepy' | 'worried'
}

export type KairoBleStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'unsupported'

type SnapshotListener = (snap: KairoSnapshot) => void
type StatusListener = (status: KairoBleStatus, msg?: string) => void

export class KairoBle {
  private device: BluetoothDevice | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private snapListener: SnapshotListener | null = null
  private statusListener: StatusListener | null = null

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator
  }

  onSnapshot(fn: SnapshotListener) {
    this.snapListener = fn
  }

  onStatus(fn: StatusListener) {
    this.statusListener = fn
  }

  async connect(): Promise<void> {
    if (!KairoBle.isSupported()) {
      this.emitStatus('unsupported', 'Web Bluetooth не поддерживается этим браузером (нужен Chrome / Edge на десктопе)')
      return
    }

    this.emitStatus('connecting')
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [KAIRO_SERVICE_UUID] }],
        optionalServices: [KAIRO_SERVICE_UUID],
      })
      this.device.addEventListener('gattserverdisconnected', () => {
        this.emitStatus('disconnected')
      })

      const server = await this.device.gatt!.connect()
      const service = await server.getPrimaryService(KAIRO_SERVICE_UUID)
      this.characteristic = await service.getCharacteristic(KAIRO_SNAPSHOT_CHAR_UUID)

      this.characteristic.addEventListener('characteristicvaluechanged', this.handleNotify)
      await this.characteristic.startNotifications()

      this.emitStatus('connected')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      this.emitStatus('disconnected', msg)
      throw e
    }
  }

  async disconnect() {
    if (this.characteristic) {
      try {
        await this.characteristic.stopNotifications()
      } catch {
        /* noop */
      }
      this.characteristic.removeEventListener(
        'characteristicvaluechanged',
        this.handleNotify,
      )
      this.characteristic = null
    }
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect()
    }
    this.device = null
    this.emitStatus('idle')
  }

  private handleNotify = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic
    const value = target.value
    if (!value) return
    const text = new TextDecoder().decode(value)
    try {
      const parsed = JSON.parse(text) as KairoSnapshot
      this.snapListener?.(parsed)
    } catch {
      // Firmware sometimes sends partial frames; drop them silently.
    }
  }

  private emitStatus(status: KairoBleStatus, msg?: string) {
    this.statusListener?.(status, msg)
  }
}
