import { NextResponse, type NextRequest } from 'next/server'

// Bu loyihada Supabase Auth o'rniga oddiy login tizimi ishlatiladi
// Shuning uchun bu middleware faol emas
export async function updateSession(request: NextRequest) {
  return NextResponse.next()
}
