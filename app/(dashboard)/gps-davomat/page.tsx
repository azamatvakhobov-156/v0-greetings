"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import { 
  MapPin, 
  Clock, 
  Check, 
  X, 
  AlertCircle, 
  Navigation,
  LogIn,
  LogOut,
  History,
  Settings,
  RefreshCw
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface SchoolLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
  is_active: boolean
}

interface GpsLog {
  id: string
  staff_id: string
  check_type: "check_in" | "check_out"
  latitude: number
  longitude: number
  distance_meters: number
  is_within_range: boolean
  device_info: string | null
  created_at: string
}

interface StaffInfo {
  id: string
  full_name: string
  position: string
}

// Haversine formula - 2 nuqta orasidagi masofani hisoblash (metrda)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Yer radiusi metrda
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function GpsDavomatPage() {
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [schoolLocation, setSchoolLocation] = useState<SchoolLocation | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [isWithinRange, setIsWithinRange] = useState(false)
  const [todayLogs, setTodayLogs] = useState<GpsLog[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newSchoolLat, setNewSchoolLat] = useState("")
  const [newSchoolLng, setNewSchoolLng] = useState("")
  const [newSchoolRadius, setNewSchoolRadius] = useState("100")
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const supabase = createClient()

  // Maktab joylashuvini olish
  const fetchSchoolLocation = useCallback(async () => {
    const { data, error } = await supabase
      .from("school_location")
      .select("*")
      .eq("is_active", true)
      .single()

    if (data && !error) {
      setSchoolLocation(data)
      setNewSchoolLat(data.latitude.toString())
      setNewSchoolLng(data.longitude.toString())
      setNewSchoolRadius(data.radius_meters.toString())
    }
  }, [supabase])

  // Staff ma'lumotlarini olish
  const fetchStaffInfo = useCallback(async () => {
    const userStr = localStorage.getItem("user")
    if (!userStr) return

    const userData = JSON.parse(userStr)
    setIsAdmin(userData.role === "admin" || userData.role === "director")

    const { data, error } = await supabase
      .from("staff")
      .select("id, full_name, position")
      .eq("profile_id", userData.id)
      .single()

    if (data && !error) {
      setStaffInfo(data)
    }
  }, [supabase])

  // Bugungi loglarni olish
  const fetchTodayLogs = useCallback(async () => {
    if (!staffInfo?.id) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from("gps_attendance_log")
      .select("*")
      .eq("staff_id", staffInfo.id)
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false })

    if (data && !error) {
      setTodayLogs(data)
    }
  }, [supabase, staffInfo?.id])

  // GPS joylashuvini olish
  const getCurrentLocation = useCallback(() => {
    setIsLoadingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError("Brauzeringiz GPS'ni qo'llab-quvvatlamaydi")
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ latitude, longitude })
        setIsLoadingLocation(false)

        // Masofani hisoblash
        if (schoolLocation) {
          const dist = calculateDistance(
            latitude,
            longitude,
            schoolLocation.latitude,
            schoolLocation.longitude
          )
          setDistance(Math.round(dist))
          setIsWithinRange(dist <= schoolLocation.radius_meters)
        }
      },
      (error) => {
        setIsLoadingLocation(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("GPS ruxsati berilmagan. Iltimos, brauzer sozlamalaridan ruxsat bering.")
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError("Joylashuv ma'lumotlari mavjud emas")
            break
          case error.TIMEOUT:
            setLocationError("Joylashuvni aniqlash vaqti tugadi")
            break
          default:
            setLocationError("Noma'lum xatolik yuz berdi")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [schoolLocation])

  // Check-in/Check-out
  const handleCheck = async (checkType: "check_in" | "check_out") => {
    if (!currentLocation || !staffInfo?.id) return

    setIsChecking(true)

    const { error } = await supabase.from("gps_attendance_log").insert({
      staff_id: staffInfo.id,
      check_type: checkType,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      distance_meters: distance,
      is_within_range: isWithinRange,
      device_info: navigator.userAgent,
    })

    if (!error) {
      await fetchTodayLogs()
    }

    setIsChecking(false)
  }

  // Maktab joylashuvini saqlash
  const saveSchoolLocation = async () => {
    setIsSavingSettings(true)

    const lat = parseFloat(newSchoolLat)
    const lng = parseFloat(newSchoolLng)
    const radius = parseInt(newSchoolRadius)

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      setIsSavingSettings(false)
      return
    }

    if (schoolLocation) {
      await supabase
        .from("school_location")
        .update({
          latitude: lat,
          longitude: lng,
          radius_meters: radius,
          updated_at: new Date().toISOString(),
        })
        .eq("id", schoolLocation.id)
    } else {
      await supabase.from("school_location").insert({
        name: "Asosiy bino",
        latitude: lat,
        longitude: lng,
        radius_meters: radius,
      })
    }

    await fetchSchoolLocation()
    setSettingsOpen(false)
    setIsSavingSettings(false)
  }

  // Hozirgi joylashuvni maktab joylashuvi sifatida saqlash
  const useCurrentAsSchoolLocation = () => {
    if (currentLocation) {
      setNewSchoolLat(currentLocation.latitude.toString())
      setNewSchoolLng(currentLocation.longitude.toString())
    }
  }

  useEffect(() => {
    fetchSchoolLocation()
    fetchStaffInfo()
  }, [fetchSchoolLocation, fetchStaffInfo])

  useEffect(() => {
    if (staffInfo?.id) {
      fetchTodayLogs()
    }
  }, [staffInfo?.id, fetchTodayLogs])

  useEffect(() => {
    if (schoolLocation) {
      getCurrentLocation()
    }
  }, [schoolLocation, getCurrentLocation])

  // Bugungi check-in va check-out
  const todayCheckIn = todayLogs.find((l) => l.check_type === "check_in")
  const todayCheckOut = todayLogs.find((l) => l.check_type === "check_out")

  return (
    <>
      <Header
        title="GPS Davomat"
        description="Joylashuv orqali avtomatik davomat tizimi"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Joylashuv xatosi */}
        {locationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>GPS xatosi</AlertTitle>
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        {/* Maktab joylashuvi sozlanmagan */}
        {!schoolLocation && isAdmin && (
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertTitle>Maktab joylashuvi sozlanmagan</AlertTitle>
            <AlertDescription>
              GPS davomat tizimi ishlashi uchun maktab koordinatalarini kiritish kerak.
            </AlertDescription>
          </Alert>
        )}

        {/* Asosiy kartochkalar */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Joriy joylashuv */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-primary" />
                  Joriy joylashuv
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={getCurrentLocation}
                  disabled={isLoadingLocation}
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      isLoadingLocation && "animate-spin"
                    )}
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingLocation ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Joylashuv aniqlanmoqda...
                </div>
              ) : currentLocation ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Lat: {currentLocation.latitude.toFixed(6)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Lng: {currentLocation.longitude.toFixed(6)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Joylashuv aniqlanmagan
                </p>
              )}
            </CardContent>
          </Card>

          {/* Masofa */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Maktabgacha masofa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {distance !== null ? (
                <div className="space-y-2">
                  <p className="text-3xl font-bold">
                    {distance < 1000
                      ? `${distance} m`
                      : `${(distance / 1000).toFixed(2)} km`}
                  </p>
                  <Badge
                    className={cn(
                      isWithinRange
                        ? "bg-chart-2/10 text-chart-2"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {isWithinRange ? (
                      <>
                        <Check className="mr-1 h-3 w-3" />
                        Hududda
                      </>
                    ) : (
                      <>
                        <X className="mr-1 h-3 w-3" />
                        Hududdan tashqarida
                      </>
                    )}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {schoolLocation
                    ? "Joylashuv aniqlanmoqda..."
                    : "Maktab joylashuvi sozlanmagan"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Bugungi holat */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Bugungi holat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kirish:</span>
                  {todayCheckIn ? (
                    <Badge className="bg-chart-2/10 text-chart-2">
                      {format(new Date(todayCheckIn.created_at), "HH:mm")}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Belgilanmagan</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Chiqish:</span>
                  {todayCheckOut ? (
                    <Badge className="bg-chart-3/10 text-chart-3">
                      {format(new Date(todayCheckOut.created_at), "HH:mm")}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Belgilanmagan</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Check-in/Check-out tugmalari */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Davomat belgilash</CardTitle>
            <CardDescription>
              {staffInfo
                ? `${staffInfo.full_name} - ${staffInfo.position}`
                : "Xodim ma'lumotlari yuklanmoqda..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="gap-2"
                onClick={() => handleCheck("check_in")}
                disabled={
                  !currentLocation ||
                  !staffInfo ||
                  isChecking ||
                  !!todayCheckIn
                }
              >
                <LogIn className="h-5 w-5" />
                Kirish belgilash
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={() => handleCheck("check_out")}
                disabled={
                  !currentLocation ||
                  !staffInfo ||
                  isChecking ||
                  !todayCheckIn ||
                  !!todayCheckOut
                }
              >
                <LogOut className="h-5 w-5" />
                Chiqish belgilash
              </Button>

              {isAdmin && (
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="lg" className="gap-2 ml-auto">
                      <Settings className="h-5 w-5" />
                      Sozlamalar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Maktab joylashuvi sozlamalari</DialogTitle>
                      <DialogDescription>
                        GPS davomat tizimi uchun maktab koordinatalarini kiriting
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Latitude (kenglik)</Label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={newSchoolLat}
                          onChange={(e) => setNewSchoolLat(e.target.value)}
                          placeholder="41.311081"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Longitude (uzunlik)</Label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={newSchoolLng}
                          onChange={(e) => setNewSchoolLng(e.target.value)}
                          placeholder="69.240562"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Radius (metrda)</Label>
                        <Input
                          type="number"
                          value={newSchoolRadius}
                          onChange={(e) => setNewSchoolRadius(e.target.value)}
                          placeholder="100"
                        />
                      </div>
                      {currentLocation && (
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={useCurrentAsSchoolLocation}
                        >
                          <MapPin className="h-4 w-4" />
                          Hozirgi joylashuvni ishlatish
                        </Button>
                      )}
                      <Button
                        className="w-full"
                        onClick={saveSchoolLocation}
                        disabled={isSavingSettings}
                      >
                        {isSavingSettings ? "Saqlanmoqda..." : "Saqlash"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {!isWithinRange && currentLocation && schoolLocation && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Siz maktab hududidan tashqaridasiz. Davomat belgilash mumkin, lekin
                  bu qayd etiladi.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Bugungi tarix */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-5 w-5" />
              Bugungi tarix - {format(new Date(), "d MMMM yyyy", { locale: uz })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Vaqt</TableHead>
                    <TableHead>Tur</TableHead>
                    <TableHead>Masofa</TableHead>
                    <TableHead>Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayLogs.map((log) => (
                    <TableRow key={log.id} className="border-border">
                      <TableCell>
                        {format(new Date(log.created_at), "HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.check_type === "check_in" ? "Kirish" : "Chiqish"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.distance_meters < 1000
                          ? `${Math.round(log.distance_meters)} m`
                          : `${(log.distance_meters / 1000).toFixed(2)} km`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            log.is_within_range
                              ? "bg-chart-2/10 text-chart-2"
                              : "bg-destructive/10 text-destructive"
                          )}
                        >
                          {log.is_within_range ? "Hududda" : "Tashqarida"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Bugun hali davomat belgilanmagan
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
