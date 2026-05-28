// Web Bluetooth client for KairoMVP (firmware/kairo-mvp).
//
// UUIDs match firmware/kairo-mvp/ble_service.cpp.
// Use: const ble = new KairoBle(); await ble.connect();

const KAIRO_SERVICE_UUID = '4b414952-0001-0001-0001-000000000001'
const KAIRO_DATA_CHAR_UUID = '4b414952-0001-0001-0001-000000000002'
const KAIRO_CMD_CHAR_UUID = '4b414952-0001-0001-0001-000000000003'

export interface KairoSnapshot {
  ts: number
  hr: number
  spo2: number
  tempC: number
  steps: number
  battery: number
  motion: number
  state: 'calm' | 'active' | 'sleepy' | 'worried'
  worn: boolean
  event?: string
  isHistory?: boolean
}

export type KairoBleStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'unsupported'

type SnapshotListener = (snap: KairoSnapshot) => void
type StatusListener = (status: KairoBleStatus, msg?: string) => void
type HistoryDoneListener = () => void

export class KairoBle {
  private device: BluetoothDevice | null = null
  private dataChar: BluetoothRemoteGATTCharacteristic | null = null
  private commandChar: BluetoothRemoteGATTCharacteristic | null = null
  private snapListener: SnapshotListener | null = null
  private statusListener: StatusListener | null = null
  private historyDoneListener: HistoryDoneListener | null = null

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator
  }

  onSnapshot(fn: SnapshotListener) {
    this.snapListener = fn
  }

  onStatus(fn: StatusListener) {
    this.statusListener = fn
  }

  onHistoryDone(fn: HistoryDoneListener) {
    this.historyDoneListener = fn
  }

  getDeviceId(): string | null {
    return this.device?.id ?? null
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

      this.dataChar = await service.getCharacteristic(KAIRO_DATA_CHAR_UUID)
      this.dataChar.addEventListener('characteristicvaluechanged', this.handleNotify)
      await this.dataChar.startNotifications()

      this.commandChar = await service.getCharacteristic(KAIRO_CMD_CHAR_UUID)

      this.emitStatus('connected')

      await this.sendTimeSync()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      this.emitStatus('disconnected', msg)
      throw e
    }
  }

  async disconnect() {
    if (this.dataChar) {
      try {
        await this.dataChar.stopNotifications()
      } catch {
        /* noop */
      }
      this.dataChar.removeEventListener(
        'characteristicvaluechanged',
        this.handleNotify,
      )
      this.dataChar = null
    }
    this.commandChar = null
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect()
    }
    this.device = null
    this.emitStatus('idle')
  }

  async sendCommand(cmd: object): Promise<void> {
    if (!this.commandChar) return
    const json = JSON.stringify(cmd)
    const encoder = new TextEncoder()
    await this.commandChar.writeValue(encoder.encode(json))
  }

  async sendHug(): Promise<void> {
    await this.sendCommand({ cmd: 'parent_touch' })
  }

  async sendCheer(): Promise<void> {
    await this.sendCommand({ cmd: 'cheer' })
  }

  async sendBedtime(): Promise<void> {
    await this.sendCommand({ cmd: 'bedtime' })
  }

  async sendTimeSync(): Promise<void> {
    const now = new Date()
    await this.sendCommand({
      cmd: 'set_time',
      h: now.getHours(),
      m: now.getMinutes(),
      s: now.getSeconds(),
      d: now.getDate(),
      mo: now.getMonth() + 1,
      y: now.getFullYear(),
    })
  }

  private handleNotify = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic
    const value = target.value
    if (!value) return
    const text = new TextDecoder().decode(value)
    try {
      const raw = JSON.parse(text)

      if (raw.type === 'history_done') {
        this.historyDoneListener?.()
        return
      }

      const parsed: KairoSnapshot = {
        ts: raw.ts ?? Date.now(),
        hr: raw.hr ?? 0,
        spo2: raw.spo2 ?? 0,
        tempC: raw.tempC ?? raw.temp ?? 0,
        steps: raw.steps ?? 0,
        battery: raw.battery ?? 0,
        motion: raw.motion ?? 0,
        state: raw.state ?? 'calm',
        worn: raw.worn ?? false,
        event: raw.event,
        isHistory: raw.type === 'history',
      }
      this.snapListener?.(parsed)
    } catch {
      // Firmware sometimes sends partial frames; drop them silently.
    }
  }

  private emitStatus(status: KairoBleStatus, msg?: string) {
    this.statusListener?.(status, msg)
  }
}
