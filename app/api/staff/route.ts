import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  
  const { data, error } = await supabase
    .from("staff")
    .select("*, departments(name), subjects(name)")
    .order("full_name")
  
  if (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  
  const { data, error } = await supabase
    .from("staff")
    .insert(body)
    .select("*, departments(name), subjects(name)")
    .single()
  
  if (error) {
    console.error("Error creating staff:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { id, ...staffData } = body
  
  const { data, error } = await supabase
    .from("staff")
    .update(staffData)
    .eq("id", id)
    .select("*, departments(name), subjects(name)")
    .single()
  
  if (error) {
    console.error("Error updating staff:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }
  
  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("id", id)
  
  if (error) {
    console.error("Error deleting staff:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
