import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

// Bu API nuqtasi FaceID qurilmasi (yoki uni boshqaruvchi dastur) tomonidan
// har safar kimdir yuzi orqali tanilganda chaqiriladi.
//
// So'rov namunasi (POST):
// {
//   "api_key": "FACEID_API_KEY muhit o'zgaruvchisiga mos maxfiy kalit",
//   "person_type": "student" | "staff",
//   "person_id": "students yoki staff jadvalidagi UUID",
//   "event": "in" | "out",
//   "timestamp": "2026-07-22T08:15:00+05:00"   (ixtiyoriy, berilmasa hozirgi vaqt olinadi)
// }
//
// Qurilma odatda "person_id" o'rniga o'z xodim/o'quvchi kodini yuboradi —
// shu holatda uni avval students/staff jadvalida moslashtirish kerak bo'ladi
// (masalan alohida "external_code" ustuni orqali). Hozircha to'g'ridan-to'g'ri
// tizimning ichki UUID'sini talab qiladi.

function unauthorized() {
    return NextResponse.json({ error: 'Ruxsat etilmagan (notog\'ri api_key)' }, { status: 401 })
}

export async function POST(request: NextRequest) {
    try {
          const body = await request.json()
          const { api_key, person_type, person_id, event, timestamp } = body

      const expectedKey = process.env.FACEID_API_KEY
          if (!expectedKey || api_key !== expectedKey) {
                  return unauthorized()
          }

      if (person_type !== 'student' && person_type !== 'staff') {
              return NextResponse.json({ error: 'person_type student yoki staff bolishi kerak' }, { status: 400 })
      }
          if (!person_id) {
                  return NextResponse.json({ error: 'person_id talab qilinadi' }, { status: 400 })
          }
          if (event !== 'in' && event !== 'out') {
                  return NextResponse.json({ error: 'event in yoki out bolishi kerak' }, { status: 400 })
          }

      const now = timestamp ? new Date(timestamp) : new Date()
          const dateStr = now.toISOString().slice(0, 10)
          const timeStr = now.toTimeString().slice(0, 8)

      const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

      const table = person_type === 'student' ? 'student_attendance' : 'staff_attendance'
          const idColumn = person_type === 'student' ? 'student_id' : 'staff_id'
          const conflictTarget = person_type === 'student' ? 'student_id,date' : 'staff_id,date'

      const row: Record<string, string> = {
              [idColumn]: person_id,
              date: dateStr,
              status: 'present',
              source: 'faceid',
      }
          if (event === 'in') row.check_in_time = timeStr
          if (event === 'out') row.check_out_time = timeStr

      const { error } = await supabase.from(table).upsert(row, { onConflict: conflictTarget })

      if (error) {
              return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
              success: true,
              person_type,
              person_id,
              event,
              date: dateStr,
              time: timeStr,
      })
    } catch {
          return NextResponse.json({ error: 'Sorovni qayta ishlashda xatolik' }, { status: 400 })
    }
}
